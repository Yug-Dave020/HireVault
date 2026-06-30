import Link from "next/link";
import { Users, ShieldCheck, Zap } from "lucide-react";

export function HiringManagerSection() {
  return (
    <section className="py-24 bg-white relative overflow-hidden" id="employers">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1da074]/10 text-[#1da074] text-sm font-semibold mb-6">
              <ShieldCheck className="w-4 h-4" />
              For Employers & Hiring Managers
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-6 tracking-tight">
              Find the top 1% of talent, instantly.
            </h2>
            <p className="text-lg text-zinc-600 mb-8 leading-relaxed">
              HireVault isn&apos;t just for candidates. We provide specialized access for hiring managers to search, screen, and acquire top talent directly from our platform.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                "Advanced ATS-compliant resume parsing and search.",
                "AI-driven candidate matching to your job descriptions.",
                "Direct communication channels with verified professionals.",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-[#1da074]/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-3 h-3 text-[#1da074]" />
                  </div>
                  <span className="text-zinc-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/hiring/login" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-semibold shadow-md transition-all"
              >
                Employer Login
                <Users className="w-4 h-4" />
              </Link>
              <Link 
                href="/hiring/login" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-900 rounded-xl font-semibold transition-all"
              >
                Sign up as Manager
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#1da074] to-blue-500 rounded-3xl opacity-20 blur-2xl"></div>
            <div className="relative bg-zinc-50 border border-zinc-200 rounded-3xl p-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-[#1da074]/10 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#1da074]" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Employer Portal</h3>
                  <p className="text-sm text-zinc-500">Access exclusive hiring tools</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-10 bg-white rounded-lg border border-zinc-200/60 shadow-sm w-full animate-pulse"></div>
                <div className="h-10 bg-white rounded-lg border border-zinc-200/60 shadow-sm w-5/6 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="h-10 bg-white rounded-lg border border-zinc-200/60 shadow-sm w-4/6 animate-pulse" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
