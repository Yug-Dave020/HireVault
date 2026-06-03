"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Loader2, User, Save, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [targetRoles, setTargetRoles] = useState("");
  const [targetLocations, setTargetLocations] = useState("");
  const [skills, setSkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [languages, setLanguages] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");


  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) {
        setError("Failed to load your profile details.");
      } else if (profile) {
        setFullName(profile.full_name ?? "");
        setTargetRoles((profile.target_roles ?? []).join(", "));
        setTargetLocations((profile.target_locations ?? []).join(", "));
        setSkills((profile.skills ?? []).join(", "));
        setExperienceYears(String(profile.experience_years ?? 0));
        setLanguages((profile.languages ?? []).join(", "));
        setSalaryExpectation(profile.salary_expectation ?? "");


      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);



  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session has expired. Please log in again.");
      setSaving(false);
      return;
    }

    const sanitizeArray = (input: string) => {
      const typoMap: Record<string, string> = {
        "pyhton": "Python",
        "python": "Python",
        "springboot": "Spring Boot",
        "spring boot": "Spring Boot",
        "reactjs": "React.js",
        "react": "React.js",
        "react.js": "React.js",
        "nodejs": "Node.js",
        "node.js": "Node.js",
        "nextjs": "Next.js",
        "next.js": "Next.js"
      };
      return input.split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => {
          const lower = s.toLowerCase();
          return typoMap[lower] || s;
        });
    };

    const { error: saveError } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        full_name: fullName.trim(),
        target_roles: sanitizeArray(targetRoles),
        target_locations: sanitizeArray(targetLocations),
        skills: sanitizeArray(skills),
        experience_years: parseInt(experienceYears) || 0,
        languages: sanitizeArray(languages),
        salary_expectation: salaryExpectation.trim(),
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      setError(`Failed to save details: ${saveError.message}`);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/20">
        <Loader2 className="h-7 w-7 animate-spin text-zinc-700 mb-2" />
        <p className="text-zinc-500 text-xs font-semibold">Loading profile preferences...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto">
      <main className="mx-auto max-w-2xl w-full px-6 sm:px-8 py-8 space-y-6">

        <div className="space-y-1 border-b border-zinc-100 pb-4 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Career Profile
            </h1>
            <p className="text-xs text-zinc-500">
              Customize your target settings for automated CV generation and interview recommendations.
            </p>
          </div>
          <Link href="/dashboard" className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>

        <form onSubmit={handleSave} className="space-y-5">

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
              ⚠ {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-600" />
              <span>Preferences saved successfully!</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="prof-name" className="text-xs font-bold text-zinc-700">Full Name</Label>
            <Input
              id="prof-name"
              placeholder="e.g. Alex Müller"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 px-4 border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-roles" className="text-xs font-bold text-zinc-700">Target Roles</Label>
              <Input
                id="prof-roles"
                placeholder="e.g. Frontend Engineer, Technical Product Manager"
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
                className="h-11 px-4 border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
              />
              <p className="text-[10px] text-zinc-400">Separate values with commas</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-locs" className="text-xs font-bold text-zinc-700">Target Locations</Label>
              <Input
                id="prof-locs"
                placeholder="e.g. Remote, Berlin, Munich"
                value={targetLocations}
                onChange={(e) => setTargetLocations(e.target.value)}
                className="h-11 px-4 border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
              />
              <p className="text-[10px] text-zinc-400">Separate values with commas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prof-years" className="text-xs font-bold text-zinc-700">Years of Experience</Label>
              <Select value={experienceYears} onValueChange={(val) => setExperienceYears(val ?? "0")}>
                <SelectTrigger id="prof-years" className="h-11 border-zinc-200 focus:border-indigo-500 rounded-xl text-zinc-700">
                  <span>{experienceYears} years</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0-1 years</SelectItem>
                  <SelectItem value="2">1-3 years</SelectItem>
                  <SelectItem value="4">3-5 years</SelectItem>
                  <SelectItem value="7">5+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-salary" className="text-xs font-bold text-zinc-700">Salary Expectation</Label>
              <Input
                id="prof-salary"
                placeholder="e.g. €75,000 - €90,000"
                value={salaryExpectation}
                onChange={(e) => setSalaryExpectation(e.target.value)}
                className="h-11 px-4 border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
              />
              <p className="text-[10px] text-zinc-400">Specify expected annual gross</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-skills" className="text-xs font-bold text-zinc-700">Core Technical Skills</Label>
            <Input
              id="prof-skills"
              placeholder="e.g. React, Python, TypeScript, Docker, SQL"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="h-11 px-4 border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
            />
            <p className="text-[10px] text-zinc-400">Separate values with commas</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prof-langs" className="text-xs font-bold text-zinc-700">Languages Spoken</Label>
            <Input
              id="prof-langs"
              placeholder="e.g. English, German"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="h-11 px-4 border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl"
            />
            <p className="text-[10px] text-zinc-400">Separate values with commas</p>
          </div>


          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 h-11 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>

        </form>

      </main>
    </div>
  );
}