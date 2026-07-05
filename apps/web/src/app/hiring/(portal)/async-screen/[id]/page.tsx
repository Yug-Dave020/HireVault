"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Clock, ThumbsUp, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AsyncScreenReview() {
  
  // A high-quality placeholder video suitable for a demo
  // "Elephants Dream" or "Big Buck Bunny" or standard w3schools video. We'll use a clean placeholder.
  const demoVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4";

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/hiring/async-screen">
            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-zinc-900 rounded-full hover:bg-zinc-200">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-3">
              Candidate Review
              <span className="text-sm font-medium bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                Senior Frontend Engineer
              </span>
            </h1>
          </div>
        </div>
        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white">
          <MessageSquare className="w-4 h-4 mr-2" />
          Message Candidate
        </Button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Column: Video Player */}
        <div className="flex-1 flex flex-col bg-black rounded-2xl overflow-hidden relative shadow-xl group border border-zinc-800">
          <video 
            src={demoVideoUrl} 
            className="w-full h-full object-cover"
            controls
            poster="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200&h=800"
          />
          {/* Custom Overlay indicating AI Demo */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            AI Analyzed Recording
          </div>
        </div>

        {/* Right Column: AI Analysis */}
        <div className="w-[400px] flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden shrink-0">
          <div className="p-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              ConnectHub AI Insights
            </h3>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-100">
              92
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200">
            {/* Summary */}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Executive Summary</h4>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Candidate demonstrated excellent communication skills and deep knowledge of React performance optimization. They successfully explained complex state management paradigms and provided clear examples from their past experience.
              </p>
            </div>

            {/* Key Strengths */}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-emerald-500" />
                Key Strengths Detected
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-zinc-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  Strong grasp of React concurrent mode.
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  Clear, structured communication style under pressure.
                </li>
                <li className="flex items-start gap-2 text-sm text-zinc-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  Relevant experience with high-traffic e-commerce platforms.
                </li>
              </ul>
            </div>

            {/* Timestamps */}
            <div>
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Key Moments
              </h4>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 border border-zinc-100 transition-colors group text-left">
                  <div className="text-sm text-zinc-700 group-hover:text-indigo-600 font-medium transition-colors">System Architecture Setup</div>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-1 rounded">01:24</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 border border-zinc-100 transition-colors group text-left">
                  <div className="text-sm text-zinc-700 group-hover:text-indigo-600 font-medium transition-colors">Handling State Management</div>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-1 rounded">03:45</span>
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 border border-zinc-100 transition-colors group text-left">
                  <div className="text-sm text-zinc-700 group-hover:text-indigo-600 font-medium transition-colors">Leadership & Mentorship</div>
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-1 rounded">06:12</span>
                </button>
              </div>
            </div>
            
          </div>
          
          <div className="p-4 border-t border-zinc-200 bg-white grid grid-cols-2 gap-3 shrink-0">
            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
              Reject
            </Button>
            <Button className="w-full bg-[#1da074] hover:bg-[#15805c] text-white">
              Advance
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
