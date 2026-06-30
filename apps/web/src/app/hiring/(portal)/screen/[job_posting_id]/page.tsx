"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { JobPosting, CVSubmission } from "@shared/types/talentlens";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "./components/Sidebar";
import CandidateTable from "./components/CandidateTable";
import DetailPanel from "./components/DetailPanel";
import BulkActionBar from "./components/BulkActionBar";

export default function ScreenPage({ params }: { params: { job_posting_id: string } }) {
  const [jobPosting, setJobPosting] = useState<JobPosting | null>(null);
  const [candidates, setCandidates] = useState<CVSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // App state
  const [anonymized, setAnonymized] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [weights, setWeights] = useState({ skills: 40, seniority: 25, trajectory: 20, culture: 15 });
  
  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Job Posting
    const { data: job, error: jobErr } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", params.job_posting_id)
      .single();
      
    if (jobErr || !job) {
      router.push("/hiring/dashboard");
      return;
    }
    
    setJobPosting(job as JobPosting);
    
    // Fetch CVs
    const { data: cvs } = await supabase
      .from("cv_submissions")
      .select("*")
      .eq("job_posting_id", params.job_posting_id)
      .order("composite_score", { ascending: false });
      
    setCandidates(cvs as CVSubmission[] || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.job_posting_id]);

  const handleRerank = async (newWeights: any, newJdText: string) => {
    setLoading(true);
    setWeights(newWeights);
    try {
      const res = await fetch("/api/hiring/rerank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_posting_id: params.job_posting_id,
          jd_text: newJdText,
          weights: newWeights,
          top_n: 100
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCandidates(data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !jobPosting) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  if (!jobPosting) return null;

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || null;
  const strongMatches = candidates.filter(c => c.composite_score >= 85).length;
  const shortlisted = candidates.filter(c => c.status === 'shortlisted').length;
  const contacted = candidates.filter(c => c.status === 'contacted').length;

  const handleComposeBulkEmail = () => {
    const selectedCvs = candidates.filter(c => selectedRowIds.has(c.id));
    const emails = selectedCvs.map(c => c.parsed_json?.email).filter(Boolean);
    if (emails.length > 0) {
      window.location.href = `mailto:?bcc=${emails.join(',')}`;
    } else {
      toast.error("No email addresses found for the selected candidates.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -m-6 md:-m-8">
      {/* LEFT SIDEBAR */}
      <Sidebar 
        jobPosting={jobPosting} 
        onUploadSuccess={fetchData} 
        onRerank={handleRerank}
        anonymized={anonymized}
        setAnonymized={setAnonymized}
        weights={weights}
      />

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* STATS */}
        <div className="grid grid-cols-4 border-b border-zinc-200/60 shrink-0">
          <StatCard title="Total CVs" value={candidates.length} />
          <StatCard title="Strong Matches" value={strongMatches} highlight />
          <StatCard title="Shortlisted" value={shortlisted} />
          <StatCard title="Contacted" value={contacted} />
        </div>
        
        {/* TABLE */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {loading ? (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : null}
          <CandidateTable 
            candidates={candidates}
            anonymized={anonymized}
            selectedRowIds={selectedRowIds}
            setSelectedRowIds={setSelectedRowIds}
            onRowClick={(id) => setSelectedCandidateId(id)}
          />
        </div>

        {/* DETAIL PANEL */}
        {selectedCandidate && (
          <DetailPanel 
            candidate={selectedCandidate} 
            anonymized={anonymized}
            onClose={() => setSelectedCandidateId(null)}
            onUpdateStatus={(status) => {
              const updated = candidates.map(c => c.id === selectedCandidate.id ? { ...c, status } : c);
              setCandidates(updated as CVSubmission[]);
            }}
          />
        )}

        {/* BULK ACTION BAR */}
        {selectedRowIds.size > 0 && (
          <BulkActionBar 
            selectedCount={selectedRowIds.size} 
            onClear={() => setSelectedRowIds(new Set())} 
            onCompose={handleComposeBulkEmail}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight = false }: { title: string, value: number, highlight?: boolean }) {
  return (
    <div className="p-4 border-r border-zinc-200/60 last:border-0 flex flex-col justify-center">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{title}</div>
      <div className={`text-2xl font-bold ${highlight ? 'text-green-600' : 'text-zinc-900'}`}>{value}</div>
    </div>
  );
}
