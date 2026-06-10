"use client";

import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

export function DarkThemeShowcase() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const index = Math.round(scrollLeft / 324);
      setActiveIndex(index);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -324 : 324;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollTo = (index: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: index * 324, behavior: "smooth" });
    }
  };

  return (
    <section id="templates" className="py-24 bg-[#0f1c2e] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/3 space-y-6 z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Beautiful themes for any industry.
            </h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Stand out with professionally curated designs. From Classic Executive to Tech Minimalist, each theme strictly preserves ATS-scannability so your CV always passes the robot screen.
            </p>
            <div className="pt-4">
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-100 text-[#0f1c2e] rounded-lg font-semibold transition-colors shadow-lg">
                View all templates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="pt-8 flex items-center gap-4 text-slate-400 text-sm font-medium">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f1c2e] bg-slate-700 flex items-center justify-center text-[10px] text-white">
                    {i}
                  </div>
                ))}
              </div>
              <p>Trusted by professionals worldwide</p>
            </div>
          </div>
          
          <div className="lg:w-2/3 w-full flex flex-col">
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto pb-4 snap-x scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {/* Template 1: Classic Minimalist (Green) */}
              <div className="flex-shrink-0 w-[300px] h-[420px] bg-white rounded-sm p-5 shadow-2xl snap-center transform hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button className="px-4 py-2 bg-[#1da074] text-white text-sm font-bold rounded-lg shadow-lg">Use Template</button>
                </div>
                
                {/* Resume Content */}
                <div className="flex flex-col h-full text-[6px] leading-[1.4] text-zinc-800">
                  <h1 className="text-sm font-bold text-[#1da074] mb-1">Yug Dave</h1>
                  <p className="text-zinc-500 mb-2">New York, NY • 123-456-7890 • yugdave@email.com • linkedin.com/in/yugdave</p>
                  
                  <p className="mb-3 text-[5px] text-zinc-600">
                    7+ years of software engineering experience, driving product growth and engagement. Increased system performance by 25%, reduced latency by 40%, and contributed to features generating $2M in revenue. Led architectural strategies resulting in a 45% increase in deployment speed.
                  </p>
                  
                  <h2 className="font-bold text-[7px] uppercase mb-1">Work Experience</h2>
                  
                  <div className="mb-3">
                    <h3 className="font-bold">Senior Software Engineer • New York, United States</h3>
                    <p className="font-bold mb-1">TechCorp Inc.</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months through the development and execution of microservices architecture.</li>
                      <li>Improved company&apos;s online presence by 25%, driving a 40% increase in web traffic through successful SEO optimizations.</li>
                      <li>Led the analysis of over 75 database queries, uncovering actionable insights that led to a 25% increase in performance.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold">Software Engineer • Full-time</h3>
                    <p className="font-bold mb-1">Innovate LLC</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Managed a comprehensive cross-functional infrastructure upgrade, overseeing a team of 10 developers.</li>
                      <li>Improved CI/CD pipelines resulting in 15% increase in deployment reliability month over month.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template 2: Executive (Red/Border) */}
              <div className="flex-shrink-0 w-[300px] h-[420px] bg-white rounded-sm p-5 shadow-2xl snap-center transform hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button className="px-4 py-2 bg-[#1da074] text-white text-sm font-bold rounded-lg shadow-lg">Use Template</button>
                </div>
                
                {/* Resume Content */}
                <div className="flex flex-col h-full text-[6px] leading-[1.4] text-zinc-800">
                  <div className="border-t-2 border-red-600 w-full mb-2"></div>
                  <h1 className="text-sm font-bold text-red-600 mb-1">Yug Dave</h1>
                  <p className="text-zinc-500 mb-2">New York, NY • 123-456-7890 • yugdave@email.com • linkedin.com/in/yugdave</p>
                  
                  <p className="mb-3 text-[5px] text-zinc-600">
                    7+ years of software engineering experience, driving product growth and engagement. Increased system performance by 25%, reduced latency by 40%, and contributed to features generating $2M in revenue. Led architectural strategies resulting in a 45% increase in deployment speed.
                  </p>
                  
                  <h2 className="font-bold text-[7px] text-red-600 uppercase mb-1">Work Experience</h2>
                  
                  <div className="mb-3">
                    <h3 className="font-bold">Senior Software Engineer • New York, United States</h3>
                    <p className="font-bold mb-1">TechCorp Inc.</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months through the development and execution of microservices architecture.</li>
                      <li>Improved company&apos;s online presence by 25%, driving a 40% increase in web traffic through successful SEO optimizations.</li>
                      <li>Led the analysis of over 75 database queries, uncovering actionable insights that led to a 25% increase in performance.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold">Software Engineer • Full-time</h3>
                    <p className="font-bold mb-1">Innovate LLC</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Managed a comprehensive cross-functional infrastructure upgrade, overseeing a team of 10 developers.</li>
                      <li>Improved CI/CD pipelines resulting in 15% increase in deployment reliability month over month.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template 3: Professional (Centered/Black) */}
              <div className="flex-shrink-0 w-[300px] h-[420px] bg-white rounded-sm p-5 shadow-2xl snap-center transform hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button className="px-4 py-2 bg-[#1da074] text-white text-sm font-bold rounded-lg shadow-lg">Use Template</button>
                </div>
                
                {/* Resume Content */}
                <div className="flex flex-col h-full text-[6px] leading-[1.4] text-zinc-800">
                  <div className="text-center mb-2">
                    <h1 className="text-sm font-bold text-black mb-1">Yug Dave</h1>
                    <p className="text-zinc-500">New York, NY • 123-456-7890 • yugdave@email.com • linkedin.com/in/yugdave</p>
                  </div>
                  <div className="border-t border-black w-full mb-2"></div>
                  
                  <p className="mb-3 text-[5px] text-zinc-600 text-center">
                    7+ years of software engineering experience, driving product growth and engagement. Increased system performance by 25%, reduced latency by 40%, and contributed to features generating $2M in revenue. Led architectural strategies resulting in a 45% increase in deployment speed.
                  </p>
                  
                  <h2 className="font-bold text-[7px] text-black uppercase mb-1 border-b border-black pb-0.5 inline-block w-full">Work Experience</h2>
                  
                  <div className="mb-3 mt-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold">Senior Software Engineer</h3>
                      <span className="text-zinc-500 text-[5px]">New York, United States</span>
                    </div>
                    <p className="font-bold mb-1">TechCorp Inc.</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months through the development and execution of microservices architecture.</li>
                      <li>Improved company&apos;s online presence by 25%, driving a 40% increase in web traffic through successful SEO optimizations.</li>
                      <li>Led the analysis of over 75 database queries, uncovering actionable insights that led to a 25% increase in performance.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold">Software Engineer</h3>
                      <span className="text-zinc-500 text-[5px]">Full-time</span>
                    </div>
                    <p className="font-bold mb-1">Innovate LLC</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Managed a comprehensive cross-functional infrastructure upgrade, overseeing a team of 10 developers.</li>
                      <li>Improved CI/CD pipelines resulting in 15% increase in deployment reliability month over month.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template 4: Elegant Corporate (Dark Blue Header) */}
              <div className="flex-shrink-0 w-[300px] h-[420px] bg-[#fafafa] rounded-sm p-5 shadow-2xl snap-center transform hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button className="px-4 py-2 bg-[#1e3a8a] text-white text-sm font-bold rounded-lg shadow-lg">Use Template</button>
                </div>
                
                <div className="flex flex-col h-full text-[6px] leading-[1.4] text-zinc-800">
                  <div className="bg-[#1e3a8a] p-3 -m-5 mb-3 text-white">
                    <h1 className="text-sm font-bold text-white mb-1">Yug Dave</h1>
                    <p className="text-[#e2e8f0] mb-1">New York, NY • 123-456-7890 • yugdave@email.com</p>
                  </div>
                  
                  <p className="mb-3 text-[5px] text-zinc-600 mt-2">
                    7+ years of software engineering experience, driving product growth and engagement. Increased system performance by 25%, reduced latency by 40%, and contributed to features generating $2M in revenue.
                  </p>
                  
                  <h2 className="font-bold text-[7px] text-[#1e3a8a] uppercase mb-1 border-b-2 border-[#1e3a8a] pb-0.5">Work Experience</h2>
                  
                  <div className="mb-3 mt-1">
                    <h3 className="font-bold text-[#1e3a8a]">Senior Software Engineer • New York, United States</h3>
                    <p className="font-bold mb-1">TechCorp Inc.</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months through the development and execution of microservices architecture.</li>
                      <li>Improved company&apos;s online presence by 25%, driving a 40% increase in web traffic through successful SEO optimizations.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-[#1e3a8a]">Software Engineer • Full-time</h3>
                    <p className="font-bold mb-1">Innovate LLC</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Managed a comprehensive cross-functional infrastructure upgrade, overseeing a team of 10 developers.</li>
                      <li>Improved CI/CD pipelines resulting in 15% increase in deployment reliability month over month.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template 5: Creative Portfolio (Gold/Beige Right Align) */}
              <div className="flex-shrink-0 w-[300px] h-[420px] bg-white rounded-sm p-5 shadow-2xl snap-center transform hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button className="px-4 py-2 bg-[#b48600] text-white text-sm font-bold rounded-lg shadow-lg">Use Template</button>
                </div>
                
                <div className="flex flex-col h-full text-[6px] leading-[1.4] text-zinc-800 font-serif">
                  <div className="text-right border-r-[3px] border-[#b48600] pr-2 mb-3">
                    <h1 className="text-sm text-zinc-900 mb-1 tracking-wider">Yug Dave</h1>
                    <p className="text-zinc-500 mb-1 font-sans">New York, NY • 123-456-7890 • yugdave@email.com</p>
                  </div>
                  
                  <p className="mb-3 text-[5px] text-zinc-600 text-right font-sans">
                    7+ years of software engineering experience, driving product growth and engagement. Increased system performance by 25%, reduced latency by 40%.
                  </p>
                  
                  <h2 className="italic text-[7px] text-[#b48600] mb-2 border-b border-slate-100 pb-0.5 text-right">Work Experience</h2>
                  
                  <div className="mb-3 font-sans">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold">Senior Software Engineer</h3>
                      <span className="text-[#b48600] font-bold text-[5px]">2019 - Present</span>
                    </div>
                    <p className="font-bold mb-1">TechCorp Inc.</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months through the development and execution of microservices architecture.</li>
                      <li>Improved company&apos;s online presence by 25%, driving a 40% increase in web traffic.</li>
                    </ul>
                  </div>
                  
                  <div className="font-sans">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold">Software Engineer</h3>
                      <span className="text-[#b48600] font-bold text-[5px]">2017 - 2019</span>
                    </div>
                    <p className="font-bold mb-1">Innovate LLC</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Managed a comprehensive cross-functional infrastructure upgrade, overseeing a team of 10 developers.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Template 6: Bold Impact (Emerald Heavy Header) */}
              <div className="flex-shrink-0 w-[300px] h-[420px] bg-white rounded-sm p-5 shadow-2xl snap-center transform hover:-translate-y-2 transition-transform duration-300 relative group overflow-hidden">
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                  <button className="px-4 py-2 bg-[#10b981] text-white text-sm font-bold rounded-lg shadow-lg">Use Template</button>
                </div>
                
                <div className="flex flex-col h-full text-[6px] leading-[1.4] text-zinc-800 font-sans">
                  <div className="mb-3 border-l-[4px] border-[#10b981] pl-2">
                    <h1 className="text-lg font-black text-zinc-900 mb-1 tracking-tighter uppercase">Yug Dave</h1>
                    <p className="text-zinc-500 font-bold mb-1">New York, NY • 123-456-7890 • yugdave@email.com</p>
                  </div>
                  
                  <p className="mb-3 text-[5px] text-zinc-600">
                    7+ years of software engineering experience, driving product growth and engagement. Increased system performance by 25%, reduced latency by 40%, and contributed to features generating $2M in revenue.
                  </p>
                  
                  <div className="mb-2">
                    <h2 className="font-bold text-[6px] text-white bg-zinc-900 uppercase px-1.5 py-0.5 inline-block">Work Experience</h2>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="font-black uppercase text-zinc-800">Senior Software Engineer</h3>
                    <p className="font-bold text-[#10b981] mb-1">TechCorp Inc.</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months through the development and execution of microservices architecture.</li>
                      <li>Improved company&apos;s online presence by 25%, driving a 40% increase in web traffic.</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-black uppercase text-zinc-800">Software Engineer</h3>
                    <p className="font-bold text-[#10b981] mb-1">Innovate LLC</p>
                    <ul className="list-disc pl-3 space-y-1 text-[5px] text-zinc-600">
                      <li>Managed a comprehensive cross-functional infrastructure upgrade, overseeing a team of 10 developers.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Custom Navigation Arrows and Dots */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${activeIndex === index ? "bg-[#1da074] w-6" : "bg-slate-700 hover:bg-slate-500"}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => scroll('left')}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#1da074]"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => scroll('right')}
                  className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all focus:outline-none focus:ring-2 focus:ring-[#1da074]"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
}
