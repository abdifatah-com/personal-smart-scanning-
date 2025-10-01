"use client";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AiLauncher() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'assistant', content: string }>>([]);
  const [thinking, setThinking] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [lastResetDate, setLastResetDate] = useState("");
  const [limitExpiresAt, setLimitExpiresAt] = useState<number | null>(null);
  const [showLimitReached, setShowLimitReached] = useState(false);
  const { user } = useAuth();

  const DAILY_LIMIT = 3;

  const predefinedQuestions = [
    "How do I scan a barcode?",
    "What is the difference between plans?",
    "How do I check expiry dates?",
    "How do I export my data?",
    "What is leaf scanning?",
    "How do I upgrade my plan?",
    "What sources do you use for product data?",
    "How do I set up the database?"
  ];

  const displayName = useMemo(() => {
    const meta: any = user?.user_metadata || {};
    const explicit = meta.display_name || meta.full_name || meta.name || meta.username;
    if (explicit && typeof explicit === 'string') return explicit;
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  // Load usage window (3 hours) from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
      const now = Date.now();
      const stored = localStorage.getItem('ai_usage');
      let data: any = null;
      try { data = stored ? JSON.parse(stored) : null; } catch {}

      // Support legacy daily format by resetting into a 3-hour window
      if (!data || typeof data.expiresAt !== 'number' || now > data.expiresAt) {
        const expiresAt = now + THREE_HOURS_MS;
        setQuestionsUsed(0);
        setLastResetDate(new Date(now).toLocaleString());
        setLimitExpiresAt(expiresAt);
        localStorage.setItem('ai_usage', JSON.stringify({ expiresAt, count: 0 }));
      } else {
        setQuestionsUsed(Number(data.count || 0));
        setLimitExpiresAt(Number(data.expiresAt));
        setLastResetDate(new Date(now).toLocaleString());
      }
    }
  }, []);

  // Save usage to localStorage
  const saveUsage = (count: number) => {
    if (typeof window !== 'undefined') {
      const expiresAt = typeof limitExpiresAt === 'number' ? limitExpiresAt : Date.now() + (3 * 60 * 60 * 1000);
      localStorage.setItem('ai_usage', JSON.stringify({ expiresAt, count }));
    }
  };

  // Persist chat messages so closing/reopening preserves the same conversation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('ai_chat_messages');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Array<{ type: 'user' | 'assistant', content: string }>;
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('ai_chat_messages', JSON.stringify(messages));
  }, [messages]);

  const getNextAvailableTime = () => {
    const ms = typeof limitExpiresAt === 'number' ? limitExpiresAt : Date.now() + (3 * 60 * 60 * 1000);
    return new Date(ms);
  };

  const onAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    // Refresh window if expired
    const now = Date.now();
    if (typeof limitExpiresAt === 'number' && now > limitExpiresAt) {
      const newExpires = now + (3 * 60 * 60 * 1000);
      setQuestionsUsed(0);
      setLimitExpiresAt(newExpires);
      localStorage.setItem('ai_usage', JSON.stringify({ expiresAt: newExpires, count: 0 }));
    }

    // Check if user has reached limit in current window
    if (questionsUsed >= DAILY_LIMIT) {
      setShowLimitReached(true);
      return;
    }
    
    const userMessage = question.trim();
    setQuestion(""); // Clear input immediately
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setThinking(true);
    
    try {
      const res = await fetch("/api/faq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { type: 'assistant', content: String(data.answer || "Something went wrong. Please try again.") }]);
      
      // Increment usage counter
      const newCount = questionsUsed + 1;
      setQuestionsUsed(newCount);
      saveUsage(newCount);
      if (newCount >= DAILY_LIMIT) {
        // Pop the limit modal after delivering the 3rd answer
        setShowLimitReached(true);
      }
      
      // Show suggestions after first answer
      if (messages.length === 0) {
        setShowSuggestions(true);
      }
    } catch {
      setMessages(prev => [...prev, { type: 'assistant', content: "Something went wrong. Please try again." }]);
      if (messages.length === 0) {
        setShowSuggestions(true);
      }
      
      // Still increment counter even on error
      const newCount = questionsUsed + 1;
      setQuestionsUsed(newCount);
      saveUsage(newCount);
      if (newCount >= DAILY_LIMIT) {
        setShowLimitReached(true);
      }
    } finally {
      setThinking(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (questionsUsed >= DAILY_LIMIT) {
      setShowLimitReached(true);
      return;
    }
    setQuestion(suggestion);
    setShowSuggestions(false);
  };

  const closeLimitModal = () => {
    setShowLimitReached(false);
  };

  return (
    <>
      {/* Floating icon button */}
      <button
        aria-label="Open assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center z-50 hover:bg-gray-800 transition-all duration-200"
      >
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 3.866-4.03 7-9 7a10.8 10.8 0 01-3-.42L4 20l1.42-3A7.6 7.6 0 013 12c0-3.866 4.03-7 9-7s9 3.134 9 7z" />
        </svg>
      </button>

      {/* AI Assistant Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          
          {/* Modal */}
          <div className="relative w-full max-w-md h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${questionsUsed >= DAILY_LIMIT ? 'bg-red-500' : 'bg-green-500'}`}></div>
                <span className="font-semibold text-black">AI Assistant</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full bg-black text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                aria-label="Close assistant"
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Welcome message */}
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-800">
                  Welcome, <span className="font-semibold">{displayName}</span>. How can I help?
                </div>
              </div>

              {/* Chat messages */}
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    message.type === 'user' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}

              {/* Thinking indicator */}
              {thinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-gray-100 px-3 py-2 text-sm text-gray-600 flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              {/* Question Suggestions */}
              {showSuggestions && !thinking && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500 font-medium">💡 Try asking one of these:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {predefinedQuestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="text-left p-3 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 text-sm text-gray-700"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400 text-center">
                    These are the topics I can help you with
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <form onSubmit={onAsk} className="flex space-x-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about scanning, expiry, export..."
                  disabled={questionsUsed >= DAILY_LIMIT}
                  className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || thinking || questionsUsed >= DAILY_LIMIT}
                  className="rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Ask
                </button>
              </form>
              <div className="mt-2 text-[11px] text-gray-500 text-center">
                {Math.max(DAILY_LIMIT - questionsUsed, 0)} questions left today
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limit Reached Modal */}
      {showLimitReached && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeLimitModal} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Limit Reached</h3>
              <p className="text-sm text-gray-600 mb-4">
                You've used all 3 questions in this 3-hour window. Upgrade to Premium or Advanced for unlimited AI assistance.
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Next questions available at:</p>
                <p className="text-sm font-mono text-gray-700">
                  {getNextAvailableTime().toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={closeLimitModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeLimitModal();
                    // Navigate to plans page
                    window.location.href = '/dashboard?tab=plans';
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

