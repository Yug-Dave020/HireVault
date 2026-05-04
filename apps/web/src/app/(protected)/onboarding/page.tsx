"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  User,
  MapPin,
  Zap,
  BookOpen,
} from "lucide-react";
import { TagInput } from "@/components/onboarding/tag-input";
import { MultiSelect } from "@/components/onboarding/multi-select";

const TARGET_ROLES = [
  "Frontend Dev",
  "Backend Dev",
  "Full Stack Dev",
  "Data Engineer",
  "ML Engineer",
  "DevOps",
  "Product Manager",
  "UX Designer",
  "Other",
] as const;

const TARGET_LOCATIONS = [
  "Berlin",
  "Munich",
  "Hamburg",
  "Frankfurt",
  "Dortmund",
  "Stuttgart",
  "Cologne",
  "Remote",
  "Other",
] as const;

const EXPERIENCE_YEARS = ["0-1", "1-3", "3-5", "5+"] as const;

const LANGUAGES = ["English", "German", "French", "Spanish", "Other"] as const;

const STEPS = [
  { number: 1, label: "Identity", icon: User,    title: "Tell us about yourself",       subtitle: "We'll use this to personalise your job feed and CV." },
  { number: 2, label: "Skills",   icon: Zap,     title: "Your skills & experience",     subtitle: "Add skills you know — we'll match them against job requirements." },
  { number: 3, label: "Background", icon: BookOpen, title: "Your background",           subtitle: "Add your most recent role and education. You can add more later." },
] as const;

interface Step1 {
  fullName: string;
  targetRole: string;
  targetLocations: string[];
}

interface Step2 {
  skills: string[];
  experienceYears: string;
  languages: string[];
}

interface Step3 {
  expCompany: string;
  expRole: string;
  expDuration: string;
  expBullet1: string;
  expBullet2: string;
  expBullet3: string;
  eduInstitution: string;
  eduDegree: string;
  eduGradYear: string;
}

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep]           = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]          = useState<string | null>(null);

  const [s1, setS1] = useState<Step1>({ fullName: "", targetRole: "", targetLocations: [] });
  const [s2, setS2] = useState<Step2>({ skills: [], experienceYears: "", languages: [] });
  const [s3, setS3] = useState<Step3>({
    expCompany: "", expRole: "", expDuration: "",
    expBullet1: "", expBullet2: "", expBullet3: "",
    eduInstitution: "", eduDegree: "", eduGradYear: "",
  });

  function validateStep(n: number): string | null {
    if (n === 1) {
      if (!s1.fullName.trim())          return "Please enter your full name.";
      if (!s1.targetRole)               return "Please select a target role.";
      if (s1.targetLocations.length === 0) return "Please select at least one target location.";
    }
    if (n === 2) {
      if (s2.skills.length === 0)       return "Please add at least one skill.";
      if (!s2.experienceYears)          return "Please select your years of experience.";
      if (s2.languages.length === 0)    return "Please select at least one language.";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError(null);
    setStep((p) => Math.min(p + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setError(null);
    setStep((p) => Math.max(p - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Session expired. Please sign in again.");
      setSubmitting(false);
      return;
    }

    const { error: dbError } = await supabase.from("user_profiles").upsert({
      id: user.id,
      full_name: s1.fullName.trim(),
      target_roles: [s1.targetRole],
      target_locations: s1.targetLocations,
      skills: s2.skills,
      experience_years: parseExperienceYears(s2.experienceYears),
      languages: s2.languages,
      experience: {
        entries: [{
          company: s3.expCompany,
          role: s3.expRole,
          duration: s3.expDuration,
          bullets: [s3.expBullet1, s3.expBullet2, s3.expBullet3].filter(Boolean),
        }],
      },
      education: {
        institution: s3.eduInstitution,
        degree: s3.eduDegree,
        graduation_year: s3.eduGradYear ? parseInt(s3.eduGradYear) : null,
      },
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      setError(`Could not save your profile: ${dbError.message}`);
      setSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const progressPercent = Math.round((step / TOTAL_STEPS) * 100);
  const currentStep     = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-[#f0f4ff] px-4 py-10">
      <div className="mx-auto w-full max-w-xl">

        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="p-2 rounded-xl bg-[hsl(221,62%,22%)] shadow-lg">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[hsl(221,62%,22%)]">
            HireVault
          </span>
        </div>

        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, idx) => {
            const done    = step > s.number;
            const current = step === s.number;
            const StepIcon = s.icon;

            return (
              <div key={s.number} className="flex items-center">
                {/* Connector line before (skip for first) */}
                {idx > 0 && (
                  <div
                    className={`h-0.5 w-16 sm:w-24 transition-colors duration-300 ${
                      done || current ? "bg-[hsl(221,62%,22%)]" : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Step circle */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                      done
                        ? "bg-[hsl(221,62%,22%)] text-white"
                        : current
                        ? "bg-[hsl(221,62%,22%)] text-white ring-4 ring-[hsl(221,62%,22%)]/20"
                        : "bg-white text-slate-400 ring-1 ring-slate-200"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium transition-colors duration-200 ${
                      current
                        ? "text-[hsl(221,62%,22%)]"
                        : done
                        ? "text-[hsl(221,62%,30%)]"
                        : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-6">
          <Progress value={progressPercent} />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          {/* Card header band */}
          <div className="bg-gradient-to-r from-[hsl(221,62%,22%)] to-[hsl(221,55%,35%)] px-6 py-5">
            <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">
              Step {step} of {TOTAL_STEPS}
            </p>
            <h1 className="text-white text-xl font-bold">{currentStep.title}</h1>
            <p className="text-blue-100/80 text-sm mt-0.5">{currentStep.subtitle}</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 bg-red-50 border-b border-red-100 px-6 py-3 text-sm text-red-700"
            >
              <span className="mt-0.5 text-base">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="px-6 py-6 space-y-5">
              <FormField label="Full name" htmlFor="ob-full-name">
                <Input
                  id="ob-full-name"
                  placeholder="Alex Müller"
                  autoComplete="name"
                  value={s1.fullName}
                  onChange={(e) => setS1((p) => ({ ...p, fullName: e.target.value }))}
                  className="h-11 text-base"
                />
              </FormField>

              <FormField label="Target role" htmlFor="ob-target-role">
                <Select
                  value={s1.targetRole}
                  onValueChange={(val: string | null) =>
                    setS1((p) => ({ ...p, targetRole: val ?? "" }))
                  }
                >
                  <SelectTrigger id="ob-target-role">
                    <SelectContent placeholder="Select a role…">
                      {TARGET_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </SelectTrigger>
                </Select>
              </FormField>

              <FormField label="Target locations" hint="Select all that apply">
                <MultiSelect
                  id="ob-target-locations"
                  options={[...TARGET_LOCATIONS]}
                  selected={s1.targetLocations}
                  onChange={(val) => setS1((p) => ({ ...p, targetLocations: val }))}
                />
              </FormField>
            </div>
          )}

          {step === 2 && (
            <div className="px-6 py-6 space-y-5">
              <FormField label="Skills" htmlFor="ob-skills" hint='Press Enter or "," to add each skill'>
                <TagInput
                  id="ob-skills"
                  placeholder="TypeScript, Python, Docker…"
                  tags={s2.skills}
                  onChange={(val) => setS2((p) => ({ ...p, skills: val }))}
                />
              </FormField>

              <FormField label="Years of experience" htmlFor="ob-exp-years">
                <Select
                  value={s2.experienceYears}
                  onValueChange={(val: string | null) =>
                    setS2((p) => ({ ...p, experienceYears: val ?? "" }))
                  }
                >
                  <SelectTrigger id="ob-exp-years">
                    <SelectContent placeholder="Select range…">
                      {EXPERIENCE_YEARS.map((yr) => (
                        <SelectItem key={yr} value={yr}>{yr} years</SelectItem>
                      ))}
                    </SelectContent>
                  </SelectTrigger>
                </Select>
              </FormField>

              <FormField label="Languages spoken" hint="Select all that apply">
                <MultiSelect
                  id="ob-languages"
                  options={[...LANGUAGES]}
                  selected={s2.languages}
                  onChange={(val) => setS2((p) => ({ ...p, languages: val }))}
                />
              </FormField>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-6 space-y-6">

                {/* Experience */}
                <div className="space-y-4">
                  <SectionHeading icon={<MapPin className="h-4 w-4" />}>
                    Most Recent Experience
                  </SectionHeading>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Company" htmlFor="ob-exp-company">
                      <Input
                        id="ob-exp-company"
                        placeholder="Acme GmbH"
                        value={s3.expCompany}
                        onChange={(e) => setS3((p) => ({ ...p, expCompany: e.target.value }))}
                        className="h-10"
                      />
                    </FormField>
                    <FormField label="Role / Title" htmlFor="ob-exp-role">
                      <Input
                        id="ob-exp-role"
                        placeholder="Senior Engineer"
                        value={s3.expRole}
                        onChange={(e) => setS3((p) => ({ ...p, expRole: e.target.value }))}
                        className="h-10"
                      />
                    </FormField>
                  </div>

                  <FormField label="Duration" htmlFor="ob-exp-duration">
                    <Input
                      id="ob-exp-duration"
                      placeholder="Jan 2022 – Present"
                      value={s3.expDuration}
                      onChange={(e) => setS3((p) => ({ ...p, expDuration: e.target.value }))}
                      className="h-10"
                    />
                  </FormField>

                  <div className="space-y-3">
                    <Label className="text-sm text-slate-600">
                      Key achievements{" "}
                      <span className="text-slate-400 font-normal">(up to 3 bullet points)</span>
                    </Label>
                    {(
                      [
                        ["ob-b1", "expBullet1", "Led the migration of monolith to microservices…"],
                        ["ob-b2", "expBullet2", "Reduced build time by 40% using caching strategies…"],
                        ["ob-b3", "expBullet3", "Mentored 3 junior engineers…"],
                      ] as const
                    ).map(([id, field, placeholder]) => (
                      <Textarea
                        key={id}
                        id={id}
                        rows={2}
                        placeholder={placeholder}
                        value={s3[field]}
                        onChange={(e) => setS3((p) => ({ ...p, [field]: e.target.value }))}
                        className="resize-none text-sm"
                      />
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <SectionHeading icon={<BookOpen className="h-4 w-4" />}>
                    Education
                  </SectionHeading>

                  <FormField label="Institution" htmlFor="ob-edu-inst">
                    <Input
                      id="ob-edu-inst"
                      placeholder="Technical University of Berlin"
                      value={s3.eduInstitution}
                      onChange={(e) => setS3((p) => ({ ...p, eduInstitution: e.target.value }))}
                      className="h-10"
                    />
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="Degree" htmlFor="ob-edu-degree">
                      <Input
                        id="ob-edu-degree"
                        placeholder="BSc Computer Science"
                        value={s3.eduDegree}
                        onChange={(e) => setS3((p) => ({ ...p, eduDegree: e.target.value }))}
                        className="h-10"
                      />
                    </FormField>
                    <FormField label="Graduation year" htmlFor="ob-edu-year">
                      <Input
                        id="ob-edu-year"
                        type="number"
                        placeholder="2022"
                        min="1950"
                        max="2035"
                        value={s3.eduGradYear}
                        onChange={(e) => setS3((p) => ({ ...p, eduGradYear: e.target.value }))}
                        className="h-10"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Submit row */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBack}
                    disabled={submitting}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Back
                  </Button>
                  <Button
                    id="complete-profile-button"
                    type="submit"
                    disabled={submitting}
                    className="bg-[hsl(221,62%,22%)] hover:bg-[hsl(221,62%,18%)] text-white font-semibold px-6 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {submitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                    ) : (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Complete Profile</>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {step < 3 && (
            <div className="flex items-center justify-between px-6 pb-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="text-slate-500 hover:text-slate-700 disabled:opacity-0"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
              <Button
                id="next-step-button"
                type="button"
                onClick={handleNext}
                className="bg-[hsl(221,62%,22%)] hover:bg-[hsl(221,62%,18%)] text-white font-semibold px-6 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 hover:text-slate-600 hover:underline transition-colors"
          >
            Skip for now →
          </Link>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-2">
        <label
          htmlFor={htmlFor}
          className="text-sm font-semibold text-slate-700"
        >
          {label}
        </label>
        {hint && (
          <span className="text-xs text-slate-400 font-normal">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function SectionHeading({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
      <span className="text-[hsl(221,62%,30%)]">{icon}</span>
      {children}
    </div>
  );
}

function parseExperienceYears(range: string): number {
  const map: Record<string, number> = {
    "0-1": 0,
    "1-3": 2,
    "3-5": 4,
    "5+": 7,
  };
  return map[range] ?? 0;
}
