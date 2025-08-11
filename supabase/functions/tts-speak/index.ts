import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TTSPayload {
  text: string;
  voiceId?: string;
  modelId?: string;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  // deno-lint-ignore no-deprecated-deno-api
  return btoa(binary);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ELEVENLABS_API_KEY secret" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { text, voiceId, modelId } = (await req.json()) as TTSPayload;
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Invalid request: text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const VOICE_ID = voiceId || "9BWtsMINqrJLrRacOk9x"; // Aria
    const MODEL_ID = modelId || "eleven_turbo_v2_5";

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        model_id: MODEL_ID,
        text,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("ElevenLabs error:", err);
      return new Response(JSON.stringify({ error: "Upstream TTS error" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const arrayBuffer = await resp.arrayBuffer();
    const base64 = bytesToBase64(new Uint8Array(arrayBuffer));

    return new Response(JSON.stringify({ audio: base64, contentType: "audio/mpeg" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("tts-speak error", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});