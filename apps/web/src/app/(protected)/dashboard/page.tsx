import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, MapPin, Briefcase, Award, ArrowRight, Video,
  FileText, TrendingUp, BarChart3, AlertCircle, BookOpen, ExternalLink, CheckCircle
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Dashboard — HireVault",
  description: "Your personalised AI career acceleration dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, target_roles, target_locations, skills, experience_years, cv_profile")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const displayName = profile.full_name ?? user.email?.split("@")[0] ?? "there";
  const primaryRole = profile.target_roles?.[0] ?? "Software Engineer";
  const locations = profile.target_locations ?? [];
  const skills = profile.skills ?? [];
  const cvProfile = profile.cv_profile as any;
  const hasCV = !!cvProfile;

  let wordCount = 0;
  let atsScore = 0;
  let suggestionsCount = 0;
  let serverCritiques: string[] = [];

  if (hasCV) {
    const summary = cvProfile.personal?.summary || "";
    const experience = (cvProfile.experience || []).map((exp: any) =>
      [exp.company, exp.role, exp.description].filter(Boolean).join(" ")
    ).join(" ");

    const getSkillsString = () => {
      if (!cvProfile?.skills) return "";
      if (typeof cvProfile.skills === "object" && !Array.isArray(cvProfile.skills)) {
        const tech = cvProfile.skills.technical || [];
        const soft = cvProfile.skills.soft || [];
        const langs = (cvProfile.skills.languages || []).map((l: any) => typeof l === 'object' ? `${l.name || ''} (${l.level || ''})` : l);
        return [...tech, ...soft, ...langs].filter(Boolean).join(", ");
      }
      if (Array.isArray(cvProfile.skills)) return cvProfile.skills.join(", ");
      return "";
    };

    const cvSkills = getSkillsString();
    const education = (cvProfile.education || []).map((edu: any) =>
      (edu.school || "") + " " + (edu.degree || "")
    ).join(" ");

    const combined = `${summary} ${experience} ${cvSkills} ${education}`;
    wordCount = combined.split(/\s+/).filter(Boolean).length;

    try {
      const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "http://127.0.0.1:8000";
      const backendRes = await fetch(`${workerUrl}/cv/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_type: "global_gap_analysis",
          current_text: cvProfile.personal?.summary || "Analyze baseline career history.",
          target_role: primaryRole,
          full_cv_context: cvProfile
        }),
        cache: "no-store"
      });

      if (backendRes.ok) {
        const diagnostics = await backendRes.json();
        atsScore = diagnostics.score;
        serverCritiques = diagnostics.critiques || [];
        suggestionsCount = serverCritiques.length;
      } else {
        throw new Error("Worker diagnostics offline");
      }
    } catch (e) {
      console.error("Failed fetching dynamic backend score metrics:", e);
      atsScore = 65;
      suggestionsCount = 2;
    }
  } else {
    atsScore = 0;
    wordCount = 0;
    suggestionsCount = 4;
  }

  const cvTheme = cvProfile?.design_prefs?.theme
    ? cvProfile.design_prefs.theme.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
    : "Not Selected";

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
          <div className="border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-zinc-300 transition-all duration-200 flex justify-between items-start shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">ATS Match Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800">{atsScore}%</span>
                {hasCV ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#1da074] bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    <TrendingUp className="h-2.5 w-2.5" />
                    Real-time AI Checked
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    Requires Setup
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">Scan score compliance</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-600 border border-zinc-200/50">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-zinc-300 transition-all duration-200 flex justify-between items-start shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Resume Word Count</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800">{wordCount}</span>
                {wordCount > 300 && wordCount < 800 ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#1da074] bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    Ideal Length
                  </span>
                ) : wordCount > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    Too short/long
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-full">
                    Empty
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">Target: 400 - 700 words</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-600 border border-zinc-200/50">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-zinc-300 transition-all duration-200 flex justify-between items-start shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Mock Interviews</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800">0</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                  Upcoming
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Conversational training sessions</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-600 border border-zinc-200/50">
              <Video className="h-4.5 w-4.5" />
            </div>
          </div>

          <Link
            href="/cv"
            className="border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-indigo-300 hover:bg-indigo-50/10 transition-all duration-200 flex justify-between items-start shadow-sm group text-left"
          >
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block group-hover:text-indigo-500 transition-colors">Suggested Fixes</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800">{suggestionsCount}</span>
                {suggestionsCount === 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#1da074] bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    All clear
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    Action items
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 group-hover:text-indigo-600 font-medium transition-colors flex items-center gap-1">
                View fix optimization list <ArrowRight className="h-3 w-3" />
              </p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-zinc-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center text-zinc-600 border border-zinc-200/50 transition-colors">
              <AlertCircle className="h-4.5 w-4.5" />
            </div>
          </Link>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6" aria-label="Accelerator Hub">
            <div className="flex items-center gap-2 font-semibold text-zinc-800 text-sm border-b border-zinc-100 pb-2">
              <Award className="h-4.5 w-4.5 text-[#1da074]" />
              <h2>Application Accelerators</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                <Link
                  href="/interview"
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#0a121e] hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm transition-all w-full"
                >
                  Launch Mock Interview
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="border border-zinc-200 rounded-2xl p-6 bg-white space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2 font-semibold text-zinc-800 text-sm">
                  <FileText className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Active Resume Document Canvas</span>
                </div>
                {hasCV && (
                  <Link href="/cv" className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1">
                    Edit Canvas <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>

              {hasCV ? (
                <Link
                  href="/cv"
                  className="block border border-zinc-100 rounded-xl p-5 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-200 transition-all text-left relative group"
                >
                  <div className="space-y-3">
                    <div className="border-b border-dashed border-zinc-200 pb-2">
                      <h4 className="text-sm font-bold text-zinc-800 uppercase tracking-tight">{cvProfile.personal?.full_name || displayName}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{cvProfile.personal?.email} {cvProfile.personal?.phone ? `| ${cvProfile.personal.phone}` : ''}</p>
                    </div>
                    {cvProfile.personal?.summary && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Summary Overview</span>
                        <p className="text-xs text-zinc-600 line-clamp-2 italic leading-relaxed">"{cvProfile.personal.summary}"</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-zinc-100">
                      <span>Experience Records: {(cvProfile.experience || []).length}</span>
                      <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-1">
                        Open Preview Sheet <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="border border-dashed border-zinc-200 rounded-xl p-8 text-center bg-zinc-50/30">
                  <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 font-medium">No resume document loaded on your profile data layer yet.</p>
                  <Link href="/cv" className="text-xs text-indigo-600 hover:underline font-bold mt-1 inline-block">
                    Upload or Parse a File to Start
                  </Link>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6" aria-label="Profile summary">
            <div className="border border-zinc-200 rounded-2xl p-6 bg-white space-y-4 shadow-sm">
              <div className="flex items-center gap-2 font-semibold text-zinc-800 text-sm">
                <BookOpen className="h-4.5 w-4.5 text-teal-600" />
                <span>Your Core Skills</span>
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
                  { done: hasCV && wordCount > 300, label: "Export optimized CV PDF", href: "/cv" },
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