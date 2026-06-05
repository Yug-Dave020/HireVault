"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DollarSign, MessageSquare, Send, Award, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NegotiateClient({ userId }: { userId: string }) {
  const [session, setSession] = useState<any>(null);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [baseOffer, setBaseOffer] = useState("");
  const [hiddenBudget, setHiddenBudget] = useState("");
  const [currentOffer, setCurrentOffer] = useState(0);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const startSession = async () => {
    if (!company || !role || !baseOffer || !hiddenBudget) return;
    setLoading(true);
    const initOffer = parseInt(baseOffer, 10);
    const newSession = {
      id: crypto.randomUUID(),
      user_id: userId,
      company_name: company,
      role_title: role,
      base_offer: initOffer,
      hidden_budget: parseInt(hiddenBudget, 10),
    };
    
    setSession(newSession);
    setCurrentOffer(initOffer);
    setMessages([{
      role: "ai",
      content: `Hi! We're thrilled to offer you the ${role} position at ${company}. We're starting at $${initOffer.toLocaleString()}. How does that sound?`,
      current_offer: initOffer
    }]);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!input.trim() || !session) return;
    
    const userMessage = input;
    setInput("");
    
    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_WORKER_WS_URL?.replace("ws://", "http://").replace("wss://", "https://") || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/negotiate/turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          user_message: userMessage,
          current_offer: currentOffer,
          hidden_budget: session.hidden_budget,
          history: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      if (!res.ok) throw new Error("API responded with an error");
      const data = await res.json();
      setCurrentOffer(data.new_offer ?? currentOffer);
      setMessages([...newMessages, {
        role: "ai",
        content: data.ai_response,
        current_offer: data.new_offer,
        feedback_score: data.feedback_score
      }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-8 bg-white min-h-screen text-[#0f141e]">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <DollarSign className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">Offer Negotiation Simulator</h1>
          <p className="text-zinc-500">Practice your salary negotiation skills against a simulated AI recruiter with a hidden budget constraint.</p>
        </div>
        
        <div className="space-y-4 bg-zinc-50 p-6 rounded-[24px] border border-zinc-200">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Company Name</label>
            <input value={company} onChange={e => setCompany(e.target.value)} className="w-full border border-zinc-300 rounded-md px-4 py-2" placeholder="e.g. Google" />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Role Title</label>
            <input value={role} onChange={e => setRole(e.target.value)} className="w-full border border-zinc-300 rounded-md px-4 py-2" placeholder="e.g. Senior Frontend Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Initial Offer ($)</label>
              <input type="number" value={baseOffer} onChange={e => setBaseOffer(e.target.value)} className="w-full border border-zinc-300 rounded-md px-4 py-2" placeholder="120000" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">AI Hidden Budget Max ($)</label>
              <input type="number" value={hiddenBudget} onChange={e => setHiddenBudget(e.target.value)} className="w-full border border-zinc-300 rounded-md px-4 py-2" placeholder="150000" />
            </div>
          </div>
          <Button onClick={startSession} disabled={loading} className="w-full bg-[#1a91f0] text-white rounded-md mt-4">
            Start Roleplay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden text-[#0f141e]">
      <div className="w-2/3 flex flex-col h-full bg-white border-r border-zinc-200">
        <div className="p-6 border-b border-zinc-200 flex items-center gap-4 flex-shrink-0">
          <MessageSquare className="h-6 w-6 text-[#1a91f0]" />
          <div>
            <h2 className="font-bold text-lg">Negotiation Roleplay</h2>
            <p className="text-xs text-zinc-500">Recruiter for {session.role_title} at {session.company_name}</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] rounded-[20px] p-4 ${m.role === 'user' ? 'bg-[#1a91f0] text-white rounded-br-none' : 'bg-zinc-100 text-zinc-800 rounded-bl-none'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-100 text-zinc-800 rounded-[20px] rounded-bl-none p-4 flex gap-1">
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-zinc-200 bg-white flex gap-2 flex-shrink-0">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your response..."
            className="flex-1 border border-zinc-300 rounded-md px-4 py-3 focus:outline-none focus:border-[#1a91f0]"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()} className="bg-[#1a91f0] text-white px-6 rounded-md">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="w-1/3 p-8 space-y-6 bg-white overflow-y-auto">
        <h3 className="font-bold text-xl mb-4">Offer Tracker</h3>
        
        <div className="bg-green-50 border border-green-200 rounded-[24px] p-6 text-center">
          <p className="text-xs font-bold uppercase text-green-600 mb-2">Current Offer on the Table</p>
          <div className="text-4xl font-black text-green-700">${currentOffer.toLocaleString()}</div>
          {currentOffer > session.base_offer && (
            <div className="mt-2 text-sm font-bold text-green-600 flex items-center justify-center gap-1">
              <ArrowRight className="h-4 w-4" /> 
              +${(currentOffer - session.base_offer).toLocaleString()} from base
            </div>
          )}
        </div>
        
        {messages.filter(m => m.role === 'ai' && m.feedback_score).map((m, i) => (
          <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-[20px] p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${m.feedback_score >= 70 ? 'bg-green-500' : m.feedback_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}>
              {m.feedback_score}
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-zinc-500">Tactic Effectiveness</p>
              <p className="text-sm font-semibold mt-1 text-zinc-800">
                {m.feedback_score >= 70 ? 'Strong positioning' : m.feedback_score >= 40 ? 'Moderate push' : 'Weak leverage'}
              </p>
            </div>
          </div>
        )).reverse()}
      </div>
    </div>
  );
}
