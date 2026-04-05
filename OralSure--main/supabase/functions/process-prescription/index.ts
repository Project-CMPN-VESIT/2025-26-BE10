import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}));
    if (!body || !body.image) {
      return new Response(JSON.stringify({ error: "No image data received" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get('OCR_SPACE_API_KEY')
    if (!apiKey) throw new Error("API Key Secret is missing");

    // FIX: Use URLSearchParams instead of FormData for better memory management
    const params = new URLSearchParams();
    params.append('base64Image', `data:image/jpg;base64,${body.image}`);
    params.append('apikey', apiKey);
    params.append('OCREngine', '2');
    params.append('isOverlayRequired', 'true');

    const res = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const result = await res.json();

    if (!result || result.OCRExitCode !== 1) {
      // Return 200 but with an error message so the APP doesn't crash on 500
      return new Response(JSON.stringify({ 
        error: result?.ErrorMessage?.[0] || "OCR Parsing failed" 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, 
      });
    }

    const parsedResult = result.ParsedResults?.[0] || {};
    const payload = {
      rawText: parsedResult.ParsedText || "",
      structuredMeds: (parsedResult.TextOverlay?.Lines || []).slice(0, 5).map((l: any) => ({
        name: l.LineText,
        x: 10, 
        y: 10
      }))
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Critical Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, // Changed to 200 so the app receives the error JSON safely
    });
  }
})