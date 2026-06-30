"use client";

import { useState } from "react";
import { JobPosting } from "@hirevault/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SidebarProps {
  jobPosting: JobPosting;
  onUploadSuccess: () => void;
  onRerank: (weights: any, jdText: string) => Promise<void>;
  anonymized: boolean;
  setAnonymized: (val: boolean) => void;
  weights: { skills: number, seniority: number, trajectory: number, culture: number };
}

export default function Sidebar({ jobPosting, onUploadSuccess, onRerank, anonymized, setAnonymized, weights: initialWeights }: SidebarProps) {
  const [uploading, setUploading] = useState(false);
  const [reranking, setReranking] = useState(false);
  const [jdText, setJdText] = useState(jobPosting.description);
  const [weights, setWeights] = useState(initialWeights);

  const totalWeight = weights.skills + weights.seniority + weights.trajectory + weights.culture;
  const isWeightValid = totalWeight === 100;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("job_posting_id", jobPosting.id);
    
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append("files", e.target.files[i]);
    }

    try {
      const res = await fetch("/api/hiring/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast.success(`${data.processed} CVs analyzed successfully`);
      onUploadSuccess();
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleRerankClick = async () => {
    if (!isWeightValid) {
      toast.error("Weights must sum to 100");
      return;
    }
    setReranking(true);
    await onRerank(weights, jdText);
    setReranking(false);
    toast.success("Corpus re-analyzed");
  };

  return (
    <div className="w-72 bg-zinc-50 border-r border-zinc-200/60 flex flex-col shrink-0">
      <div className="p-4 border-b border-zinc-200/60">
        <h2 className="font-bold text-zinc-900 truncate" title={jobPosting.title}>{jobPosting.title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Anonymize Toggle */}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-zinc-200/60 shadow-sm">
          <span className="text-sm font-medium text-zinc-700">Anonymize Candidates</span>
          <Switch checked={anonymized} onCheckedChange={setAnonymized} />
        </div>

        {/* Upload Zone */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Upload CVs</label>
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-indigo-200 rounded-lg cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mb-2" />
              ) : (
                <UploadCloud className="w-6 h-6 text-indigo-500 mb-2" />
              )}
              <p className="text-xs text-indigo-600 font-medium">
                {uploading ? "Analyzing..." : "Click to upload CV files (PDF, DOCX, ZIP, etc.)"}
              </p>
            </div>
            <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
          </label>
        </div>

        {/* JD Editor */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Job Description</label>
          <Textarea 
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            className="text-sm min-h-[120px] resize-y"
          />
        </div>

        {/* Scoring Weights */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Scoring Weights</label>
            <span className={`text-xs font-bold ${isWeightValid ? 'text-green-600' : 'text-red-500'}`}>
              Sum: {totalWeight}%
            </span>
          </div>

          <WeightSlider label="Skills" value={weights.skills} onChange={(v) => setWeights({ ...weights, skills: v })} />
          <WeightSlider label="Seniority" value={weights.seniority} onChange={(v) => setWeights({ ...weights, seniority: v })} />
          <WeightSlider label="Trajectory" value={weights.trajectory} onChange={(v) => setWeights({ ...weights, trajectory: v })} />
          <WeightSlider label="Culture Fit" value={weights.culture} onChange={(v) => setWeights({ ...weights, culture: v })} />
        </div>

        <Button 
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" 
          onClick={handleRerankClick}
          disabled={reranking || !isWeightValid}
        >
          {reranking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Re-Analyze Corpus
        </Button>
      </div>
    </div>
  );
}

function WeightSlider({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium">
        <span className="text-zinc-700">{label}</span>
        <span className="text-indigo-600 bg-indigo-50 px-1.5 rounded">{value}%</span>
      </div>
      <Slider 
        value={[value]} 
        max={100} 
        step={5} 
        onValueChange={(vals) => onChange(typeof vals === "number" ? vals : vals[0])} 
        className="py-1"
      />
    </div>
  );
}
