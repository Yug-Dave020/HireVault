import { Activity, Briefcase, Check, Mic, Zap } from "lucide-react";

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 bg-white border-t border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold text-[#0f1c2e] tracking-tight sm:text-5xl">
            Other HireVault features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* 1. Job Description Match (4 cols) */}
          <div className="md:col-span-4 bg-[#f0fdf4] rounded-3xl p-8 relative overflow-hidden min-h-[360px] flex flex-col group border border-emerald-100/50">
            <h3 className="text-2xl font-bold text-[#0f1c2e] mb-3 relative z-10">Job Description Match</h3>
            <p className="text-emerald-800/80 font-medium relative z-10">See exactly how well your CV aligns with any role.</p>
            
            {/* CSS Graphic */}
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-white rounded-2xl shadow-xl p-6 border border-emerald-100 transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-4 border-b border-emerald-50 pb-4">
                <div className="w-10 h-10 rounded bg-emerald-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-800">Senior Engineer</div>
                  <div className="text-xs text-zinc-500">Stripe</div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-emerald-600">Match Score</div>
                <div className="text-2xl font-black text-emerald-500">92%</div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[92%]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Live Mock Interviews (8 cols) */}
          <div className="md:col-span-8 bg-[#f5f3ff] rounded-3xl p-8 relative overflow-hidden min-h-[360px] flex flex-col justify-between group border border-purple-100/50">
            <div className="relative z-10 max-w-sm">
              <h3 className="text-2xl font-bold text-[#0f1c2e] mb-3">Live Mock Interviews</h3>
              <p className="text-purple-800/70 font-medium">Ultra-low latency conversational agents ready to test your behavioral and technical knowledge.</p>
            </div>
            
            {/* CSS Graphic */}
            <div className="absolute -bottom-4 right-8 w-96 h-64 bg-white rounded-t-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border border-purple-100 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-zinc-600">Recording Session</span>
                </div>
                <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded">AI Interviewer</span>
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center"><Mic className="h-4 w-4 text-purple-600"/></div>
                  <div className="bg-purple-50 p-3 rounded-2xl rounded-tl-sm w-3/4">
                    <div className="h-2 w-full bg-purple-200 rounded mb-1.5"></div>
                    <div className="h-2 w-4/5 bg-purple-200 rounded"></div>
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex-shrink-0"></div>
                  <div className="bg-[#1da074] p-3 rounded-2xl rounded-tr-sm w-2/3">
                    <div className="flex items-center gap-1 h-3">
                      {[1,2,3,4,5,6,7].map(i => (
                        <div key={i} className="w-1 bg-white/60 rounded-full animate-pulse" style={{ height: `${Math.max(40, Math.random() * 100)}%`, animationDelay: `${i*0.1}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Instant Expert Feedback (8 cols) */}
          <div className="md:col-span-8 bg-[#fffbeb] rounded-3xl p-8 relative overflow-hidden min-h-[360px] flex flex-col group border border-amber-100/50">
            <div className="relative z-10 max-w-sm mb-8">
              <h3 className="text-2xl font-bold text-[#0f1c2e] mb-3">Instant Expert Feedback</h3>
              <p className="text-amber-800/80 font-medium">Get immediate actionable feedback on your interview answers and resume bullet points.</p>
            </div>
            
            {/* CSS Graphic */}
            <div className="absolute top-8 -right-4 w-[400px] bg-white rounded-2xl shadow-2xl p-5 border border-amber-100 transform group-hover:-translate-x-4 transition-transform duration-500">
              <div className="space-y-4">
                <div className="relative">
                  <div className="text-[10px] text-zinc-400 mb-1">Original Bullet</div>
                  <div className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    Did marketing campaigns and increased sales a lot.
                  </div>
                  {/* Highlight Tooltip */}
                  <div className="absolute -bottom-3 -right-2 bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Needs metrics!
                  </div>
                </div>
                <div className="pl-4 border-l-2 border-[#1da074] pt-2">
                  <div className="text-[10px] text-[#1da074] font-bold mb-1 flex items-center gap-1"><Check className="h-3 w-3"/> AI Suggestion</div>
                  <div className="text-xs text-zinc-800 font-medium bg-[#f0fdf4] p-3 rounded-lg border border-emerald-100">
                    Spearheaded 5+ cross-channel marketing campaigns, driving a 45% increase in lead generation and generating $2M in revenue.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. ATS Analysis Engine (4 cols) */}
          <div className="md:col-span-4 bg-[#f0f9ff] rounded-3xl p-8 relative overflow-hidden min-h-[360px] flex flex-col group border border-blue-100/50">
            <h3 className="text-2xl font-bold text-[#0f1c2e] mb-3 relative z-10">ATS Analysis Engine</h3>
            <p className="text-blue-800/70 font-medium relative z-10">Zero missed keywords.</p>
            
            {/* CSS Graphic */}
            <div className="absolute bottom-8 right-8 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
              <div className="relative w-36 h-36 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-blue-50">
                <svg className="w-full h-full absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#e0f2fe" strokeWidth="8" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#0284c7" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="25.12" strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="text-center">
                  <div className="text-3xl font-black text-[#0f1c2e]">100</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">ATS Score</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Unlimited CV Variants (6 cols) */}
          <div className="md:col-span-6 bg-[#f8fafc] rounded-3xl p-8 relative overflow-hidden min-h-[360px] flex flex-col group border border-slate-200/50">
            <h3 className="text-2xl font-bold text-[#0f1c2e] mb-3 relative z-10">Unlimited CV Variants</h3>
            <p className="text-slate-600 font-medium relative z-10 max-w-xs">Clone and tailor your CV instantly for every specific application.</p>
            
            {/* CSS Graphic */}
            <div className="absolute -bottom-10 right-0 w-64 h-64 perspective-[1000px] flex items-center justify-center group-hover:translate-x-2 transition-transform duration-500">
              {/* Card 3 (Back) */}
              <div className="absolute w-48 h-64 bg-white border border-slate-200 rounded-xl shadow-sm transform translate-x-12 translate-y-8 rotate-12 opacity-40"></div>
              {/* Card 2 (Middle) */}
              <div className="absolute w-48 h-64 bg-white border border-slate-200 rounded-xl shadow-md transform translate-x-6 translate-y-4 rotate-6 opacity-70"></div>
              {/* Card 1 (Front) */}
              <div className="absolute w-48 h-64 bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col p-4">
                <div className="h-2 w-1/2 bg-[#1da074] rounded mb-4"></div>
                <div className="space-y-2 mb-6">
                  <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                  <div className="h-1.5 w-[90%] bg-slate-100 rounded"></div>
                  <div className="h-1.5 w-[70%] bg-slate-100 rounded"></div>
                </div>
                <div className="h-2 w-1/3 bg-slate-300 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                  <div className="h-1.5 w-[80%] bg-slate-100 rounded"></div>
                  <div className="h-1.5 w-[85%] bg-slate-100 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Vocal Fingerprint (6 cols) */}
          <div className="md:col-span-6 bg-[#fff1f2] rounded-3xl p-8 relative overflow-hidden min-h-[360px] flex flex-col group border border-rose-100/50">
            <h3 className="text-2xl font-bold text-[#0f1c2e] mb-3 relative z-10">Vocal Fingerprint</h3>
            <p className="text-rose-800/70 font-medium relative z-10 max-w-sm">Our AI analyzes your speaking pace, filler word ratio, and confidence in real-time.</p>
            
            {/* CSS Graphic */}
            <div className="absolute bottom-6 right-6 w-[280px] h-40 bg-white rounded-2xl shadow-xl border border-rose-50 p-5 flex flex-col justify-end gap-1 transform group-hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-500" />
                <span className="text-xs font-bold text-zinc-700">Pace & Tone Analysis</span>
              </div>
              <div className="flex items-end justify-between h-20 gap-1 w-full px-2">
                {[40, 60, 45, 80, 50, 90, 70, 45, 60, 30, 85, 55, 65, 40].map((height, i) => (
                  <div 
                    key={i} 
                    className="w-full bg-gradient-to-t from-rose-500 to-rose-300 rounded-t-sm animate-pulse" 
                    style={{ height: `${height}%`, animationDelay: `${i * 0.05}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
