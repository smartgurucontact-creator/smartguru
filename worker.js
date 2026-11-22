
export default {
  async fetch(request, env) {
    const allowedOrigin =
      "https://smartgurucontact-creator.github.io";

    const origin = request.headers.get("Origin");
    const corsHeaders = {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (origin !== allowedOrigin) {
      return new Response("Forbidden", { status: 403 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    try {
      if (!env.GEMINI_API_KEY) {
        throw new Error("AI key is not configured");
      }

      const body = await request.json();
      const question = String(body.message || "").trim();

      if (!question || question.length > 4000) {
        return Response.json(
          { error: "Please enter a valid message." },
          { status: 400, headers: corsHeaders }
        );
      }

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            model: "gemini-3.8-flash",
            input: question,
            system_instruction:
              "You are Smart Guru AI, a friendly educational assistant. Reply in the same language as the user. Support Hindi, English and Hinglish. Explain technology and coding in simple language."
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json(
          { error: "Gemini API request failed." },
          { status: 502, headers: corsHeaders }
        );
      }

      const answer = (data.steps || [])
        .filter(step => step.type === "model_output")
        .flatMap(step => step.content || [])
        .filter(item => item.type === "text")
        .map(item => item.text)
        .join("\n");

      return Response.json(
        { answer: answer || "Please try again." },
        { headers: corsHeaders }
      );

    } catch (error) {
      return Response.json(
        { error: "Something went wrong. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
