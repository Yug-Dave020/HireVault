import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/nav/top-nav";
import { SkeletonJobCards } from "@/components/dashboard/skeleton-jobs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MapPin, Briefcase, TrendingUp, Clock } from "lucide-react";

export const metadata = {
  title: "Dashboard — HireVault",
  description: "Your personalised AI job intelligence dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, target_roles, target_locations, skills, experience_years")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding");

  const displayName = profile.full_name ?? user.email?.split("@")[0] ?? "there";
  const primaryRole = profile.target_roles?.[0] ?? "your target role";
  const locations   = profile.target_locations ?? [];
  const skills      = profile.skills ?? [];

  return (
    <div className="min-h-screen" style={{ background: "#f4f6fb" }}>
      <TopNav />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        <section aria-label="Welcome">
          <div className="hv-welcome-card">
            {/* Grid dot pattern overlay */}
            <div className="hv-welcome-dots" aria-hidden="true" />

            <div className="hv-welcome-inner">
              {/* Left: greeting */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2 text-[#8aa3bc] text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>Welcome back</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white"
                    style={{ letterSpacing: "-0.02em" }}>
                  Hello, {displayName}! 👋
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-[#8aa3bc] text-sm">
                    <Briefcase className="h-4 w-4 flex-shrink-0" />
                    <span>{primaryRole}</span>
                  </div>
                  {locations.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[#8aa3bc] text-sm">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{locations.slice(0, 3).join(", ")}</span>
                      {locations.length > 3 && (
                        <span className="text-[#1d9e75]">+{locations.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: quick stats */}
              <div className="hv-stat-strip relative z-10">
                {[
                  { value: "0",            label: "Jobs matched" },
                  { value: "0",            label: "CVs generated" },
                  { value: String(skills.length), label: "Skills tracked" },
                ].map(({ value, label }, i) => (
                  <div key={label} className="flex items-stretch gap-4 sm:gap-6">
                    {i > 0 && <div className="w-px bg-white/10 self-stretch" />}
                    <div className="hv-stat-item">
                      <p className="text-2xl font-bold text-white">{value}</p>
                      <p className="text-xs text-[#8aa3bc] mt-0.5">{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Job feed */}
          <section className="lg:col-span-2 space-y-4" aria-label="Job feed">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[var(--hv-teal)]" />
                <h2 className="text-lg font-semibold text-slate-800">Job Feed</h2>
                <Badge className="text-xs bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                  Loading soon
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Updates daily</span>
              </div>
            </div>

            <div role="status" aria-label="Loading job listings" aria-live="polite">
              <SkeletonJobCards />
              <p className="text-center text-sm text-slate-400 mt-4 py-2">
                🤖 Our AI scraper is warming up. Job listings will appear here soon.
              </p>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4" aria-label="Profile summary">

            {/* Skills card */}
            <div className="hv-card">
              <p className="text-sm font-semibold text-slate-700 mb-3">Your top skills</p>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(0, 12).map((skill: string) => (
                    <span key={skill} className="hv-skill-chip">{skill}</span>
                  ))}
                  {skills.length > 12 && (
                    <span className="hv-skill-chip hv-skill-chip--muted">
                      +{skills.length - 12} more
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No skills added yet.{" "}
                  <a href="/onboarding" className="text-[var(--hv-teal)] hover:underline">
                    Update your profile →
                  </a>
                </p>
              )}
            </div>

            {/* Getting started checklist */}
            <div className="hv-card">
              <p className="text-sm font-semibold text-slate-700 mb-3">Getting started</p>
              <div className="space-y-3">
                {[
                  { done: true,  label: "Create your account",      href: null },
                  { done: true,  label: "Complete your profile",     href: null },
                  { done: false, label: "Wait for first job batch",  href: null },
                  { done: false, label: "Generate your first AI CV", href: "/cv" },
                ].map(({ done, label, href }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    {/* Teal filled circle for done, empty ring for pending */}
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      done
                        ? "bg-[var(--hv-teal)]"
                        : "border-2 border-slate-200 bg-white"
                    }`}>
                      {done && (
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z"
                            clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {href ? (
                      <a href={href} className={`text-sm ${done ? "line-through text-slate-400" : "text-[var(--hv-teal)] hover:underline font-medium"}`}>
                        {label}
                      </a>
                    ) : (
                      <span className={`text-sm ${done ? "line-through text-slate-400" : "text-slate-600"}`}>
                        {label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
