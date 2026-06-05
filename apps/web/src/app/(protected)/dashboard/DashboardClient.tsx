"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  Sparkles, MapPin, Briefcase, Award, ArrowRight, Video,
  FileText, TrendingUp, BarChart3, AlertCircle, BookOpen, CheckCircle, Plus, Loader2, DollarSign, Network
} from "lucide-react";
import Link from "next/link";
import { VariantCard } from "./VariantCard";
import { CreateVariantModal } from "./CreateVariantModal";

export function DashboardClient({
  profile,
  activeVariants,
  displayName,
  primaryRole,
  locations,
  skills,
  hasCV,
  marketAlignmentIndex,
  totalVariants,
  activePublicLinks,
  suggestedGaps,
  cvTheme,
}: any) {
  const router = useRouter();
  const supabase = createClient();
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  const startInterviewSession = async () => {
    setIsStartingInterview(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase.from("interview_sessions").insert({
        user_id: user.id,
        target_position: primaryRole || "Software Engineer",
        selected_persona: "Hiring Manager",
        status: "active"
      }).select().single();
      
      if (data && !error) {
        router.push(`/interview/${data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStartingInterview(false);
    }
  };

  const displayedVariants = showOnlyPublic 
    ? activeVariants.filter((v: any) => v.is_public)
    : activeVariants;

  const scrollToVault = () => {
    document.getElementById("variants-vault")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddSkill = async (skill: string) => {
    setIsAddingSkill(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && profile) {
      const currentSkills = profile.skills || [];
      if (!currentSkills.includes(skill)) {
        await supabase
          .from("user_profiles")
          .update({ skills: [...currentSkills, skill] })
          .eq("id", user.id);
        router.refresh();
      }
    }
    setIsAddingSkill(false);
  };

  return (
    <div className="flex-grow flex flex-col bg-[#f4f5f6] overflow-y-auto">
      <div className="p-8 space-y-8 flex-grow">

        <section aria-label="Welcome" className="border-b border-zinc-200/60 pb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5 text-[#1da074]" />
                <span>Career Accelerator Console</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                Welcome Back, {displayName}
              </h1>
              <div className="flex flex-wrap items-center gap-3.5 mt-2">
                <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                  <Briefcase className="h-4 w-4 text-zinc-400" />
                  <span>{primaryRole}</span>
                </div>
                {locations.length > 0 && (
                  <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-medium">
                    <MapPin className="h-4 w-4 text-zinc-400" />
                    <span>{locations.slice(0, 3).join(", ")}</span>
                    {locations.length > 3 && (
                      <span className="text-[#1da074] font-semibold">+{locations.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Badge variant="outline" className="px-3 py-1 border-zinc-200 text-zinc-600 text-xs rounded-lg bg-white">
                CV Theme: {cvTheme}
              </Badge>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" aria-label="Metrics Dashboard">
          {/* Card 1: Market Alignment */}
          <div 
            onClick={() => router.push('/dashboard/coherence')}
            className="border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all duration-200 flex justify-between items-start shadow-sm group"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block group-hover:text-indigo-500 transition-colors">Market Alignment</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800 group-hover:text-indigo-900 transition-colors">{marketAlignmentIndex}%</span>
                {marketAlignmentIndex > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#1da074] bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <TrendingUp className="h-2.5 w-2.5" />
                    Aggregate Health
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                    Awaiting Scans
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-indigo-400 transition-colors">Average match across variants</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#1da074] border border-emerald-100 group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Card 2: Application Pipeline */}
          <div 
            onClick={() => setShowOnlyPublic(!showOnlyPublic)}
            className={`border rounded-2xl p-5 cursor-pointer transition-all duration-200 flex justify-between items-start shadow-sm group ${
              showOnlyPublic 
                ? 'border-blue-400 bg-blue-50/30 shadow-md ring-1 ring-blue-400/20' 
                : 'border-zinc-200/60 bg-white hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <div className="space-y-1">
              <span className={`text-xs font-semibold uppercase tracking-wider block transition-colors ${showOnlyPublic ? 'text-blue-600' : 'text-zinc-400 group-hover:text-blue-500'}`}>Application Pipeline</span>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black transition-colors ${showOnlyPublic ? 'text-blue-900' : 'text-zinc-800 group-hover:text-blue-900'}`}>{totalVariants}</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  {activePublicLinks} Active Links
                </span>
              </div>
              <p className={`text-[11px] transition-colors ${showOnlyPublic ? 'text-blue-500 font-medium' : 'text-zinc-500 group-hover:text-blue-400'}`}>
                {showOnlyPublic ? "Filtering: Public Links Only" : "Total variants optimized"}
              </p>
            </div>
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center border transition-colors ${
              showOnlyPublic ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200'
            }`}>
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Card 3: Suggested Skill Gaps */}
          <div className="border border-zinc-200/60 rounded-2xl p-5 bg-white transition-all duration-200 flex justify-between items-start shadow-sm">
            <div className="space-y-1 w-full">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Suggested Skill Gaps</span>
              {suggestedGaps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestedGaps.map((gap: string) => (
                    <Popover key={gap}>
                      <PopoverTrigger className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 hover:border-amber-300 rounded-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/30">
                        + {gap}
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-4 z-50">
                        <div className="space-y-3">
                          <h4 className="font-semibold leading-none">Add Skill</h4>
                          <p className="text-sm text-muted-foreground">
                            Add <span className="font-bold text-zinc-900">{gap}</span> to your Core Profile?
                          </p>
                          <div className="flex justify-end gap-2 pt-2">
                            <Button size="sm" onClick={() => handleAddSkill(gap)} disabled={isAddingSkill} className="w-full bg-[#1da074] hover:bg-[#15805c] text-white">
                              {isAddingSkill ? "Adding..." : "Confirm"}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm font-black text-zinc-800">
                  Profile optimized
                </div>
              )}
              <p className="text-[11px] text-zinc-500 mt-2">Click to add to profile</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </div>

          {/* Card 4: Mock Interviews */}
          <div onClick={startInterviewSession} className="block border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all duration-200 flex justify-between items-start shadow-sm group">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block group-hover:text-indigo-500 transition-colors">Mock Interviews</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800 group-hover:text-indigo-900 transition-colors">0</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-indigo-400 transition-colors">Start a new session</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 group-hover:bg-indigo-100 group-hover:border-indigo-200 transition-colors">
              <Video className="h-4.5 w-4.5" />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6" aria-label="Accelerator Hub">
            <div className="flex items-center gap-2 font-semibold text-zinc-800 text-sm border-b border-zinc-100 pb-2">
              <Award className="h-4.5 w-4.5 text-[#1da074]" />
              <h2>Application Accelerators</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="border border-zinc-200 rounded-2xl p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-sm transition-shadow">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-[#1da074]" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">ATS Optimization Studio</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Import or create a structured resume canvas. Formatted to ensure 100% compliance with corporate Applicant Tracking Systems.
                  </p>
                </div>
                <Link
                  href="/cv"
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#1da074] hover:bg-[#15805c] text-white font-bold text-xs rounded-xl shadow-sm transition-all w-full"
                >
                  {hasCV ? "Open CV Studio" : "Build Optimised CV"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="border border-zinc-200 rounded-2xl p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-sm transition-shadow">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Video className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">Conversational Trainer</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Practise interactive mock behavioral and technical sessions with our advanced conversational AI trainer.
                  </p>
                </div>
                <button
                  onClick={startInterviewSession}
                  disabled={isStartingInterview}
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#0a121e] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all w-full disabled:opacity-50"
                >
                  {isStartingInterview ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Launch Mock Interview"}
                  {!isStartingInterview && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="border border-zinc-200 rounded-2xl p-6 bg-white flex flex-col justify-between space-y-6 hover:shadow-sm transition-shadow">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#1a91f0]" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">Offer Negotiation Simulator</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Practice compensation roleplay against automated hiring managers with hidden budget caps.
                  </p>
                </div>
                <Link
                  href="/dashboard/negotiate"
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#1a91f0] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all w-full"
                >
                  Start Negotiation
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div id="variants-vault" className="space-y-4 pt-2 scroll-mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-800 text-sm">
                  <FileText className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Your CV Variants Vault {showOnlyPublic && <span className="text-blue-500 font-normal">(Filtered: Public Only)</span>}</span>
                </div>
                <CreateVariantModal masterProfile={profile?.cv_profile} defaultRole={primaryRole} />
              </div>

              {displayedVariants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedVariants.map((variant: any) => (
                    <VariantCard key={variant.id} variant={variant} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-50/30">
                  <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 font-medium mb-4">
                    {showOnlyPublic ? "No public CV variants found." : "No CV variants created yet."}
                  </p>
                  {!showOnlyPublic && <CreateVariantModal masterProfile={profile?.cv_profile} defaultRole={primaryRole} />}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6" aria-label="Profile summary">
            <div className="border border-zinc-200 rounded-2xl p-6 bg-white space-y-4 shadow-sm">
              <div className="flex items-center justify-between font-semibold text-zinc-800 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-teal-600" />
                  <span>Your Core Skills</span>
                </div>
                <Link 
                  href="/dashboard/skill-graph" 
                  className="flex items-center gap-1.5 text-[#1a91f0] hover:text-blue-600 font-medium text-[14px] transition-colors"
                >
                  View Topology Graph <Network className="h-4 w-4" />
                </Link>
              </div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 10).map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-50 text-zinc-700 border border-zinc-200/50"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 10 && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-50 text-zinc-400 border border-zinc-100">
                      +{skills.length - 10} more
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-zinc-400 mb-2">No skills registered yet.</p>
                  <Link href="/profile" className="text-indigo-600 hover:underline font-bold text-xs">
                    Update profile preferences
                  </Link>
                </div>
              )}
            </div>

            <div className="border border-zinc-200 rounded-2xl p-6 bg-white space-y-4 shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-zinc-800 text-sm">
                <CheckCircle className="h-4.5 w-4.5 text-[#1da074]" />
                <span>Getting Started Checklist</span>
              </div>
              <div className="space-y-3">
                {[
                  { done: true, label: "Create your account", href: null },
                  { done: hasCV, label: "Create or Import CV Canvas", href: "/cv" },
                  { done: false, label: "Conduct first AI Interview", href: "/interview" },
                  { done: hasCV && totalVariants > 0, label: "Export optimized CV PDF", href: "/cv" },
                ].map(({ done, label, href }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`h-4.5 w-4.5 rounded-full flex items-center justify-center flex-shrink-0 ${done
                      ? "bg-[#1da074] text-white"
                      : "border border-zinc-300 bg-white"
                      }`}>
                      {done && (
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {href ? (
                      <Link
                        href={href}
                        className={`text-xs ${done ? "line-through text-zinc-400 font-normal" : "text-indigo-600 hover:underline font-bold"}`}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span className={`text-xs ${done ? "line-through text-zinc-400" : "text-zinc-600 font-medium"}`}>
                        {label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}
