"use client";

import { useState } from "react";
import { CVSubmission } from "@hirevault/shared";
import { Button } from "@/components/ui/button";
import { Loader2, Video, Link as LinkIcon, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function ConnectHubRequest({ 
  candidate, 
  jobPostingId,
  anonymized
}: { 
  candidate: CVSubmission, 
  jobPostingId: string,
  anonymized: boolean
}) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [candidateEmail, setCandidateEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hiring/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_submission_id: candidate.id,
          job_posting_id: jobPostingId
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to initialize ConnectHub");
      
      setLink(data.link);
      setCandidateEmail(data.candidateEmail || null);
      toast.success("Video interview requested. You can now send the link to the candidate.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    }
  };

  const handleSendEmail = () => {
    if (link) {
      const email = candidateEmail || "";
      const subject = encodeURIComponent("Video Interview Request from HireVault");
      const body = encodeURIComponent(`We would like to invite you to a video interview. Please click the following link to proceed:\n\n${link}`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pr-2 py-2">
      <div className="flex flex-col items-center justify-center text-center space-y-4 p-8 border border-zinc-200/60 rounded-xl bg-zinc-50/50">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2">
          <Video className="w-8 h-8" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 mb-1">
            Request Video Interview & Chat
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            Invite {anonymized ? "this candidate" : (candidate.parsed_json.name || "the candidate")} to upload a short asynchronous video screen and open a direct chat channel.
          </p>
        </div>

        {!link ? (
          <Button 
            onClick={handleRequest} 
            disabled={loading}
            className="mt-4 bg-[#1da074] hover:bg-[#15805c] text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Video className="w-4 h-4 mr-2" />}
            Request Video & Chat
          </Button>
        ) : (
          <div className="w-full max-w-md mt-6 space-y-4 text-left">
            <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white">
              <div className="flex items-center gap-2 text-zinc-700">
                <Mail className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">Send Invitation</p>
              </div>
              <Button onClick={handleSendEmail} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Send via Email
              </Button>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase">Shareable Candidate Link</label>
              <div className="flex items-center gap-2">
                <Input value={link} readOnly className="bg-white font-mono text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <LinkIcon className="w-4 h-4 text-zinc-500" />}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
