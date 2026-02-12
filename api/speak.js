export const runtime = "nodejs";

export async function POST(req) {
  console.log("KEY:", process.env.SARVAM_API_KEY ? "exists" : "missing");
cs
  try {
    const { text, voice } = await req.json();

    if (!text || text.length < 3) {
      return new Response(JSON.stringify({ error: "Invalid text" }), {
        status: 400,
      });
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SARVAM_API_KEY}`,
      },
      body: JSON.stringify({
        text,
        voice: voice || "meera",
      }),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "TTS request failed" }), {
      status: 500,
    });
  }
}
