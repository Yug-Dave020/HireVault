"use client";

import { CVSubmission } from "@hirevault/shared";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoreBreakdown from "./ScoreBreakdown";
import ChatWithCV from "./ChatWithCV";
import ComposeOutreach from "./ComposeOutreach";
import ConnectHubRequest from "./ConnectHubRequest";

interface DetailPanelProps {
  candidate: CVSubmission;
  anonymized: boolean;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
}

export default function DetailPanel({ candidate, anonymized, onClose, onUpdateStatus }: DetailPanelProps) {
  const name = anonymized ? candidate.anonymized_id : (candidate.parsed_json.name || "Unknown");
  
  return (
    <div className="absolute inset-x-0 bottom-0 top-1/2 bg-white border-t border-zinc-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] flex flex-col z-20 transition-transform">
      <div className="h-12 border-b border-zinc-200/60 flex items-center justify-between px-6 bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-zinc-900">{name}</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
            Score: {candidate.composite_score}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-200 text-zinc-500 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <Tabs defaultValue="score" className="h-full flex flex-col">
          <TabsList className="w-full justify-start border-b border-zinc-200 rounded-none bg-transparent h-auto p-0 mb-6 shrink-0">
            <TabsTrigger value="score" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-4 pb-2 pt-0 font-semibold data-[state=active]:text-indigo-600">
              Score Breakdown
            </TabsTrigger>
            <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-4 pb-2 pt-0 font-semibold data-[state=active]:text-indigo-600">
              Chat with CV
            </TabsTrigger>
            <TabsTrigger value="outreach" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent px-4 pb-2 pt-0 font-semibold data-[state=active]:text-indigo-600">
              Compose Outreach
            </TabsTrigger>
            <TabsTrigger value="connecthub" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1da074] data-[state=active]:bg-transparent px-4 pb-2 pt-0 font-semibold data-[state=active]:text-[#1da074]">
              ConnectHub
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden relative">
            <TabsContent value="score" className="h-full mt-0 outline-none overflow-y-auto pr-2">
              <ScoreBreakdown candidate={candidate} />
            </TabsContent>
            
            <TabsContent value="chat" className="h-full mt-0 outline-none flex flex-col">
              <ChatWithCV cvId={candidate.id} summary={candidate.parsed_json.summary || ""} />
            </TabsContent>
            
            <TabsContent value="outreach" className="h-full mt-0 outline-none overflow-y-auto">
              <ComposeOutreach 
                candidate={candidate} 
                anonymized={anonymized} 
                onUpdateStatus={onUpdateStatus}
              />
            </TabsContent>

            <TabsContent value="connecthub" className="h-full mt-0 outline-none overflow-y-auto">
              <ConnectHubRequest 
                candidate={candidate} 
                jobPostingId={candidate.job_posting_id}
                anonymized={anonymized} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
