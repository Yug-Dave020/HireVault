"use client";

import { useState } from "react";
import { CVSubmission } from "@shared/types/talentlens";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ComposeOutreach({ candidate, anonymized, onUpdateStatus }: { candidate: CVSubmission, anonymized: boolean, onUpdateStatus: (s: string) => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleGenerate = async (tone: string) => {
    setGenerating(true);
    try {
      const res = await fetch("/api/hiring/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_submission_id: candidate.id,
          tone,
          anonymized
        })
      });
      if (!res.ok) throw new Error("Failed to generate email");
      const data = await res.json();
      setSubject(data.subject || "");
      setBody(data.body || "");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!subject || !body) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("candidate_outreach").insert({
        cv_submission_id: candidate.id,
        subject,
        body,
        status: "draft"
      });
      if (error) throw error;
      toast.success("Saved as draft");
    } catch (err: any) {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkContacted = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("cv_submissions").update({ status: "contacted" }).eq("id", candidate.id);
      if (error) throw error;
      onUpdateStatus("contacted");
      toast.success("Candidate marked as contacted");
    } catch (err: any) {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  // Render text highlighting [TOKEN] placeholders
  const renderHighlightedBody = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[[A-Z_]+\])/g);
    return (
      <div className="absolute inset-0 px-3 py-2 text-base md:text-sm border border-transparent pointer-events-none whitespace-pre-wrap break-words overflow-y-auto text-zinc-900">
        {parts.map((part, i) => {
          if (part.match(/^\[[A-Z_]+\]$/)) {
            return <span key={i} className="bg-purple-100 text-purple-700 font-semibold">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4 pr-2">
      <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200/60">
        <Mail className="w-5 h-5 text-zinc-400" />
        <div className="flex-1 text-sm">
          <span className="text-zinc-500 mr-2">To:</span>
          <span className="font-medium text-zinc-900">
            {anonymized ? "Hidden (Anonymized)" : (candidate.parsed_json.email || "No email found")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => handleGenerate("professional")} disabled={generating} className="bg-white border-indigo-100 text-indigo-700 hover:bg-indigo-50">
          {generating ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
          Generate Professional
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleGenerate("warm")} disabled={generating} className="bg-white border-amber-100 text-amber-700 hover:bg-amber-50">
          {generating ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
          Generate Warm
        </Button>
      </div>

      <Input 
        value={subject}
        onChange={e => setSubject(e.target.value)}
        placeholder="Subject line..."
        className="font-medium"
      />

      <div className="relative flex-1 min-h-[200px] rounded-lg border border-input transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 overflow-hidden bg-white">
        {renderHighlightedBody(body)}
        <textarea 
          value={body}
          onChange={e => setBody(e.target.value)}
          className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-zinc-900 z-10 px-3 py-2 text-base md:text-sm outline-none border-none m-0 placeholder:text-muted-foreground"
          placeholder="Email body..."
          spellCheck={false}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={handleSaveDraft} disabled={saving || !body}>
          Save as Draft
        </Button>
        <Button onClick={handleMarkContacted} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Mark Contacted
        </Button>
      </div>
    </div>
  );
}
