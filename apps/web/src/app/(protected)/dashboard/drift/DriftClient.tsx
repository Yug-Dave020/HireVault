"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Activity, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DriftClient({ initialSnapshots, userId }: { initialSnapshots: any[], userId: string }) {
  const [snapshots, setSnapshots] = useState<any[]>(initialSnapshots);
  const [isAdding, setIsAdding] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleTrackNew = async () => {
    if (!newUrl.trim()) return;
    setLoading(true);
    // Simulate tracking
    const newSnapshot = {
      user_id: userId,
      company_name: "Simulated Company",
      role_title: "Software Engineer",
      source_url: newUrl,
      scraped_text: "Simulated scraped text...",
      drifts: []
    };
    
    const { data, error } = await supabase.from("jd_snapshots").insert(newSnapshot).select();
    if (!error && data) {
      setSnapshots(prev => [data[0], ...prev]);
      setIsAdding(false);
      setNewUrl("");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 space-y-8 bg-[#ffffff] min-h-screen text-[#0f141e]">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-indigo-600" /> JD Drift Tracker
          </h1>
          <p className="text-zinc-500 mt-1">Automatically track silent changes to job descriptions.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-[#1a91f0] hover:bg-blue-600 text-white rounded-md px-6 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Track New JD
        </Button>
      </div>

      {isAdding && (
        <div className="bg-zinc-50 p-6 rounded-[24px] border border-zinc-200 flex gap-4 items-center">
          <input
            type="url"
            placeholder="Paste Job Description URL (e.g. LinkedIn, Greenhouse)"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="flex-1 bg-white border border-zinc-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-[#1a91f0]"
          />
          <Button onClick={handleTrackNew} disabled={loading} className="bg-[#1a91f0] text-white rounded-md">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Start Tracking"}
          </Button>
          <Button onClick={() => setIsAdding(false)} variant="outline" className="rounded-md">Cancel</Button>
        </div>
      )}

      {snapshots.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-300 rounded-[24px]">
          <Activity className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-600">No Job Descriptions Tracked</h3>
          <p className="text-zinc-500 mt-2">Start tracking a job posting to monitor it for silent updates and requirement drifts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {snapshots.map(s => (
            <div key={s.id} className="border border-zinc-200 rounded-[24px] overflow-hidden bg-white hover:shadow-sm transition-shadow">
              <div className="p-5 border-b border-zinc-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg leading-tight text-[#0f141e]">{s.role_title}</h3>
                  <p className="text-sm text-zinc-500">{s.company_name}</p>
                </div>
                <a href={s.source_url} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-[#1a91f0] transition-colors">
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
              <div className="p-5 bg-zinc-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`h-2 w-2 rounded-full ${s.drifts?.length > 0 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                    {s.drifts?.length > 0 ? "Changes Detected" : "Active & Stable"}
                  </span>
                </div>
                
                {s.drifts?.length > 0 ? (
                  <div className="space-y-2">
                    {s.drifts.map((d: string, i: number) => (
                      <div key={i} className="flex gap-2 text-sm text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-100">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="leading-tight">{d}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 italic">No drifts detected since tracking started.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
