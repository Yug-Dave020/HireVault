"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/connecthub/ChatInterface";
import { ContextPanel } from "@/components/connecthub/ContextPanel";
import { Scheduler } from "@/components/connecthub/Scheduler";

export default function HiringConnectHubPreview() {
  const [draftMessage, setDraftMessage] = useState("");
  const [systemMessage, setSystemMessage] = useState("");

  const handleSelectSuggestion = (msg: string) => {
    setDraftMessage(msg);
  };

  const handleProposeTimes = (slots: any) => {
    setSystemMessage(`I've proposed some times to chat:\n- ${slots[0]?.date} at ${slots[0]?.time}\n- ${slots[1]?.date} at ${slots[1]?.time}`);
    // Clear system message after a moment so it can be re-triggered
    setTimeout(() => setSystemMessage(""), 100);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">ConnectHub (Hiring Manager View)</h1>
        <p className="text-sm text-zinc-500 mt-1">
          This is a preview of the integrated communication OS. The Chat Interface and AI Context Panel are mounted side-by-side.
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden border border-zinc-200 rounded-2xl shadow-sm bg-white">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative">
          <ChatInterface 
            conversationId="preview-conversation" 
            currentUserId="hm-123" 
            candidateName="Priya Sharma" 
            draftMessage={draftMessage}
            onDraftMessageChange={setDraftMessage}
            incomingSystemMessage={systemMessage}
          />
          
          {/* Scheduler Overlay inside chat */}
          <div className="absolute right-6 top-20 z-10">
            <Scheduler onProposeTimes={handleProposeTimes} />
          </div>
        </div>

        {/* AI Context Panel */}
        <ContextPanel 
          cvScore={92}
          archetype="Senior Architect"
          matchedSkills={["React", "Node.js", "PostgreSQL", "System Design"]}
          interviewSessionId="preview-session-123"
          onSelectSuggestion={handleSelectSuggestion}
        />
      </div>
    </div>
  );
}
