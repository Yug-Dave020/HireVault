"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function ChatWithCV({ cvId, summary }: { cvId: string, summary: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: `I've analyzed this CV. ${summary ? `Here is a quick summary: ${summary}` : ''}\n\nWhat would you like to know about this candidate?` }
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const handleSend = async () => {
    if (!input.trim() || streaming) return;

    const userMsg = input.trim();
    setInput("");
    
    const newHistory = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newHistory);
    setStreaming(true);

    try {
      // Create a placeholder for the assistant's response
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      
      const res = await fetch("/api/hiring/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_submission_id: cvId,
          question: userMsg,
          conversation_history: newHistory.filter(m => m.role !== "system").slice(0, -1) // Exclude the current user msg we just added from history
        })
      });

      if (!res.ok) throw new Error("Failed to chat");
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let currentResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        currentResponse += chunk;
        
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = currentResponse;
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = "Error: Failed to connect to AI.";
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24" ref={scrollRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-600'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-zinc-100 text-zinc-900 rounded-tl-sm'
            }`}>
              {msg.content || (streaming && idx === messages.length - 1 ? <Loader2 className="w-4 h-4 animate-spin opacity-50" /> : "")}
            </div>
          </div>
        ))}
      </div>
      
      <div className="absolute bottom-0 inset-x-0 p-4 bg-white border-t border-zinc-100">
        <form 
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        >
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about specific skills or experience..."
            className="flex-1"
            disabled={streaming}
          />
          <Button type="submit" disabled={!input.trim() || streaming} className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
