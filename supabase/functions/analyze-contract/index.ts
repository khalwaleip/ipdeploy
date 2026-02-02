// Follows Supabase Edge Functions structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.34.0"

declare const Deno: any;

// Access API Key from Server Environment (Not Browser!)
const apiKey = Deno.env.get('GEMINI_API_KEY') || '';

serve(async (req) => {
  // CORS Headers for your frontend
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file, userInfo } = await req.json();
    
    // Initialize AI Server-Side
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      You are the Senior IP Consultant at Khalwale & Co Advocates. Your client is ${userInfo.name}.
      DOCUMENT TYPE: Entertainment Contract (Music/Film).
      INSTRUCTIONS: Perform a comprehensive risk assessment (Kenyan/Intl Law).
      Format: Markdown.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: file.mimeType, data: file.base64 } },
          { text: prompt },
        ],
      },
      config: {
        thinkingConfig: { thinkingBudget: 4096 },
        temperature: 0.2,
      },
    });

    // TODO: Insert into Supabase Database here before returning
    // const supabase = createClient(...)
    // await supabase.from('contract_audits').insert(...)

    return new Response(
      JSON.stringify({ analysis: response.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})