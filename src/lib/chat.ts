export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chatWithAssistant(
  messages: ChatMessage[],
  options?: { max_new_tokens?: number }
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, max_new_tokens: options?.max_new_tokens }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  const data = await res.json();
  return String(data.reply ?? "");
}

