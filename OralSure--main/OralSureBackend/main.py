import os
import re
import json
import requests
import io
from typing import Optional, List, Dict
from collections import Counter
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq
from supabase import create_client, Client, ClientOptions
from PIL import Image
import pytesseract

# =====================================================
# INITIALIZATION & API KEYS
# =====================================================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = "https://knhwgysrtwjdjegddkyx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuaHdneXNydHdqZGplZ2Rka3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAwOTIzNSwiZXhwIjoyMDgyNTg1MjM1fQ.L5xB3M0C6JEKca5Eh0b1hTrSmeG6pYZve-HjO7UD8ZQ" 
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(postgrest_client_timeout=40.0, schema="public"))

os.environ["GROQ_API_KEY"] = ""
model = ChatGroq(model="llama-3.1-8b-instant", temperature=0.1)

# =====================================================
# CLINICAL REGISTRIES
# =====================================================
INTAKE_QUESTIONS = [
    "1. Please provide your Full Name, Age, and Gender:",
    "2. How often do you brush daily? Do you use tobacco (Daily/Occasionally/No)?",
    "3. Are you on any medications or have existing conditions (Diabetes, Heart issues, etc.)?"
]

SYMPTOM_QUESTIONS = [
    "4. Please describe your main concern (e.g., pain, swelling, bleeding):",
    "Which area of your mouth is affected?",
    "When did you first notice this problem?",
    "How is the sensation? (Sharp, throbbing, dull ache)?",
    "What triggers it? (Hot, cold, chewing)?",
    "Are there other symptoms like fever or a bad taste?",
    "Are there any other details you'd like to share?"
]

CLINICAL_VOCABULARY = {
    "severe": 3, "throbbing": 3, "pus": 3, "abscess": 3, "fever": 3,
    "swelling": 3, "swollen": 3, "cannot sleep": 3, "radiating": 3,
    "unbearable": 3, "emergency": 3, "trauma": 3, "knocked": 3,
    "ulcer": 3, "growth": 3, "lump": 3, "bleeding": 2, "ache": 2, 
    "sore": 2, "sharp": 2, "cavity": 2, "sensitivity": 1, "mild": 1
}

SUPERLATIVE_KEYWORDS = ["worst", "unbearable", "excruciating", "agony", "can't sleep"]

CLINICAL_CLUSTERS = {
    "emergency_abscess": {"keywords": ["pus", "swelling", "fever", "abscess"], "severity": "severe"},
    "acute_pulpitis": {"keywords": ["throbbing", "sharp", "radiating", "hot"], "severity": "severe"},
    "trauma": {"keywords": ["knocked", "broken", "chipped", "accident"], "severity": "severe"}
}

# =====================================================
# ADVANCED NLP UTILS
# =====================================================
def contextual_severity_analysis(text):
    text_lower = text.lower()
    worsening_terms = ["worse", "worsening", "spreading", "getting worse", "increasing"]
    trajectory = "worsening" if any(w in text_lower for w in worsening_terms) else "stable"
    return {"trajectory": trajectory}

def analyze_sentiment(text):
    instruction = f"Analyze distress in dental complaint: '{text}'. Return ONE word: calm / concerned / distressed / critical"
    try:
        response = model.invoke(instruction).content.strip().lower()
        return response
    except:
        return "concerned"

def integrated_severity_analysis(text):
    tokens = re.findall(r'\b\w+\b', text.lower())
    score = sum(CLINICAL_VOCABULARY[t] for t in tokens if t in CLINICAL_VOCABULARY)
    has_super = any(sup in text.lower() for sup in SUPERLATIVE_KEYWORDS)
    context = contextual_severity_analysis(text)
    sentiment = analyze_sentiment(text)
    
    severity = "mild"
    if score >= 6 or has_super or sentiment in ["distressed", "critical"]:
        severity = "severe"
    elif score >= 3 or context["trajectory"] == "worsening":
        severity = "moderate"
    
    for cluster in CLINICAL_CLUSTERS.values():
        if any(kw in text.lower() for kw in cluster["keywords"]) and cluster["severity"] == "severe":
            severity = "severe"

    return {
        "severity": severity, 
        "recommendation": "Urgent dental care advised." if severity == "severe" else "Monitor and schedule a checkup."
    }

def parse_intake_data(phase_idx, text):
    prompts = [
        f"Extract patient info from: '{text}'. Return ONLY JSON with keys: full_name (str), age (int), gender (str).",
        f"Extract lifestyle from: '{text}'. Return ONLY JSON with keys: brushing_frequency (str), tobacco_use (str).",
        f"Extract medical info from: '{text}'. Return ONLY JSON with keys: medication_status (str)."
    ]
    try:
        response = model.invoke(prompts[phase_idx]).content
        match = re.search(r'\{.*\}', response, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {}
    except Exception as e:
        print(f"Extraction Error: {e}")
        return {}

# =====================================================
# API ENDPOINTS
# =====================================================
class ChatRequest(BaseModel):
    user_id: str
    message: str

class FinalizeReportRequest(BaseModel):
    user_id: str
    scan_id: str
    scan_data: dict 

class OCRRequest(BaseModel):
    user_id: str
    image_url: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    uid, user_input = request.user_id, request.message

    try:
        res = supabase.table("profiles").select("*").eq("id", uid).execute()
        profile = res.data[0] if res.data else None
        
        if not profile:
            supabase.table("profiles").insert({"id": uid, "flow_type": "INTAKE", "q_idx": 0}).execute()
            return {"reply": INTAKE_QUESTIONS[0], "action": "ASK"}

        q_idx = profile.get("q_idx", 0)
        flow = profile.get("flow_type")
        buffer = profile.get("buffer") or ""
        awaiting_visit = profile.get("awaiting_visit", False)

        # --- INITIALIZATION LOGIC ---
        if user_input == "INITIALIZE_WELCOME":
            if awaiting_visit:
                return {
                    "reply": f"Welcome back! I noticed we recommended a dental visit. Did you manage to see the doctor? (Yes/No)",
                    "action": "ASK_VISIT_CONFIRMATION"
                }
            elif profile.get("last_severity"):
                supabase.table("profiles").update({"flow_type": "RETURNING", "q_idx": 0}).eq("id", uid).execute()
                return {"reply": f"Welcome back, {profile.get('full_name', 'there')}! Is your previous issue Better, Same, or Worse?", "action": "ASK"}
            else:
                supabase.table("profiles").update({"flow_type": "INTAKE", "q_idx": 0}).eq("id", uid).execute()
                return {"reply": INTAKE_QUESTIONS[0], "action": "ASK"}

        # --- VISIT HANDSHAKE LOGIC (Handles Button Clicks) ---
        if awaiting_visit and flow != "SYMPTOMS":
            if "yes" in user_input.lower():
                return {
                    "reply": "Excellent. Please upload a photo of your prescription so I can update your digital records.",
                    "action": "NAVIGATE_PRESCRIPTION_UPLOAD"
                }
            elif "no" in user_input.lower():
                # Switch flow to RETURNING to assess current state after missing visit
                supabase.table("profiles").update({
                    "flow_type": "RETURNING", 
                    "q_idx": 0
                }).eq("id", uid).execute()

                return {
                    "reply": "I understand. It's important to see a professional. I'll set a reminder for you. In the meantime, let's keep track: Is your previous issue feeling Better, Same, or Worse?",
                    "action": "SET_CLINIC_REMINDER"
                }

        # --- FLOW: INTAKE QUESTIONS ---
        if flow == "INTAKE":
            if q_idx < len(INTAKE_QUESTIONS):
                extracted = parse_intake_data(q_idx, user_input)
                valid_updates = {k: v for k, v in extracted.items() if v}
                update_data = {**valid_updates, "q_idx": q_idx + 1}
                supabase.table("profiles").update(update_data).eq("id", uid).execute()
                
                if q_idx + 1 < len(INTAKE_QUESTIONS):
                    return {"reply": INTAKE_QUESTIONS[q_idx + 1], "action": "ASK"}
                else:
                    supabase.table("profiles").update({"flow_type": "SYMPTOMS", "q_idx": 0}).eq("id", uid).execute()
                    return {"reply": "Profile updated. Now, " + SYMPTOM_QUESTIONS[0], "action": "ASK"}

        # --- FLOW: SYMPTOM COLLECTION & ANALYSIS ---
        if flow == "SYMPTOMS":
            if q_idx < len(SYMPTOM_QUESTIONS):
                new_buffer = (buffer + " " + user_input).strip()
                new_idx = q_idx + 1
                supabase.table("profiles").update({"buffer": new_buffer, "q_idx": new_idx}).eq("id", uid).execute()

                if new_idx < len(SYMPTOM_QUESTIONS):
                    return {"reply": SYMPTOM_QUESTIONS[new_idx], "action": "ASK"}
                
                analysis = integrated_severity_analysis(new_buffer)
                severity = analysis["severity"]
                
                # Flag awaiting visit for higher severity
                awaiting_flag = True if severity in ["moderate", "severe"] else False

                supabase.table("profiles").update({
                    "q_idx": 0, "buffer": new_buffer, "last_severity": severity, 
                    "flow_type": "IDLE", "awaiting_visit": awaiting_flag
                }).eq("id", uid).execute()
                
                action = "TRIGGER_CAMERA" if severity in ["moderate", "severe"] else "NAVIGATE_REMEDIES"
                return {"reply": f"Analysis: {severity.upper()}. {analysis['recommendation']}", "action": action}

        # --- FLOW: RETURNING EVALUATION ---
        if flow == "RETURNING":
            if any(word in user_input.lower() for word in ["worse", "same"]):
                # Reset buffer for a fresh assessment if condition is persistent or deteriorating
                supabase.table("profiles").update({"flow_type": "SYMPTOMS", "q_idx": 0, "buffer": ""}).eq("id", uid).execute()
                return {"reply": "I'm concerned that you're not seeing improvement. Let's re-evaluate carefully. " + SYMPTOM_QUESTIONS[0], "action": "ASK"}
            else:
                supabase.table("profiles").update({"flow_type": "IDLE", "q_idx": 0}).eq("id", uid).execute()
                return {"reply": "Glad you're improving! Keep up your hygiene routine. Let me know if anything changes.", "action": "IDLE"}

        return {"reply": "How can I help you today?", "action": "IDLE"}

    except Exception as e:
        print(f"Chat Error: {e}")
        return {"reply": "Clinical server is busy. Please try again.", "action": "ASK"}

# --- PHASE 6: OCR ENDPOINT ---
@app.post("/process_prescription")
async def process_prescription(request: OCRRequest):
    try:
        img_url = request.image_url
        if not img_url.startswith("http"):
            clean_path = img_url.replace("prescription-uploads/", "").strip()
            signed_res = supabase.storage.from_("prescription-uploads").create_signed_url(clean_path, 60)
            img_url = signed_res['signedURL']

        response = requests.get(img_url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Could not fetch image from Supabase")
        img = Image.open(io.BytesIO(response.content))
        
        # Perform OCR
        raw_text = pytesseract.image_to_string(img)
        
        # Extract structured info using LLM
        prompt = (
            f"You are a clinical assistant. Extract medications from this OCR text: '{raw_text}'. "
            "Return ONLY a JSON array of objects with keys: 'name', 'dosage', 'frequency', and 'duration'. "
            "If no medications are found, return an empty array []."
        )

        llm_res = model.invoke(prompt).content
        meds = []

        try: 
            match = re.search(r'\[.*\]', llm_res, re.DOTALL)
            meds = json.loads(match.group()) if match else []     
        except: meds = []
        
        # Save to database
        supabase.table("prescriptions").insert({
            "user_id": request.user_id,
            "ocr_raw": raw_text,
            "medications": meds
        }).execute()
        
        # Reset awaiting_visit flag and clean up state
        supabase.table("profiles").update({
            "awaiting_visit": False, 
            "visit_status": "Completed",
            "flow_type": "IDLE"
        }).eq("id", request.user_id).execute()

        return {"status": "success", "extracted_meds": meds}
    except Exception as e:
        print(f"OCR Processing Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/finalize_report")
async def finalize_report(request: FinalizeReportRequest):
    try:
        uid = request.user_id
        res = supabase.table("profiles").select("*").eq("id", uid).execute()

        if not res.data:
            raise HTTPException(status_code=404, detail="User profile not found. Please complete intake.")
        
        profile = res.data[0]
        severity = profile.get("last_severity", "mild")
        
        advice = "🚨 URGENT: Professional evaluation required." if severity == "severe" else "✅ Standard monitoring recommended."

        inserted = supabase.table("reports").insert({
            "user_id": uid,
            "scan_id": request.scan_id,
            "full_name": profile.get("full_name", "Unknown Patient"),
            "age": profile.get("age"),
            "gender": profile.get("gender"),
            "clinical_summary": profile.get("buffer", "No symptoms recorded."),
            "visual_analysis": request.scan_data,
            "final_severity": severity.upper(),
            "home_care_advice": advice
        }).execute()
        supabase.table("profiles").update({
            "last_severity": None,
            "buffer": ""
        }).eq("id", uid).execute()

        # if not inserted.data:
        #     raise HTTPException(status_code=500, detail="Database failed to save report.")

        return {"status": "success", "report_id": inserted.data[0]['id']}
    except Exception as e:
        print(f"Finalize Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)