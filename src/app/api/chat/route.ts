import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const HF_MODEL = "tiiuae/falcon-7b-instruct";

export async function POST(req: NextRequest) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing HUGGINGFACE_API_KEY" },
      { status: 500 }
    );
  }

  let body: { messages: ChatMessage[]; max_new_tokens?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { messages, max_new_tokens = 256 } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "'messages' must be a non-empty array" },
      { status: 400 }
    );
  }

  // Build a single prompt compatible with instruct models
  const systemMessage = messages.find((m) => m.role === "system");
  const conversation = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `${systemMessage ? `System: ${systemMessage.content}\n\n` : ""}${conversation}\nASSISTANT:`;

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${encodeURIComponent(
        HF_MODEL
      )}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens,
            temperature: 0.7,
            return_full_text: false,
          },
        }),
        // Falcon is not streamed on Inference API for text-generation
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Hugging Face API error: ${errorText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    // Response could be array of generated_text objects or error dict
    const text = Array.isArray(data) && data[0]?.generated_text
      ? String(data[0].generated_text)
      : typeof data === "object" && data?.generated_text
      ? String((data as any).generated_text)
      : JSON.stringify(data);

    return NextResponse.json({ reply: text });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to contact Hugging Face" },
      { status: 500 }
    );
  }
}

