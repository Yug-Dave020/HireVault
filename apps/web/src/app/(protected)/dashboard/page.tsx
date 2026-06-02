import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, MapPin, Briefcase, Award, ArrowRight, Video,
  FileText, TrendingUp, BarChart3, AlertCircle, BookOpen, CheckCircle
} from "lucide-react";
import Link from "next/link";
import { VariantCard } from "./VariantCard";
import { CreateVariantModal } from "./CreateVariantModal";

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

  const { data: variantsData } = await supabase
    .from("user_cv_variants")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  let activeVariants = variantsData || [];

  if (activeVariants.length === 0 && profile?.cv_profile) {
    const { data: migrated } = await supabase.from("user_cv_variants").insert({
      user_id: user.id,
      label: "Master Variant",
      target_role: profile.target_roles?.[0] || "Software Engineer",
      cv_profile: profile.cv_profile,
    }).select().single();
    if (migrated) activeVariants = [migrated];
  }

  const displayName = profile.full_name ?? user.email?.split("@")[0] ?? "there";
  const primaryRole = profile.target_roles?.[0] ?? "Software Engineer";
  const locations = profile.target_locations ?? [];
  const skills = profile.skills ?? [];
  const cvProfile = profile.cv_profile as any;
  const hasCV = !!cvProfile;

  // Market Alignment Index
  const validScores = activeVariants.map((v: any) => v.cached_ats_score).filter((s: any) => typeof s === 'number');
  const marketAlignmentIndex = validScores.length > 0
    ? Math.round(validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length)
    : 0;

  // Application Velocity Pipeline
  const activePublicLinks = activeVariants.filter((v: any) => v.is_public).length;
  const totalVariants = activeVariants.length;

  // Suggested Skill Gaps
  const allSkills = new Set<string>();
  if (profile?.skills) {
    if (Array.isArray(profile.skills)) {
      profile.skills.forEach((s: string) => allSkills.add(s.toLowerCase()));
    } else if (profile.skills.technical) {
      profile.skills.technical.forEach((s: string) => allSkills.add(s.toLowerCase()));
    }
  }
  activeVariants.forEach((v: any) => {
    if (v.cv_profile?.skills?.technical) {
      v.cv_profile.skills.technical.forEach((s: string) => allSkills.add(s.toLowerCase()));
    }
    if (Array.isArray(v.cv_profile?.skills)) {
      v.cv_profile.skills.forEach((s: string) => allSkills.add(s.toLowerCase()));
    }
  });

  const premiumKeywords: Record<string, string[]> = {
    "Software Engineer": ["kubernetes", "aws", "docker", "graphql", "ci/cd", "microservices"],
    "Frontend": ["react", "next.js", "typescript", "tailwind", "webpack"],
    "Backend": ["node.js", "python", "postgresql", "redis", "docker", "aws"],
    "Default": ["leadership", "agile", "project management", "data analysis", "cloud architecture"]
  };

  const getTargetRoleKey = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes("frontend") || r.includes("ui") || r.includes("web")) return "Frontend";
    if (r.includes("backend") || r.includes("api") || r.includes("server")) return "Backend";
    if (r.includes("software") || r.includes("developer") || r.includes("engineer")) return "Software Engineer";
    return "Default";
  };

  const roleKey = getTargetRoleKey(primaryRole);
  const suggestedGaps = premiumKeywords[roleKey]
    .filter(kw => !allSkills.has(kw))
    .slice(0, 3)
    .map(kw => kw.charAt(0).toUpperCase() + kw.slice(1));

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
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Market Alignment</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800">{marketAlignmentIndex}%</span>
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
              <p className="text-[11px] text-zinc-500">Average match across variants</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center text-[#1da074] border border-emerald-100">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-zinc-300 transition-all duration-200 flex justify-between items-start shadow-sm">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Application Pipeline</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-800">{totalVariants}</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                  {activePublicLinks} Active Links
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">Total variants optimized</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>

          <div className="border border-zinc-200/60 rounded-2xl p-5 bg-white hover:border-zinc-300 transition-all duration-200 flex justify-between items-start shadow-sm">
            <div className="space-y-1 w-full">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Suggested Skill Gaps</span>
              {suggestedGaps.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {suggestedGaps.map(gap => (
                    <span key={gap} className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 rounded-md">
                      + {gap}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-sm font-black text-zinc-800">
                  Profile optimized
                </div>
              )}
              <p className="text-[11px] text-zinc-500 mt-2">Relative to targeted roles</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <AlertCircle className="h-4.5 w-4.5" />
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
              <p className="text-[11px] text-zinc-500">Conversational sessions</p>
            </div>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
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

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-zinc-800 text-sm">
                  <FileText className="h-4.5 w-4.5 text-indigo-500" />
                  <span>Your CV Variants Vault</span>
                </div>
                <CreateVariantModal masterProfile={profile?.cv_profile} defaultRole={primaryRole} />
              </div>

              {activeVariants.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeVariants.map((variant) => (
                    <VariantCard key={variant.id} variant={variant} />
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-50/30">
                  <AlertCircle className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500 font-medium mb-4">No CV variants created yet.</p>
                  <CreateVariantModal masterProfile={profile?.cv_profile} defaultRole={primaryRole} />
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