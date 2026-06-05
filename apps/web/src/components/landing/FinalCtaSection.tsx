import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="py-24 bg-[#0f1c2e] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1a91f0] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-6">
          All you need to land your dream job.
        </h2>
        <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
          Join thousands of professionals who have accelerated their career with HireVault. Start building your perfect CV today.
        </p>
        
        <Link 
          href="/signup" 
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#1a91f0] hover:bg-[#157ad1] text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1"
        >
          Start for free
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
