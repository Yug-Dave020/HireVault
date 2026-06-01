import Link from "next/link";
import { Video, Sparkles, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Interview Prep — HireVault",
  description: "AI-powered conversational mock interviews with real-time feedback",
};

export default function InterviewPrepPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/30">
      <div className="w-full max-w-lg text-center space-y-6 bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200/80 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
          <Video className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            <span>Coming in Phase 2</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">AI Mock Interviews</h1>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
            Our conversational mock interview system is currently being calibrated. Soon you will be able to run real-time role-playing sessions and get analytical feedback directly.
          </p>
        </div>
        
        <div className="pt-5 border-t border-zinc-100 flex items-center justify-center gap-4">
          <Link href="/dashboard" className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <span className="text-zinc-200">|</span>
          <Link href="/cv" className="text-xs font-bold text-emerald-600 hover:underline">
            Go to CV Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
