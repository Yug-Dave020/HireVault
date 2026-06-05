"use client";

import { useState, useEffect } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Target, Clock, Star, Zap } from "lucide-react";

export function CoherenceClient({ cvId }: { cvId: string }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fixingGap, setFixingGap] = useState<any | null>(null);

  const fetchCoherence = async () => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_WORKER_WS_URL?.replace("ws://", "http://").replace("wss://", "https://") || "http://localhost:8000";
      const res = await fetch(`${baseUrl}/analyze/coherence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_id: cvId }),
      });
      if (!res.ok) throw new Error("Failed to fetch coherence report");
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoherence();
  }, [cvId]);

  if (loading) {
    return (
      <div className="flex-grow p-8 flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-32 w-32 bg-zinc-200 rounded-full"></div>
          <div className="h-6 w-48 bg-zinc-200 rounded"></div>
          <div className="h-4 w-64 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <Button onClick={fetchCoherence} className="mt-4 bg-[#1a91f0] text-white rounded-md">Try Again</Button>
      </div>
    );
  }

  if (!report) return null;

  const scoreColor = report.score > 75 ? "#1D9E75" : report.score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="p-8 space-y-8 bg-[#ffffff] h-full text-[#0f141e] overflow-y-auto">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold">Semantic Coherence Audit</h1>
          <p className="text-zinc-500 mt-1">Cross-referencing your claimed skills against real bullet impacts.</p>
        </div>
        <Button onClick={fetchCoherence} className="bg-[#1a91f0] hover:bg-blue-600 text-white rounded-md px-6">
          Re-analyze
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center justify-center p-6 border border-zinc-200 rounded-[24px] shadow-sm w-full md:w-1/3">
          <div className="relative h-40 w-40 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="#f4f5f6" strokeWidth="12" fill="transparent" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={scoreColor}
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="440"
                strokeDashoffset={440 - (440 * report.score) / 100}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-black" style={{ color: scoreColor }}>{report.score}</span>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Score</span>
            </div>
          </div>
          {report.keyword_density_flag && (
            <div className="mt-4 text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-[36px] flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> High ATS Noise Risk (Keyword Stuffing)
            </div>
          )}
        </div>

        <div className="w-full md:w-2/3 space-y-6">
          {/* Skill Orphans */}
          {report.skill_orphans?.length > 0 && (
            <div className="border border-zinc-200 rounded-[24px] p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-red-500" /> Skill Orphans
              </h3>
              <p className="text-sm text-zinc-500 mb-4">These skills are listed but never proven in your experience bullets.</p>
              <div className="flex flex-wrap gap-2">
                {report.skill_orphans.map((o: any, i: number) => (
                  <div key={i} className="flex flex-col group relative">
                    <span className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-100 rounded-[36px] cursor-help">
                      {o.skill}
                    </span>
                    <div className="hidden group-hover:block absolute bottom-full mb-2 left-0 w-48 p-2 bg-zinc-800 text-white text-xs rounded-md z-10 shadow-lg">
                      {o.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience Underclaimed */}
          {report.experience_underclaimed?.length > 0 && (
            <div className="border border-zinc-200 rounded-[24px] p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-500" /> Unclaimed Experience
              </h3>
              <p className="text-sm text-zinc-500 mb-4">You mentioned these in bullets, but forgot to list them in your Skills section.</p>
              <div className="flex flex-col gap-3">
                {report.experience_underclaimed.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-[36px] shrink-0">{item.term}</span>
                    <span className="text-sm text-zinc-600">Found in: <span className="italic">{item.found_in}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Gaps */}
          {report.impact_gap?.length > 0 && (
            <div className="border border-zinc-200 rounded-[24px] p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-blue-500" /> Impact Gaps
              </h3>
              <p className="text-sm text-zinc-500 mb-4">These bullets lack quantifiable metrics. Review AI suggestions to fix them.</p>
              <div className="space-y-4">
                {report.impact_gap.map((gap: any, i: number) => (
                  <div key={i} className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 space-y-3">
                    <p className="text-sm text-zinc-700 line-through decoration-red-400">{gap.bullet}</p>
                    <div className="flex justify-between items-center">
                      <Button 
                        onClick={() => setFixingGap(gap)}
                        variant="outline" 
                        size="sm"
                        className="text-[#1a91f0] border-[#1a91f0] hover:bg-blue-50 rounded-md"
                      >
                        Fix this bullet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline Flags */}
          {report.timeline_flags?.length > 0 && (
            <div className="border border-zinc-200 rounded-[24px] p-6">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-purple-500" /> Timeline Flags
              </h3>
              <div className="space-y-3">
                {report.timeline_flags.map((flag: any, i: number) => (
                  <div key={i} className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex flex-col">
                    <span className="font-bold text-purple-900 text-sm">{flag.role}</span>
                    <span className="text-purple-700 text-sm mt-1">{flag.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {fixingGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[24px] w-full max-w-4xl p-6 shadow-2xl flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Fix Impact Gap</h2>
              <Button variant="ghost" onClick={() => setFixingGap(null)} className="rounded-[36px]">Close</Button>
            </div>
            <div className="flex-grow border border-zinc-200 rounded-xl overflow-hidden">
              <DiffEditor
                height="100%"
                language="markdown"
                original={fixingGap.bullet}
                modified={fixingGap.rewrite_suggestion}
                options={{
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  wordWrap: "on",
                }}
              />
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setFixingGap(null)} className="rounded-md">Cancel</Button>
              <Button 
                className="bg-[#1a91f0] text-white rounded-md px-6"
                onClick={() => {
                  alert("Fix applied successfully to your CV variant!");
                  setFixingGap(null);
                }}
              >
                Apply Fix (Mock)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
