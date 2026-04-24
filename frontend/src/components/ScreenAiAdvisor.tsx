import React, { useState, useRef, useEffect } from "react";
import { Mic, Beaker, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "ai";
  text: string;
};

export default function ScreenAiAdvisor({ navigate }: { navigate: (screen: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi Ramesh! 👋 I'm your AI farming advisor. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.chat(userMsg);
      setMessages(prev => [...prev, { role: "ai", text: res.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative pb-4">
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
            {msg.role === "ai" && (
              <img src="/logo.jpeg" alt="AI Agent" className="w-10 h-10 rounded-full border border-slate-200 shrink-0" />
            )}
            <div className={`rounded-2xl p-4 shadow-sm max-w-[85%] ${
              msg.role === "ai" 
                ? "bg-white rounded-tl-none border border-slate-100 text-slate-700" 
                : "bg-emerald-900 text-white rounded-tr-none"
            }`}>
               {msg.role === "ai" ? (
                 <div className="prose prose-sm max-w-none text-slate-700 font-medium">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
               ) : (
                 <p className="text-sm font-medium">{msg.text}</p>
               )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <img src="/logo.jpeg" alt="AI Agent" className="w-10 h-10 rounded-full border border-slate-200 shrink-0" />
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 flex items-center gap-2">
               <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
               <span className="text-xs text-slate-400 font-medium">AI is thinking…</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
         <div className="flex gap-2 bg-slate-100 rounded-2xl p-2 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition">
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none focus:ring-0 px-3 text-sm font-medium text-slate-700"
              placeholder="Ask anything about your farm..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="w-10 h-10 bg-emerald-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-emerald-800 transition shadow-sm"
            >
               {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
         </div>
      </div>
      
    </div>
  );
}
