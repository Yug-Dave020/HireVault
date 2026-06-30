"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Phone, Video, Calendar, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  is_system_message: boolean;
  created_at: string;
}

export function ChatInterface({ 
  conversationId, 
  currentUserId,
  candidateName = "Candidate",
  draftMessage = "",
  onDraftMessageChange,
  incomingSystemMessage = ""
}: { 
  conversationId: string;
  currentUserId: string;
  candidateName?: string;
  draftMessage?: string;
  onDraftMessageChange?: (msg: string) => void;
  incomingSystemMessage?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (draftMessage) {
      setNewMessage(draftMessage);
    }
  }, [draftMessage]);

  useEffect(() => {
    if (incomingSystemMessage) {
      const sysMsg: Message = {
        id: Math.random().toString(),
        sender_id: "system",
        content: incomingSystemMessage,
        is_system_message: true,
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, sysMsg]);
      scrollToBottom();
    }
  }, [incomingSystemMessage]);

  useEffect(() => {
    if (conversationId === "preview-conversation") {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
        
      if (data) setMessages(data);
      setLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    // Subscribe to real-time message updates
    const channel = supabase.channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          // If we already added it optimistically, don't duplicate
          setMessages((prev) => {
            const exists = prev.find(m => m.id === payload.new.id || (m.content === payload.new.content && m.sender_id === payload.new.sender_id && new Date(payload.new.created_at).getTime() - new Date(m.created_at).getTime() < 2000));
            if (exists) return prev;
            return [...prev, payload.new as Message];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, supabase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempMsg = newMessage;
    setNewMessage("");
    if (onDraftMessageChange) onDraftMessageChange("");

    const mockMsg: Message = {
      id: Math.random().toString(),
      sender_id: currentUserId,
      content: tempMsg,
      is_system_message: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, mockMsg]);
    scrollToBottom();

    if (conversationId !== "preview-conversation") {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: tempMsg,
        is_system_message: false
      });
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-white text-zinc-900 rounded-xl overflow-hidden border border-zinc-200 shadow-xl">
      {/* Chat Header */}
      <div className="h-16 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold uppercase text-sm border border-indigo-200">
            {candidateName.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold text-zinc-900">{candidateName}</h2>
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Online
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 mt-10 text-sm">
            This is the start of your conversation with {candidateName}.
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            
            if (msg.is_system_message) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-zinc-100 text-zinc-500 text-xs px-3 py-1.5 rounded-full border border-zinc-200">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${isMe ? "bg-[#1da074] text-white rounded-tr-sm" : "bg-zinc-100 text-zinc-900 rounded-tl-sm border border-zinc-200"}`}>
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-zinc-50 border-t border-zinc-200 shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-white border border-zinc-300 rounded-xl p-2 focus-within:ring-1 focus-within:ring-[#1da074] transition-all">
          <Button type="button" variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 shrink-0 h-10 w-10">
            <FileText className="w-4 h-4" />
          </Button>
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (onDraftMessageChange) onDraftMessageChange(e.target.value);
            }}
            placeholder={`Message ${candidateName}...`}
            className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-900 resize-none h-10 max-h-32 py-2.5 text-sm scrollbar-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim()} 
            className="bg-[#1da074] hover:bg-[#15805c] text-white rounded-lg h-10 w-10 p-0 shrink-0 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
