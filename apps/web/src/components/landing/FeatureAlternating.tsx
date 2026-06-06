import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Mic } from "lucide-react";

export function FeatureAlternating() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
        
        {/* Feature 1 */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              Build a ready-made ATS-friendly resume that gets you hired faster.
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Use our intelligent CV Studio to craft tailored resumes perfectly aligned to your target job descriptions. Ensure 100% ATS compliance without sacrificing design quality.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex gap-3 text-zinc-700">
                <CheckCircle2 className="h-6 w-6 text-[#1da074] flex-shrink-0" />
                <span>Professional templates optimized for recruiters.</span>
              </li>
              <li className="flex gap-3 text-zinc-700">
                <CheckCircle2 className="h-6 w-6 text-[#1da074] flex-shrink-0" />
                <span>AI-assisted content generation and gap analysis.</span>
              </li>
              <li className="flex gap-3 text-zinc-700">
                <CheckCircle2 className="h-6 w-6 text-[#1da074] flex-shrink-0" />
                <span>Unlimited variants for different job applications.</span>
              </li>
            </ul>
            <div className="pt-6">
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a91f0] hover:bg-[#157ad1] text-white rounded-lg font-semibold transition-colors">
                Start building
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="relative bg-zinc-50 rounded-3xl border border-zinc-200 p-8 shadow-xl">
              {/* CSS Mockup of CV Builder */}
              <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <div className="h-10 bg-zinc-50 border-b border-zinc-100 flex items-center px-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/3 border-r border-zinc-100 p-4 space-y-4">
                    <div className="h-4 w-16 bg-zinc-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-8 bg-[#1da074]/10 border border-[#1da074]/30 rounded-md"></div>
                      <div className="h-8 bg-zinc-100 rounded-md"></div>
                      <div className="h-8 bg-zinc-100 rounded-md"></div>
                    </div>
                  </div>
                  <div className="w-2/3 p-6 flex flex-col items-center">
                    <div className="w-full max-w-[200px] h-[280px] bg-white shadow-md border border-zinc-200 p-4">
                      <div className="h-2 w-24 bg-zinc-800 rounded mb-4"></div>
                      <div className="h-1 w-full bg-zinc-200 rounded mb-2"></div>
                      <div className="h-1 w-[80%] bg-zinc-200 rounded mb-4"></div>
                      <div className="h-1.5 w-16 bg-zinc-400 rounded mb-2"></div>
                      <div className="h-1 w-full bg-zinc-200 rounded mb-1"></div>
                      <div className="h-1 w-full bg-zinc-200 rounded mb-1"></div>
                      <div className="h-1 w-[90%] bg-zinc-200 rounded mb-4"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16">
          <div className="lg:w-1/2 w-full">
            <div className="relative bg-zinc-900 rounded-3xl border border-zinc-800 p-8 shadow-2xl">
              {/* CSS Mockup of Interview */}
              <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col h-[360px]">
                <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Live Interview</span>
                  <div className="px-2 py-1 rounded bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center gap-1.5 animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> RECORDING
                  </div>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-hidden">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white"><Bot className="h-4 w-4" /></div>
                    <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-sm w-3/4">
                      <div className="h-2 w-full bg-zinc-700 rounded mb-2"></div>
                      <div className="h-2 w-full bg-zinc-700 rounded mb-2"></div>
                      <div className="h-2 w-[60%] bg-zinc-700 rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-[#1da074] flex items-center justify-center text-white"><Mic className="h-4 w-4" /></div>
                    <div className="bg-[#1da074] p-3 rounded-2xl rounded-tr-sm w-2/3">
                      <div className="h-2 w-full bg-white/30 rounded mb-2"></div>
                      <div className="h-2 w-[80%] bg-white/30 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:w-1/2 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">
              Master your communication with our AI Conversational Trainer.
            </h2>
            <p className="text-lg text-zinc-600 leading-relaxed">
              Practice behavioral and technical rounds with an ultra-low latency conversational AI that adapts to your target role and persona.
            </p>
            <ul className="space-y-4 pt-4">
              <li className="flex gap-3 text-zinc-700">
                <CheckCircle2 className="h-6 w-6 text-[#1a91f0] flex-shrink-0" />
                <span>Live voice-to-voice mock interviews.</span>
              </li>
              <li className="flex gap-3 text-zinc-700">
                <CheckCircle2 className="h-6 w-6 text-[#1a91f0] flex-shrink-0" />
                <span>Detailed vocal fingerprint and pacing analysis.</span>
              </li>
              <li className="flex gap-3 text-zinc-700">
                <CheckCircle2 className="h-6 w-6 text-[#1a91f0] flex-shrink-0" />
                <span>Real-time feedback on your answers and delivery.</span>
              </li>
            </ul>
            <div className="pt-6">
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-[#1da074] hover:bg-[#15805c] text-white rounded-lg font-semibold transition-colors">
                Try a mock interview
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
