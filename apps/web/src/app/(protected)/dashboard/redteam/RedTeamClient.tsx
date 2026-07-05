"use client";

import { useState, useEffect, useCallback } from "react";
import { DiffEditor } from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function RedTeamClient({ cvId }: { cvId: string }) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const fetchRedTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      const baseUrl = process.env.NEXT_PUBLIC_WORKER_WS_URL?.replace("ws://", "http://").replace("wss://", "https://") || "http://localhost:8000";
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session) headers["Authorization"] = `Bearer ${session.access_token}`;

      const res = await fetch(`${baseUrl}/analyze/redteam`, {
        method: "POST",
        headers,
        body: JSON.stringify({ cv_id: cvId, attack_mode: "both" }),
      });
      if (!res.ok) throw new Error("Failed to fetch red team report");
      const data = await res.json();
      
      // Sort attacks by severity descending
      if (data.attacks) {
        data.attacks.sort((a: any, b: any) => b.severity - a.severity);
      }
      setReport(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    fetchRedTeam();
  }, [fetchRedTeam]);

  const toggleRow = (index: number) => {
    setExpandedRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <div className="flex-grow p-8 flex flex-col items-center justify-center space-y-4">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-32 w-32 bg-zinc-200 rounded-full"></div>
          <div className="h-6 w-48 bg-zinc-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <Button onClick={fetchRedTeam} className="mt-4 bg-[#1a91f0] text-white rounded-md">Try Again</Button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="p-8 space-y-8 bg-[#ffffff] h-full overflow-y-auto text-[#0f141e]">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-red-600" /> Adversarial Red-Teaming
          </h1>
          <p className="text-zinc-500 mt-1">Stress-tested by a hostile ATS and skeptical senior recruiter.</p>
        </div>
        <Button onClick={fetchRedTeam} className="bg-[#1a91f0] hover:bg-blue-600 text-white rounded-md px-6">
          Re-Attack Resume
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col items-center justify-center p-6 border border-zinc-200 rounded-[24px] shadow-sm w-full md:w-1/3">
          <div className="text-center">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Attack Surface Score</h2>
            <div className="text-6xl font-black text-red-600 mb-2">{report.attack_surface_score}</div>
            <p className="text-xs text-zinc-500 max-w-[200px] mx-auto">
              Lower is better. A high score means your resume is highly vulnerable to ATS rejection or recruiter skepticism.
            </p>
          </div>
        </div>

        <div className="w-full md:w-2/3 space-y-4">
          <h3 className="font-bold text-xl mb-4">Discovered Vulnerabilities</h3>
          {report.attacks?.length === 0 && (
            <div className="p-8 text-center border border-zinc-200 rounded-[24px] bg-green-50 text-green-800">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-bold">No vulnerabilities found!</p>
            </div>
          )}
          {report.attacks?.map((atk: any, index: number) => {
            const isExpanded = !!expandedRows[index];
            const severityColor = atk.severity === 3 ? "bg-red-50 text-red-800 border-red-200" : atk.severity === 2 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-yellow-50 text-yellow-800 border-yellow-200";
            const severityDot = atk.severity === 3 ? "bg-red-500" : atk.severity === 2 ? "bg-amber-500" : "bg-yellow-400";
            const patch = report.patches?.find((p: any) => p.original === atk.target_text);

            return (
              <div key={index} className={`border rounded-[24px] overflow-hidden transition-all ${severityColor}`}>
                <div 
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-black/5"
                  onClick={() => toggleRow(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${severityDot}`}></div>
                    <div>
                      <span className="font-bold uppercase text-xs tracking-wider opacity-70 mr-2">[{atk.attack_type}]</span>
                      <span className="font-semibold text-sm line-clamp-1 max-w-lg">{atk.target_text}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold opacity-70">Severity {atk.severity}</span>
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-black/10">
                    <p className="text-sm font-semibold text-zinc-700 mb-2">Attacker Reasoning:</p>
                    <p className="text-sm text-zinc-600 italic mb-4">&quot;{atk.attack_reasoning}&quot;</p>

                    {patch ? (
                      <div className="mt-4 space-y-4">
                        <p className="text-sm font-semibold text-[#1D9E75]">Patch Available:</p>
                        <p className="text-xs text-zinc-500">{patch.reasoning}</p>
                        <div className="h-[200px] border border-zinc-200 rounded-md overflow-hidden">
                          <DiffEditor
                            height="100%"
                            language="markdown"
                            original={patch.original}
                            modified={patch.patched_version}
                            options={{ renderSideBySide: true, minimap: { enabled: false }, wordWrap: "on" }}
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button className="bg-[#1a91f0] hover:bg-blue-600 text-white rounded-md">Apply Patch</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500">No patch generated for this vulnerability.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
