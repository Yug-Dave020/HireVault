"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Video, Settings, Link as LinkIcon, Send } from "lucide-react";
import Link from "next/link";

export default function NewScreeningRequest() {
  const router = useRouter();
  const [role, setRole] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [duration, setDuration] = useState("10");
  
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate creating and taking user back
    alert("Screening request created successfully!");
    router.push("/hiring/async-screen");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/hiring/async-screen">
          <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 rounded-full hover:bg-zinc-200">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Create Screening Request</h1>
          <p className="text-sm text-zinc-500 mt-1">Configure an AI-powered async video interview.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-8">
        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900 mb-6">
            <Video className="w-5 h-5 text-indigo-600" />
            Basic Details
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-zinc-700 font-medium">Target Role</Label>
              <Input 
                id="role"
                placeholder="e.g. Senior Frontend Engineer" 
                value={role}
                onChange={e => setRole(e.target.value)}
                className="bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-700 font-medium">Candidate Email (Optional)</Label>
              <div className="flex gap-3">
                <Input 
                  id="email"
                  type="email"
                  placeholder="candidate@example.com" 
                  value={candidateEmail}
                  onChange={e => setCandidateEmail(e.target.value)}
                  className="bg-zinc-50 border-zinc-200 focus:bg-white transition-colors flex-1"
                />
                <Button type="button" variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 flex items-center gap-2 px-4">
                  <LinkIcon className="w-4 h-4" />
                  Generate Link Instead
                </Button>
              </div>
              <p className="text-xs text-zinc-500">If left blank, you can generate a shareable link after creation.</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900 mb-6">
            <Settings className="w-5 h-5 text-indigo-600" />
            Interview Configuration
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-zinc-700 font-medium">Max Duration (Minutes)</Label>
              <select 
                id="duration"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1da074] focus:border-transparent"
              >
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes</option>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="questions" className="text-zinc-700 font-medium">AI Question Strategy</Label>
              <select 
                id="questions"
                className="w-full h-10 px-3 py-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1da074] focus:border-transparent"
              >
                <option value="auto">Auto-generate from Role</option>
                <option value="behavioral">Focus on Behavioral</option>
                <option value="technical">Focus on Technical Depth</option>
                <option value="custom">Custom Question Bank</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/hiring/async-screen">
            <Button type="button" variant="ghost" className="text-zinc-600 hover:text-zinc-900">
              Cancel
            </Button>
          </Link>
          <Button type="submit" className="bg-[#1da074] hover:bg-[#15805c] text-white flex items-center gap-2 px-8">
            <Send className="w-4 h-4" />
            Send Request
          </Button>
        </div>
      </form>
    </div>
  );
}
