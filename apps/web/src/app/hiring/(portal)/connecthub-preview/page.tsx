"use client";

import { useEffect, useState } from "react";
import { ChatInterface } from "@/components/connecthub/ChatInterface";
import { ContextPanel } from "@/components/connecthub/ContextPanel";
import { Scheduler } from "@/components/connecthub/Scheduler";
import { createClient } from "@/lib/supabase/client";
import { Loader2, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ConversationData = {
  id: string;
  candidateName: string;
  role: string;
  score: number;
  archetype: string;
  skills: string[];
  updatedAt: string;
  cvSubmissionId: string;
};

export default function HiringConnectHubPreview() {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [draftMessage, setDraftMessage] = useState("");
  const [systemMessage, setSystemMessage] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      // Get current user (hiring manager)
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setCurrentUserId(authData.user.id);
      }

      // Fetch conversations joined with cv_submissions
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          updated_at,
          cv_submission_id,
          cv_submissions (
            parsed_json,
            composite_score,
            archetype
          )
        `)
        .order('updated_at', { ascending: false });

      if (data && !error) {
        const formattedData: ConversationData[] = data.map((item: any) => {
          const parsed = item.cv_submissions?.parsed_json || {};
          return {
            id: item.id,
            candidateName: parsed.name || "Unknown",
            role: parsed.title || "Unknown Role",
            score: item.cv_submissions?.composite_score || 0,
            archetype: item.cv_submissions?.archetype || "Unknown Archetype",
            skills: parsed.skills || [],
            updatedAt: item.updated_at,
            cvSubmissionId: item.cv_submission_id
          };
        });

        setConversations(formattedData);
        if (formattedData.length > 0) {
          setSelectedConvId(formattedData[0].id);
        }
      }
      setLoading(false);
    };

    initData();

    // Listen for new conversations or updates
    const channel = supabase.channel('conversations_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          // Refetch to sync state on changes
          initData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleSelectSuggestion = (msg: string) => {
    setDraftMessage(msg);
  };

  const handleProposeTimes = (slots: any) => {
    setSystemMessage(`I've proposed some times to chat:\n- ${slots[0]?.date || slots[0]} \n- ${slots[1]?.date || slots[1] || ''}`);
    setTimeout(() => setSystemMessage(""), 100);
    setShowScheduler(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">ConnectHub (Hiring Manager View)</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Integrated communication OS. View candidates, chat directly, and review AI context.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden border border-zinc-200 rounded-2xl shadow-sm bg-white">
        
        {/* Sidebar: Conversation List */}
        <div className={`w-full md:w-72 bg-zinc-50 border-r border-zinc-200 flex-col shrink-0 ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-200 bg-white">
            <h3 className="font-semibold text-sm text-zinc-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              Active Chats
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-zinc-200">
            {conversations.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center mt-6">No active conversations.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all border ${
                    selectedConvId === conv.id 
                      ? "bg-white border-indigo-200 shadow-sm" 
                      : "bg-transparent border-transparent hover:bg-zinc-100/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm text-zinc-900">{conv.candidateName}</h4>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{conv.role}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedConv ? (
          <>
            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col relative bg-white ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
              <div className="md:hidden p-3 border-b border-zinc-200 bg-zinc-50 flex items-center">
                <button 
                  className="bg-white px-3 py-1.5 rounded-lg shadow-sm border border-zinc-200 text-sm font-bold text-zinc-700 flex items-center gap-2 hover:bg-zinc-50"
                  onClick={() => setSelectedConvId(null)}
                >
                  ← Back to Chats
                </button>
              </div>
              <ChatInterface 
                conversationId={selectedConv.id} 
                currentUserId={currentUserId} 
                candidateName={selectedConv.candidateName} 
                draftMessage={draftMessage}
                onDraftMessageChange={setDraftMessage}
                incomingSystemMessage={systemMessage}
                onToggleScheduler={() => setShowScheduler(!showScheduler)}
              />
              
              {/* Scheduler Overlay inside chat */}
              {showScheduler && (
                <div className="absolute right-6 top-20 z-10">
                  <Scheduler onProposeTimes={handleProposeTimes} />
                </div>
              )}
            </div>

            {/* AI Context Panel */}
            <ContextPanel 
              cvScore={selectedConv.score}
              archetype={selectedConv.archetype}
              matchedSkills={selectedConv.skills}
              interviewSessionId={selectedConv.id}
              onSelectSuggestion={handleSelectSuggestion}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 text-zinc-400">
            <MessageSquare className="w-12 h-12 mb-4 text-zinc-300" />
            <p>Select a conversation to start chatting.</p>
          </div>
        )}

      </div>
    </div>
  );
}
