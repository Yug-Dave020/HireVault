export function TrustSection() {
  return (
    <section id="testimonials" className="py-24 bg-white border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight sm:text-4xl">
            Reviewed by the community. Trusted by professionals.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-start p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="text-4xl font-black text-[#1da074] mb-4">100%</div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">ATS Compliance</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Every CV generated is fully parsed and evaluated against standard applicant tracking systems to ensure zero drop-offs.
            </p>
          </div>

          <div className="flex flex-col items-start p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="text-4xl font-black text-[#1da074] mb-4">1,200+</div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">CV Variants Built</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Users generate multiple tailored versions of their professional history perfectly aligned to specific job descriptions.
            </p>
          </div>

          <div className="flex flex-col items-start p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="text-4xl font-black text-[#1a91f0] mb-4">1,500+</div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Live AI Interviews</h3>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Ultra-low latency conversational agents have helped thousands of users practice behavioral and technical rounds.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
