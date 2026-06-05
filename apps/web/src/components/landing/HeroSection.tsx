import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, LayoutTemplate, Sparkles } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-16 sm:pt-32 sm:pb-24 min-h-[90vh] flex items-center">
      {/* Background gradients for the glassy/iridescent feel */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-gradient-to-br from-[#1a91f0]/20 to-[#1da074]/20 blur-[100px] rounded-full opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 translate-y-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/10 to-transparent blur-[80px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">

          {/* Left Column: Typography & CTA */}
          <div className="flex-1 text-left pt-10 lg:pt-0 z-10 max-w-2xl">
            <p className="text-xl sm:text-xl font-bold text-zinc-700 mb-10">
              HireVault - Unlock your career potential
            </p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 tracking-tight leading-[1.05] mb-6">
              AI Career <br /> Acceleration.
            </h1>

            <p className="text-lg sm:text-xl text-zinc-500 mb-10 leading-relaxed max-w-xl">
              Build pristine ATS-compliant CVs tailored for the roles you want, and master your communication skills with our ultra-low latency conversational AI trainer.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                href="/signup"
                className="px-8 py-4 bg-[#1da074] hover:bg-[#15805c] text-white rounded-full font-bold text-lg shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                Start for free
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Right Column: Floating Glossy Mockup */}
          <div className="flex-1 w-full relative z-10">
            {/* Decorative background shapes */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[500px] max-h-[500px] border border-zinc-200/50 rounded-[40px] rotate-12 bg-white/40 backdrop-blur-3xl shadow-2xl -z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[450px] max-h-[450px] border border-white/60 rounded-[30px] -rotate-6 bg-gradient-to-br from-white/80 to-white/20 backdrop-blur-xl shadow-xl -z-10"></div>

            <div className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-zinc-200 p-2 shadow-2xl relative transform transition-transform hover:scale-[1.02] duration-500">
              <div className="absolute -top-4 -right-4 p-4 z-20">
                <div className="bg-[#1da074] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
                  <CheckCircle2 className="h-4 w-4" /> ATS: 100%
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl border border-zinc-100 overflow-hidden flex flex-col h-[450px]">
                {/* Mockup Header */}
                <div className="h-12 border-b border-zinc-100 bg-white flex items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4 text-[#1a91f0]" />
                    <span className="font-bold text-zinc-800 text-sm">CV Studio</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-200"></div>
                  </div>
                </div>

                {/* Mockup Body */}
                <div className="flex flex-1 overflow-hidden relative">
                  <div className="w-1/3 bg-white border-r border-zinc-100 p-4 space-y-4">
                    <div className="h-3 w-16 bg-zinc-200 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-8 bg-[#1a91f0]/10 border border-[#1a91f0]/30 rounded-md flex items-center px-2"><div className="h-2 w-12 bg-[#1a91f0]/60 rounded"></div></div>
                      <div className="h-8 bg-zinc-50 rounded-md border border-zinc-100 flex items-center px-2"><div className="h-2 w-16 bg-zinc-300 rounded"></div></div>
                      <div className="h-8 bg-zinc-50 rounded-md border border-zinc-100 flex items-center px-2"><div className="h-2 w-10 bg-zinc-300 rounded"></div></div>
                    </div>
                  </div>
                  <div className="w-2/3 bg-zinc-100/50 p-6 flex justify-center items-start overflow-hidden">
                    <div className="w-full bg-white shadow-sm border border-zinc-200 h-[500px] p-6 space-y-6">
                      <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
                        <div>
                          <div className="h-6 bg-zinc-800 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-zinc-400 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-zinc-800 rounded w-20"></div>
                        <div className="h-2 bg-zinc-300 rounded w-full"></div>
                        <div className="h-2 bg-zinc-300 rounded w-[90%]"></div>
                        <div className="h-2 bg-zinc-300 rounded w-[95%]"></div>
                      </div>
                      <div className="space-y-4 pt-2">
                        <div className="h-4 bg-zinc-800 rounded w-24"></div>
                        <div className="space-y-2">
                          <div className="flex justify-between"><div className="h-3 bg-zinc-500 rounded w-32"></div><div className="h-3 bg-zinc-300 rounded w-12"></div></div>
                          <div className="h-2 bg-zinc-300 rounded w-[85%]"></div>
                          <div className="h-2 bg-zinc-300 rounded w-[92%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating AI Agent bubble */}
                  <div className="absolute bottom-6 right-6 bg-[#0f1c2e] p-3 rounded-2xl rounded-tr-sm shadow-xl flex items-center gap-3 border border-zinc-700 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-[#1da074] flex items-center justify-center text-white"><Bot className="h-4 w-4" /></div>
                    <div>
                      <div className="text-xs font-bold text-white mb-1">AI Coach</div>
                      <div className="h-1.5 w-16 bg-white/20 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
