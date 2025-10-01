"use client";
import { useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function FakeAssistant() {
  const { user } = useAuth();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);

  const displayName = useMemo(() => {
    const meta: any = user?.user_metadata || {};
    const explicit = meta.display_name || meta.full_name || meta.name || meta.username;
    if (explicit && typeof explicit === 'string') return explicit;
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  const onAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setThinking(true);
    setAnswer(null);
    try {
      // Client 'thinking' while server also delays slightly
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setAnswer(String(data.answer || ""));
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setAnswer("Something went wrong. Please try again.");
      setSuggestions([]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-0 shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="text-sm font-semibold text-black">Assistant</div>
        {thinking ? (
          <div className="flex items-center text-xs text-gray-600">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
            Typing…
          </div>
        ) : (
          <div className="text-xs text-gray-500">Online</div>
        )}
      </div>

      <div className="p-3 space-y-3">
        <div className="max-w-[85%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-800">
          Welcome, <span className="font-semibold">{displayName}</span>. How can I help?
        </div>

        {answer !== null && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl bg-white text-black px-3 py-2 text-sm border border-gray-200 shadow-sm">
              {answer}
            </div>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="pt-1">
            <div className="text-xs text-gray-500 mb-1">Try one of these:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setQuestion(s); setAnswer(null); setSuggestions([]); }}
                  className="text-xs px-2 py-1 rounded-full border border-gray-300 hover:bg-gray-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={onAsk} className="flex items-stretch space-x-2 pt-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about scanning, expiry, export, plans…"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20"
          />
          <button
            type="submit"
            className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}

