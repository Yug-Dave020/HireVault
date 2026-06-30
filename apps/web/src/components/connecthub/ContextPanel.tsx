import { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";

interface ContextPanelProps {
  cvScore: number;
  archetype: string;
  matchedSkills: string[];
  suggestedMessages: string[];
  onSelectSuggestion: (msg: string) => void;
  interviewSessionId?: string;
}

export function ContextPanel({
  cvScore = 88,
  archetype = "Architect",
  matchedSkills = ["FastAPI", "PostgreSQL", "React"],
  suggestedMessages = [
    "Hi there! I came across your FastAPI work and your trajectory is exactly what we're building toward. Would you be open to a quick chat?",
    "I was really impressed by your experience with event-driven architectures. Are you currently exploring new roles?"
  ],
  onSelectSuggestion,
  interviewSessionId
}: Partial<ContextPanelProps>) {
  const [loading, setLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<string[]>(suggestedMessages);

  useEffect(() => {
    if (!interviewSessionId) return;
    
    setLoading(true);
    fetch('/api/connecthub/generate-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        interview_session_id: interviewSessionId,
        job_posting_id: 'mock-jd-id',
        cv_submission_id: 'mock-cv-id'
      })
    })
    .then(res => res.json())
    .then(resData => {
      if (resData?.data?.hiring_manager_brief?.suggested_questions) {
        setAiQuestions(resData.data.hiring_manager_brief.suggested_questions);
      }
    })
    .catch(err => console.error("Failed to load brief", err))
    .finally(() => setLoading(false));
  }, [interviewSessionId]);

  return (
    <div className="w-80 bg-zinc-50 border-l border-zinc-200 flex flex-col h-full text-zinc-900 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 shrink-0">
      <div className="p-5 border-b border-zinc-200">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider mb-4">AI Context</h3>
        
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-500">Match Score</span>
              <span className="text-lg font-bold text-emerald-400">{cvScore}%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${cvScore}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
            <span className="text-sm text-zinc-500 block mb-1">Detected Archetype</span>
            <span className="text-indigo-600 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {archetype}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 border-b border-zinc-200">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Key Matches
        </h3>
        <div className="flex flex-wrap gap-2">
          {matchedSkills.map((skill, idx) => (
            <span key={idx} className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs px-2.5 py-1 rounded-md">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="p-5 flex-1">
        <h3 className="font-semibold text-sm text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" /> Suggested Openers
        </h3>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-400 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            <p className="text-xs">Generating AI Brief...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aiQuestions.map((msg, idx) => (
              <button
                key={idx}
                onClick={() => onSelectSuggestion?.(msg)}
                className="w-full text-left bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-indigo-300 rounded-xl p-3 text-sm text-zinc-700 transition-all group shadow-sm"
              >
                <span className="line-clamp-3 leading-relaxed">{msg}</span>
                <span className="block mt-2 text-xs text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                  Use this message →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
