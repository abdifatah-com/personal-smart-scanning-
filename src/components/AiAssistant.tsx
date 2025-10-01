"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function AiAssistant() {
  const MODEL_NAME = "GPT4All Falcon~6"; // ensure this matches your locally installed model name
  const APP_CONTEXT = `You are the assistant for the Smart Scanning & Verification App.
Your job is to explain how the app works, guide users, and answer questions about
scanning food, medicines, cosmetics, and leaf health for farmers.
Stay helpful, clear, and friendly. When unsure, ask a brief clarifying question.`;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I’m your AI helper for scanning food, medicines, cosmetics, and plant leaves. Ask me anything or say what you want to scan." },
  ]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMsgs = [...messages, { role: "user", content: text } as Message];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch("http://127.0.0.1:4891/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [
            { role: "system", content: APP_CONTEXT },
            ...newMsgs.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await response.json();
      const reply = data?.choices?.[0]?.message?.content ?? "(No response)";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Could not reach local AI or model not found. Check that ${MODEL_NAME} is loaded at http://localhost:4891.` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center hover:bg-gray-800"
        aria-label="Open AI Assistant"
      >
        💬
      </button>

      {/* Chat Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="w-full max-w-sm mx-auto sm:rounded-2xl bg-white sm:mb-0 mb-0 p-4 shadow-2xl border sm:mx-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-black">AI Assistant</div>
              <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700">×</button>
            </div>
            <div ref={listRef} className="h-72 overflow-y-auto space-y-2 pr-1">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                  <div className={`inline-block px-3 py-2 rounded-xl text-sm ${m.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-800"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <div className="inline-block px-3 py-2 rounded-xl text-sm bg-gray-100 text-gray-800">Thinking…</div>
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center space-x-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                placeholder="Type your message…"
              />
              <button onClick={send} disabled={loading} className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">Send</button>
            </div>
            <div className="mt-2 text-[11px] text-gray-500">
              Using local API at http://localhost:4891 with context tuned for this app. Ensure your local model name matches.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

