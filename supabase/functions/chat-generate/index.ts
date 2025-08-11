import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequestBody {
  message: string;
  role?: string;
  route?: string;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY secret" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { message, role, route, history = [] } = (await req.json()) as ChatRequestBody;
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Invalid request: message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const systemPrompt = `You are an in-app assistant for an Inclusive Learning System (ILS). \n\n` +
      `Guidelines: \n` +
      `- Be concise and practical. \n` +
      `- Use step-by-step instructions when helpful. \n` +
      `- Never claim to perform actions; you only provide guidance. \n` +
      `- If asked to change settings or navigate, describe how to do it in the UI. \n` +
      `Context: role=${role ?? "unknown"}, route=${route ?? "/"}.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: String(message).slice(0, 2000) },
    ];

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.2,
        max_tokens: 400,
      }),
    });

    if (!openaiResp.ok) {
      const errText = await openaiResp.text();
      console.error("OpenAI error:", errText);
      return new Response(JSON.stringify({ error: "Upstream error" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = await openaiResp.json();
    const reply: string = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("chat-generate error", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});