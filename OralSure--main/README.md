# 🦷 OralSure: AI-Powered Oral Health Screening


**OralSure** is an advanced mobile health solution designed to bridge the gap between patients and dental professionals. Developed as a final year project at **VESIT**, it leverages Generative AI and OCR technology to provide instant oral health assessments and digitize clinical records.

---

## 🚀 Key Features

* **🤖 AI Oral Scanning:** Captures high-quality images of the oral cavity and uses a **Llama 3.1** backend to identify symptoms and categorize severity (Mild, Moderate, Severe).
* **📄 Smart Prescription Digitizer:** A hybrid OCR system (Google ML Kit + Groq LLM) that extracts medication names, dosages, and schedules from physical, even handwritten, prescriptions.
* **📍 Clinic Locator:** Integrates with **Google Places API** to find nearby dentists, providing real-time navigation and contact details.
* **💬 Clinical Intake Bot:** A smart chatbot that gathers patient history, lifestyle habits, and symptom details before providing a clinical summary.
* **🏥 Medical History Vault:** Securely stores all previous scans and digitized prescriptions using **Supabase** storage and PostgreSQL.

---

## 🛠️ Technical Architecture

### **Mobile App (Frontend)**
- **Framework:** React Native (TypeScript)
- **Image Handling:** `react-native-image-crop-picker` for precise alignment.
- **On-Device OCR:** `react-native-mlkit-ocr` for instant local fallback scanning.
- **UI/UX:** Styled with custom components and `SafeAreaData` for modern devices.

### **Backend & AI**
- **Server:** FastAPI (Python) hosted on Render.
- **LLM:** Llama 3.1-8b via **Groq Cloud** for high-speed clinical reasoning.
- **Database:** Supabase (Auth, PostgreSQL, and Storage).
- **OCR:** Tesseract OCR (Server-side) and ML Kit (Client-side).

---
