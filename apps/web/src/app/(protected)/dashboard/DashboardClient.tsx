"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  MapPin, Briefcase, ArrowRight, Video,
  FileText, TrendingUp, BarChart3, AlertCircle, CheckCircle, Loader2, DollarSign, Sparkles,
  Network
} from "lucide-react";
import Link from "next/link";
import { VariantCard } from "./VariantCard";
import { CreateVariantModal } from "./CreateVariantModal";
import { GuidedTour } from "@/components/ui/GuidedTour";

export function DashboardClient({
  profile,
  activeVariants,
  displayName,
  primaryRole,
  locations,
  skills,
  hasCV,
  hasInterview,
  marketAlignmentIndex,
  totalVariants,
  activePublicLinks,
  suggestedGaps,
  hasCompletedTour,
}: any) {
  const router = useRouter();
  const supabase = createClient();
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [showTour, setShowTour] = useState(!hasCompletedTour);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("hirevault_tour_completed") === "true") {
        setShowTour(false);
      }
    }
  }, []);

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
    <div className="flex-grow flex flex-col bg-[#f8f9fa] overflow-y-auto relative">
      {showTour && <GuidedTour onComplete={() => setShowTour(false)} />}
      <div className="p-6 md:p-10 space-y-8 flex-grow max-w-[1200px] mx-auto w-full">

        {/* Welcome Header */}
        <section aria-label="Welcome">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-900 border-2 border-white shadow-sm text-slate-200 flex items-center justify-center font-bold text-xl uppercase shrink-0">
              {displayName.charAt(0) || "U"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-2">
                Welcome, {displayName.split(" ")[0]} <span className="text-2xl">👋</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3.5 mt-1.5 text-sm text-zinc-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  <span>{primaryRole}</span>
                </div>
                {locations.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{locations.slice(0, 3).join(", ")}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Top Grid: Market Alignment & Checklist & Salary Negotiation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Card: Alignment & Pipeline */}
          <div className="bg-white rounded-[20px] border border-zinc-200/80 p-6 shadow-sm flex flex-col justify-between space-y-6 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-zinc-900">Career Market Alignment</h2>
              <Link href="/dashboard/coherence" className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700">View Details &rsaquo;</Link>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Alignment Score</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-zinc-800">{marketAlignmentIndex}%</span>
                </div>
              </div>
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>

            <div className="w-full h-px bg-zinc-100" />

            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block">Application Pipeline</span>
                <p className="text-[13px] font-medium text-zinc-900">{totalVariants} CV Variants • {activePublicLinks} Active Links</p>
              </div>
              <button
                onClick={() => setShowOnlyPublic(!showOnlyPublic)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${showOnlyPublic ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
              >
                {showOnlyPublic ? "Show All" : "Filter Public"}
              </button>
            </div>
          </div>

          {/* Right Card: Action Items */}
          <div className="bg-white rounded-[20px] border border-zinc-200/80 p-6 shadow-sm flex flex-col space-y-4 max-h-96 overflow-y-auto">
            <h2 className="text-[15px] font-bold text-zinc-900 mb-2">Your action items</h2>
            <div className="space-y-3 flex-grow">
              {[
                { done: hasCV, label: "Create or Import CV Canvas", href: "/cv" },
                { done: hasInterview, label: "Conduct first AI Interview", href: "/interview" },
                { done: hasCV && totalVariants > 0, label: "Export optimized CV PDF", href: "/cv" },
              ].map(({ done, label, href }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50/50 border border-zinc-100">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${done
                    ? "bg-[#1da074] text-white"
                    : "border border-zinc-300 bg-white"
                    }`}>
                    {done && <CheckCircle className="h-3.5 w-3.5" />}
                  </div>
                  {href ? (
                    <Link
                      href={href}
                      className={`text-sm ${done ? "line-through text-zinc-400 font-normal" : "text-zinc-800 hover:text-indigo-600 font-semibold"}`}
                    >
                      {label}
                    </Link>
                  ) : (
                    <span className={`text-sm ${done ? "line-through text-zinc-400" : "text-zinc-800 font-semibold"}`}>
                      {label}
                    </span>
                  )}
                </div>
              ))}
            </div>
            {hasCV && totalVariants > 0 && (
              <div className="text-center pt-2">
                <span className="text-[13px] font-medium text-zinc-500">You're making great progress! 🎉</span>
              </div>
            )}
          </div>

          {/* Third Card: Salary Negotiation */}
          <div className="bg-white rounded-[20px] border border-zinc-200/80 p-6 shadow-sm flex flex-col space-y-4 max-h-96 overflow-y-auto">
            <h2 className="text-[15px] font-bold text-zinc-900 mb-2">Salary Negotiation</h2>
            <div className="flex flex-col items-center justify-center flex-grow text-center space-y-3 p-4 border border-zinc-100 rounded-xl bg-zinc-50/50">
              <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 mb-1 shrink-0">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-zinc-600">Practice your negotiation skills with our AI recruiter to maximize your next offer.</p>
              <Link href="/dashboard/negotiate" className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-full shadow-sm transition-all w-full">
                Start Simulator
              </Link>
            </div>
          </div>
        </div>

        {/* Full Width Banner: Application Accelerators */}
        <section className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-[20px] border border-indigo-100 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
            <Sparkles className="w-64 h-64 text-indigo-600" />
          </div>
          <div className="space-y-3 relative z-10 max-w-xl">
            <h2 className="text-xl md:text-2xl font-bold text-indigo-950 tracking-tight">
              Accelerate your applications with our premium tools
            </h2>
            <p className="text-sm text-indigo-900/70 font-medium">
              Discover new companies and jobs that are just right for you and apply with your optimized HireVault profile.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-indigo-800 shadow-sm">ATS CV Studio</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-indigo-800 shadow-sm">AI Interviewer</span>
              <span className="px-3 py-1 bg-white rounded-full text-xs font-bold text-indigo-800 shadow-sm">Salary Negotiation</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
            <Link
              href="/cv"
              className="px-6 py-3 bg-indigo-950 hover:bg-indigo-900 text-white font-bold text-sm rounded-full shadow-sm transition-all text-center whitespace-nowrap"
            >
              Open CV Studio
            </Link>
            <button
              onClick={startInterviewSession}
              disabled={isStartingInterview}
              className="px-6 py-3 bg-white hover:bg-zinc-50 text-indigo-950 font-bold text-sm rounded-full shadow-sm border border-indigo-200 transition-all text-center flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {isStartingInterview ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Interview"}
            </button>
          </div>
        </section>

        {/* Bottom Grid: Skills/Gaps & Variants Vault */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Skills & Gaps */}
          <div className="space-y-6">
            <div className="bg-white rounded-[20px] border border-zinc-200/80 p-6 shadow-sm max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-bold text-zinc-900">Suggested Skill Gaps</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-600 uppercase tracking-wider">New</span>
              </div>

              {suggestedGaps.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {suggestedGaps.map((gap: string) => (
                    <div key={gap} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-zinc-50/50">
                      <span className="text-sm font-semibold text-zinc-800">{gap}</span>
                      <Button size="sm" variant="outline" onClick={() => handleAddSkill(gap)} disabled={isAddingSkill} className="h-8 text-xs font-bold rounded-lg border-zinc-200 hover:bg-indigo-50 hover:text-indigo-600">
                        + Add
                      </Button>
                    </div>
                  ))}
                  <p className="text-[11px] text-zinc-500 mt-2">Adding these skills can boost your discovery score.</p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                  <p className="text-sm font-bold text-emerald-800">Your profile is fully optimized!</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[20px] border border-zinc-200/80 p-6 shadow-sm max-h-96 overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h3 className="text-[15px] font-bold text-zinc-900">Your Core Skills</h3>
                <Link href="/dashboard/skill-graph" className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5">
                  Skills Tree <Network className="h-4 w-4" />
                </Link>
              </div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 10).map((skill: string) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 10 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-50 text-zinc-400 border border-zinc-100">
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
          </div>

          {/* Right Column: CV Variants Vault */}
          <div className="lg:col-span-2 bg-white rounded-[20px] border border-zinc-200/80 p-6 shadow-sm flex flex-col min-h-[200px] max-h-[350px] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 border-b border-zinc-100 pb-4">
              <h3 className="text-[15px] font-bold text-zinc-900 flex items-center gap-2">
                Your CV Variants {showOnlyPublic && <span className="text-xs font-normal bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">Public Only</span>}
              </h3>
              <CreateVariantModal masterProfile={profile?.cv_profile} defaultRole={primaryRole} />
            </div>

            <div className="flex-grow">
              {displayedVariants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedVariants.map((variant: any) => (
                    <VariantCard key={variant.id} variant={variant} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/50">
                  <FileText className="h-8 w-8 text-zinc-300 mb-3" />
                  <p className="text-sm text-zinc-500 font-medium mb-4">
                    {showOnlyPublic ? "No public CV variants found." : "No CV variants created yet."}
                  </p>
                  {!showOnlyPublic && <CreateVariantModal masterProfile={profile?.cv_profile} defaultRole={primaryRole} />}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
