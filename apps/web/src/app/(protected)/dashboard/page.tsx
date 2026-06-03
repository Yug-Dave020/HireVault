import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";

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
    <DashboardClient
      profile={profile}
      activeVariants={activeVariants}
      displayName={displayName}
      primaryRole={primaryRole}
      locations={locations}
      skills={skills}
      hasCV={hasCV}
      marketAlignmentIndex={marketAlignmentIndex}
      totalVariants={totalVariants}
      activePublicLinks={activePublicLinks}
      suggestedGaps={suggestedGaps}
      cvTheme={cvTheme}
    />
  );
}