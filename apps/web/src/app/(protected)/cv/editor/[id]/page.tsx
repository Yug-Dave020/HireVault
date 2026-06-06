"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Save, Download, Sparkles, Plus, Trash2, ArrowLeft,
  User, Briefcase, GraduationCap, Code, Languages, Type, Globe,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CVEditorPage() {
  const router = useRouter();
  const params = useParams();
  const variantId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [error, setError] = useState<string | null>(null);

  const [activeEnhance, setActiveEnhance] = useState<{
    type: "summary" | "bullet" | "project";
    expIdx?: number;
    bulletIdx?: number;
    projectIdx?: number;
    currentText: string;
  } | null>(null);
  const [enhanceLoading, setEnhanceLoading] = useState(false);
  const [enhanceResult, setEnhanceResult] = useState<{
    score: number;
    critiques: string[];
    optimized_suggestions: string[];
  } | null>(null);
  const [enhanceRole, setEnhanceRole] = useState("Software Engineer");

  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const [isTailoringOpen, setIsTailoringOpen] = useState(false);
  const [tailorJobDescription, setTailorJobDescription] = useState("");
  const [tailorTargetRole, setTailorTargetRole] = useState("");
  const [tailorLoading, setTailorLoading] = useState(false);
  const [tailorSuccessToast, setTailorSuccessToast] = useState(false);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [username, setUsername] = useState("");

  const startEnhancing = (text: string, type: "summary" | "bullet" | "project", expIdx?: number, bulletIdx?: number, projectIdx?: number) => {
    const defaultRole = profile.target_roles?.[0] || "Software Engineer";
    setEnhanceRole(defaultRole);
    setActiveEnhance({ type, expIdx, bulletIdx, projectIdx, currentText: text });
    setEnhanceResult(null);
  };

  const runEnhancement = async () => {
    if (!activeEnhance) return;
    setEnhanceLoading(true);
    setEnhanceResult(null);
    try {
      const response = await fetch("/api/cv/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section_type: activeEnhance.type,
          current_text: activeEnhance.currentText,
          target_role: enhanceRole,
          full_cv_context: profile
        }),
      });

      if (!response.ok) {
        throw new Error("Could not retrieve AI suggestions.");
      }

      const data = await response.json();
      setEnhanceResult(data);
    } catch (err: any) {
      alert(err.message || "Failed to generate suggestions. Please ensure the worker backend is active.");
    } finally {
      setEnhanceLoading(false);
    }
  };

  const applyEnhanceRewrite = (rewrite: string) => {
    if (!activeEnhance) return;

    if (activeEnhance.type === "summary") {
      updatePersonal("summary", rewrite);
    } else if (activeEnhance.type === "bullet" && activeEnhance.expIdx !== undefined && activeEnhance.bulletIdx !== undefined) {
      updateBullet(activeEnhance.expIdx, activeEnhance.bulletIdx, rewrite);
    } else if (activeEnhance.type === "project" && activeEnhance.projectIdx !== undefined) {
      updateProject(activeEnhance.projectIdx, "description", rewrite);
    }

    setActiveEnhance(null);
    setEnhanceResult(null);
  };

  const loadSkillsSuggestions = async () => {
    setSkillsLoading(true);
    try {
      const response = await fetch("/api/cv/suggest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section_type: "skills",
          current_text: (profile.skills.technical || []).join(", "),
          target_role: profile.target_roles?.[0] || "Software Engineer",
          full_cv_context: profile
        }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setSuggestedSkills(data.recommended_skills || []);
    } catch {
      alert("Failed to load skills recommendations.");
    } finally {
      setSkillsLoading(false);
    }
  };

  const addSuggestedSkill = (skill: string) => {
    const existing = profile.skills.technical || [];
    if (!existing.includes(skill)) {
      const updated = {
        ...profile,
        skills: {
          ...profile.skills,
          technical: [...existing, skill]
        }
      };
      setProfile(updated);
      persistChanges();
    }
    setSuggestedSkills(prev => prev.filter(s => s !== skill));
  };

  const handleGlobalTailor = async () => {
    if (!tailorJobDescription.trim()) return;
    setTailorLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cv/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_cv_context: profile,
          job_description: tailorJobDescription,
          target_role: tailorTargetRole || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Tailoring failed. Please check backend connection.");
      }

      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
        persistChanges();
        setIsTailoringOpen(false);
        setTailorSuccessToast(true);
        setTimeout(() => setTailorSuccessToast(false), 8000);
      }
    } catch (err: any) {
      alert(err.message || "Failed to tailor CV.");
    } finally {
      setTailorLoading(false);
    }
  };

  const [profile, setProfile] = useState<any>({
    personal: { full_name: "", email: "", phone: "", location: "", linkedin_url: "", website_url: "", summary: "" },
    experience: [],
    education: [],
    projects: [],
    skills: { technical: [], soft: [], languages: [] },
    target_roles: [],
    design_prefs: { theme: "modern_minimalist", accent_color: "#1d9e75", font_heading: "Inter", font_body: "Inter" }
  });

  useEffect(() => {
    async function loadInitialCV() {
      const staged = sessionStorage.getItem(`draft_cv_profile_${variantId}`);
      let hasStagedProfile = false;
      if (staged) {
        try {
          setProfile(JSON.parse(staged));
          hasStagedProfile = true;
        } catch { }
      }


      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: userProf } = await supabase
        .from("user_cv_variants")
        .select("cv_profile, is_public, username")
        .eq("id", variantId)
        .maybeSingle();

      if (userProf) {
        if (userProf.cv_profile && !hasStagedProfile) {
          setProfile(userProf.cv_profile);
        }
        setIsPublic(userProf.is_public ?? false);
        setUsername(userProf.username ?? "");
      }
      setLoading(false);
    }
    if (variantId) {
      loadInitialCV();
    }
  }, [router, supabase, variantId]);

  async function persistChanges() {
    // Session storage auto-save removed per user request
  }

  const updatePersonal = (field: string, val: string) => {
    const updated = {
      ...profile,
      personal: {
        ...profile.personal,
        [field]: val
      }
    };
    setProfile(updated);
    persistChanges();
  };

  const updateDesign = (field: string, val: string) => {
    const updated = {
      ...profile,
      design_prefs: {
        ...profile.design_prefs,
        [field]: val
      }
    };
    setProfile(updated);
    persistChanges();
  };

  const addExperience = () => {
    const updated = {
      ...profile,
      experience: [
        ...profile.experience,
        { company: "", title: "", location: "", start_date: "", end_date: "", is_current: false, bullets: [""] }
      ]
    };
    setProfile(updated);
    persistChanges();
  };

  const removeExperience = (idx: number) => {
    const filtered = profile.experience.filter((_: any, i: number) => i !== idx);
    const updated = { ...profile, experience: filtered };
    setProfile(updated);
    persistChanges();
  };

  const updateExperience = (idx: number, field: string, val: any) => {
    const list = [...profile.experience];
    list[idx] = { ...list[idx], [field]: val };
    const updated = { ...profile, experience: list };
    setProfile(updated);
    persistChanges();
  };

  const addBullet = (expIdx: number) => {
    const list = [...profile.experience];
    list[expIdx].bullets = [...list[expIdx].bullets, ""];
    const updated = { ...profile, experience: list };
    setProfile(updated);
    persistChanges();
  };

  const removeBullet = (expIdx: number, bulIdx: number) => {
    const list = [...profile.experience];
    list[expIdx].bullets = list[expIdx].bullets.filter((_: any, i: number) => i !== bulIdx);
    const updated = { ...profile, experience: list };
    setProfile(updated);
    persistChanges();
  };

  const updateBullet = (expIdx: number, bulIdx: number, val: string) => {
    const list = [...profile.experience];
    list[expIdx].bullets[bulIdx] = val;
    const updated = { ...profile, experience: list };
    setProfile(updated);
    persistChanges();
  };

  const addEducation = () => {
    const updated = {
      ...profile,
      education: [
        ...profile.education,
        { institution: "", degree: "", field: "", start_year: "", end_year: "", gpa: "" }
      ]
    };
    setProfile(updated);
    persistChanges();
  };

  const removeEducation = (idx: number) => {
    const filtered = profile.education.filter((_: any, i: number) => i !== idx);
    const updated = { ...profile, education: filtered };
    setProfile(updated);
    persistChanges();
  };

  const updateEducation = (idx: number, field: string, val: any) => {
    const list = [...profile.education];
    list[idx] = { ...list[idx], [field]: val };
    const updated = { ...profile, education: list };
    setProfile(updated);
    persistChanges();
  };

  const addProject = () => {
    const updated = {
      ...profile,
      projects: [
        ...profile.projects,
        { name: "", url: "", description: "", tech_stack: [] }
      ]
    };
    setProfile(updated);
    persistChanges();
  };

  const removeProject = (idx: number) => {
    const filtered = profile.projects.filter((_: any, i: number) => i !== idx);
    const updated = { ...profile, projects: filtered };
    setProfile(updated);
    persistChanges();
  };

  const updateProject = (idx: number, field: string, val: any) => {
    const list = [...profile.projects];
    if (field === "tech_stack") {
      list[idx] = { ...list[idx], [field]: typeof val === "string" ? val.split(",").map(s => s.trim()) : val };
    } else {
      list[idx] = { ...list[idx], [field]: val };
    }
    const updated = { ...profile, projects: list };
    setProfile(updated);
    persistChanges();
  };

  const updateSkillsList = (type: "technical" | "soft", val: string) => {
    const updated = {
      ...profile,
      skills: {
        ...profile.skills,
        [type]: val.split(",").map(s => s.trim()).filter(Boolean)
      }
    };
    setProfile(updated);
    persistChanges();
  };

  const addLanguage = () => {
    const updated = {
      ...profile,
      skills: {
        ...profile.skills,
        languages: [
          ...(profile.skills.languages || []),
          { name: "", level: "Fluent" }
        ]
      }
    };
    setProfile(updated);
    persistChanges();
  };

  const removeLanguage = (idx: number) => {
    const filtered = profile.skills.languages.filter((_: any, i: number) => i !== idx);
    const updated = {
      ...profile,
      skills: {
        ...profile.skills,
        languages: filtered
      }
    };
    setProfile(updated);
    persistChanges();
  };

  const updateLanguage = (idx: number, field: string, val: string) => {
    const list = [...profile.skills.languages];
    list[idx] = { ...list[idx], [field]: val };
    const updated = {
      ...profile,
      skills: {
        ...profile.skills,
        languages: list
      }
    };
    setProfile(updated);
    persistChanges();
  };

  async function handleManualSave() {
    setSaving(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No active session");

      let newScore = null;
      let newCritiques = null;

      try {
        const backendRes = await fetch(`/api/cv/suggest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section_type: "global_gap_analysis",
            current_text: profile.personal?.summary || "Analyze baseline career history.",
            target_role: profile.target_roles?.[0] || "Software Engineer",
            full_cv_context: profile
          }),
        });

        if (backendRes.ok) {
          const diagnostics = await backendRes.json();
          newScore = diagnostics.score || null;
          newCritiques = diagnostics.critiques || null;
        }
      } catch {
        console.warn("Could not fetch server critiques on save.");
      }

      const { error: dbError } = await supabase
        .from("user_cv_variants")
        .update({
          cv_profile: profile,
          is_public: isPublic,
          username: username.trim() || null,
          cached_ats_score: newScore,
          cached_critiques: newCritiques,
          updated_at: new Date().toISOString()
        })
        .eq("id", variantId);

      if (dbError) throw dbError;
      router.refresh();
      alert("Canvas successfully saved to cloud database!");
    } catch (err: any) {
      setError(err.message || "Failed saving CV profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const response = await fetch("/api/cv/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: profile,
          design_prefs: profile.design_prefs,
        }),
      });

      if (!response.ok) {
        throw new Error("Worker failed to render PDF document.");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `${(profile.personal.full_name || "cv").toLowerCase().replace(/\s+/g, "-")}-optimized.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err: any) {
      setError(err.message || "Export failed. Please check your data fields.");
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--hv-teal)] mb-2" />
        <p className="text-slate-500 text-sm">Opening canvas editor...</p>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col h-full bg-white overflow-hidden">
      <header className="border-b border-zinc-200/60 px-6 py-4 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-4">
          <a href="/cv" className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </a>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-tight text-zinc-800">
              CV Workspace Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => setIsShareOpen(true)}
            className="border-zinc-200 text-sky-600 font-bold h-9 text-xs rounded-xl hover:bg-sky-50/50"
          >
            <Globe className="h-3.5 w-3.5 mr-1" />
            Share Profile
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsTailoringOpen(true)}
            className="border-zinc-200 text-indigo-600 font-bold h-9 text-xs rounded-xl hover:bg-indigo-50"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            Match Job Description
          </Button>


          <Button
            variant="outline"
            onClick={handleManualSave}
            disabled={saving}
            className="border-zinc-200 text-zinc-700 font-bold h-9 text-xs rounded-xl hover:bg-zinc-50"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save Draft
          </Button>

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs shadow-sm flex items-center gap-1.5 rounded-xl transition-colors"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export ATS PDF
          </Button>
        </div>
      </header>

      {tailorSuccessToast && (
        <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn relative z-40">
          <span>Success! Your resume has been customized to fit this job posting. Review the changes below and hit Save when ready.</span>
          <button onClick={() => setTailorSuccessToast(false)} className="text-emerald-500 hover:text-emerald-700 ml-4 font-black">✕</button>
        </div>
      )}
      {isShareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">


            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-600" />
                Public Portfolio
              </h2>
              <button
                onClick={() => setIsShareOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>


            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 border border-zinc-100 rounded-xl bg-zinc-50/50">
                <div>
                  <div className="text-sm font-bold text-zinc-700">Public Visibility</div>
                  <div className="text-xs text-zinc-500 mt-0.5">Allow recruiters to view your CV via a link.</div>
                </div>


                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isPublic}
                    onChange={e => setIsPublic(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>


              {isPublic ? (
                <div className="space-y-2.5 pt-2 border-t border-dashed border-zinc-200 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-zinc-600">Portfolio URL Slug</label>
                    <div className="flex items-center">
                      <span className="flex items-center px-3 border border-r-0 border-zinc-200 bg-zinc-100/80 text-zinc-500 text-xs rounded-l-xl h-10 select-none font-medium">
                        hirevault.com/p/
                      </span>
                      <Input
                        value={username}
                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="username-slug"
                        className="rounded-l-none border-l-0 border-zinc-200 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 h-10 text-xs font-medium"
                      />
                    </div>
                  </div>


                  <div className="flex items-center gap-2 pt-1.5">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/p/${username || 'your-slug'}` : `hirevault.com/p/${username || 'your-slug'}`}
                      className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono text-zinc-500 select-all focus:outline-none h-9 truncate"
                      id="modal-share-url"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const inputEl = document.getElementById('modal-share-url') as HTMLInputElement;
                        if (inputEl) {
                          try {
                            await navigator.clipboard.writeText(inputEl.value);
                            const copyBtn = document.getElementById('modal-copy-btn');
                            if (copyBtn) copyBtn.innerText = 'Copied';
                            setTimeout(() => { if (copyBtn) copyBtn.innerText = 'Copy Link'; }, 2000);
                          } catch (err) {
                            console.error(err);
                          }
                        }
                      }}
                      className="h-9 px-3 border-zinc-200 text-zinc-700 hover:bg-zinc-50 rounded-xl text-xs font-bold gap-1.5 shrink-0 min-w-[90px] justify-center"
                    >
                      <span id="modal-copy-btn">Copy Link</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 pt-1 bg-white p-2.5 border border-zinc-100 rounded-xl">
                  <EyeOff className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Your online view page is currently closed. Enable visibility to copy your shared path.</span>
                </div>
              )}
            </div>


            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsShareOpen(false)}
                className="text-xs h-9 font-semibold rounded-xl border-zinc-200 text-zinc-700"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsShareOpen(false);
                  handleManualSave();
                }}
                className="text-xs h-9 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded-xl shadow-sm transition-colors"
              >
                Save & Apply
              </Button>
            </div>

          </div>
        </div>
      )}
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-zinc-50/40 overflow-hidden min-h-0">
        <aside className="lg:col-span-7 bg-white rounded-2xl border border-zinc-200/60 shadow-xs flex flex-col overflow-y-auto px-6 py-6 space-y-6 cv-editor-form">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              ⚠ {error}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-100">
            {[
              { id: "personal", label: "Personal", icon: User },
              { id: "experience", label: "Experience", icon: Briefcase },
              { id: "education", label: "Education", icon: GraduationCap },
              { id: "projects", label: "Projects", icon: Code },
              { id: "skills", label: "Skills", icon: Languages }
            ].map(sec => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeSection === sec.id
                  ? "bg-[var(--hv-teal)]/10 text-[var(--hv-teal)]"
                  : "text-slate-500 hover:bg-slate-100"
                  }`}
              >
                <sec.icon className="h-3.5 w-3.5" />
                {sec.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {activeSection === "personal" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Full Name</Label>
                    <Input
                      value={profile.personal.full_name || ""}
                      onChange={e => updatePersonal("full_name", e.target.value)}
                      placeholder="Alex Müller"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Email Address</Label>
                    <Input
                      value={profile.personal.email || ""}
                      onChange={e => updatePersonal("email", e.target.value)}
                      placeholder="you@domain.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Phone Number</Label>
                    <Input
                      value={profile.personal.phone || ""}
                      onChange={e => updatePersonal("phone", e.target.value)}
                      placeholder="+49 176 1234 567"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Location</Label>
                    <Input
                      value={profile.personal.location || ""}
                      onChange={e => updatePersonal("location", e.target.value)}
                      placeholder="Berlin, Germany"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">LinkedIn URL</Label>
                    <Input
                      value={profile.personal.linkedin_url || ""}
                      onChange={e => updatePersonal("linkedin_url", e.target.value)}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Website URL</Label>
                    <Input
                      value={profile.personal.website_url || ""}
                      onChange={e => updatePersonal("website_url", e.target.value)}
                      placeholder="yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Professional Summary</Label>
                    <button
                      type="button"
                      onClick={() => startEnhancing(profile.personal.summary || "", "summary")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      AI Suggest
                    </button>
                  </div>
                  <Textarea
                    value={profile.personal.summary || ""}
                    onChange={e => updatePersonal("summary", e.target.value)}
                    placeholder="Brief professional headline highlighting your key value..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {activeSection === "experience" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Work Experience Items</h3>
                  <Button onClick={addExperience} size="sm" className="bg-[var(--hv-teal)] hover:bg-[#0f6e56] text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Work
                  </Button>
                </div>

                {profile.experience.map((exp: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4 relative">
                    <button
                      onClick={() => removeExperience(idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Company Name</Label>
                        <Input
                          value={exp.company}
                          onChange={e => updateExperience(idx, "company", e.target.value)}
                          placeholder="e.g. Acme Corporation"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Job Title</Label>
                        <Input
                          value={exp.title}
                          onChange={e => updateExperience(idx, "title", e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Location</Label>
                        <Input
                          value={exp.location || ""}
                          onChange={e => updateExperience(idx, "location", e.target.value)}
                          placeholder="e.g. Remote / Berlin"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Start Date</Label>
                        <Input
                          value={exp.start_date}
                          onChange={e => updateExperience(idx, "start_date", e.target.value)}
                          placeholder="YYYY-MM"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">End Date</Label>
                        <Input
                          value={exp.end_date || ""}
                          onChange={e => updateExperience(idx, "end_date", e.target.value)}
                          placeholder="YYYY-MM"
                          disabled={exp.is_current}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`exp-curr-${idx}`}
                        checked={exp.is_current}
                        onChange={e => updateExperience(idx, "is_current", e.target.checked)}
                        className="rounded border-slate-300 text-[var(--hv-teal)] focus:ring-[var(--hv-teal)]"
                      />
                      <label htmlFor={`exp-curr-${idx}`} className="text-xs text-slate-500 font-medium cursor-pointer">
                        Currently work here
                      </label>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-600">Key Achievements / Bullets</Label>
                        <button
                          type="button"
                          onClick={() => addBullet(idx)}
                          className="text-xs font-bold text-[var(--hv-teal)] hover:underline flex items-center gap-0.5"
                        >
                          <Plus className="h-3 w-3" />
                          Add Bullet
                        </button>
                      </div>

                      {(exp.bullets || []).map((bul: string, bIdx: number) => (
                        <div key={bIdx} className="flex gap-2 items-start relative group/bullet w-full">
                          <div className="flex-1 relative">
                            <Textarea
                              value={bul}
                              onChange={e => updateBullet(idx, bIdx, e.target.value)}
                              placeholder="e.g. Developed and deployed microservices backend using python, increasing throughout by 40%..."
                              rows={2}
                              className="text-xs w-full pr-24"
                            />
                            <button
                              type="button"
                              onClick={() => startEnhancing(bul || "", "bullet", idx, bIdx)}
                              className="absolute top-2 right-2 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded flex items-center gap-1"
                            >
                              <Sparkles className="h-3 w-3" />
                              AI
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBullet(idx, bIdx)}
                            className="text-slate-300 hover:text-red-500 self-center transition-colors pt-2"
                            title="Remove bullet"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "education" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Education Details</h3>
                  <Button onClick={addEducation} size="sm" className="bg-[var(--hv-teal)] hover:bg-[#0f6e56] text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Education
                  </Button>
                </div>

                {profile.education.map((edu: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4 relative">
                    <button
                      onClick={() => removeEducation(idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-1.5 pt-4">
                      <Label className="text-xs font-bold text-slate-600">Institution / University</Label>
                      <Input
                        value={edu.institution}
                        onChange={e => updateEducation(idx, "institution", e.target.value)}
                        placeholder="e.g. Technical University Munich"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={e => updateEducation(idx, "degree", e.target.value)}
                          placeholder="e.g. Master of Science (M.Sc.)"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Field of Study</Label>
                        <Input
                          value={edu.field || ""}
                          onChange={e => updateEducation(idx, "field", e.target.value)}
                          placeholder="e.g. Computational Engineering"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Start Year</Label>
                        <Input
                          value={edu.start_year}
                          onChange={e => updateEducation(idx, "start_year", e.target.value)}
                          placeholder="YYYY"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">End Year</Label>
                        <Input
                          value={edu.end_year || ""}
                          onChange={e => updateEducation(idx, "end_year", e.target.value)}
                          placeholder="YYYY"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">GPA (Optional)</Label>
                        <Input
                          value={edu.gpa || ""}
                          onChange={e => updateEducation(idx, "gpa", e.target.value)}
                          placeholder="e.g. 1.2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "projects" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-700">Project Showcases</h3>
                  <Button onClick={addProject} size="sm" className="bg-[var(--hv-teal)] hover:bg-[#0f6e56] text-white text-xs font-bold flex items-center gap-1">
                    <Plus className="h-3.5 w-3.5" />
                    Add Project
                  </Button>
                </div>

                {profile.projects.map((proj: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4 relative">
                    <button
                      onClick={() => removeProject(idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Project Name</Label>
                        <Input
                          value={proj.name}
                          onChange={e => updateProject(idx, "name", e.target.value)}
                          placeholder="e.g. HireVault Portal"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-600">Project URL (Optional)</Label>
                        <Input
                          value={proj.url || ""}
                          onChange={e => updateProject(idx, "url", e.target.value)}
                          placeholder="github.com/username/project"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-600">Technologies (comma separated)</Label>
                      <Input
                        value={(proj.tech_stack || []).join(", ")}
                        onChange={e => updateProject(idx, "tech_stack", e.target.value)}
                        placeholder="React, PyTorch, Supabase"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-600">Project Description</Label>
                        <button
                          type="button"
                          onClick={() => startEnhancing(proj.description || "", "project", undefined, undefined, idx)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3" />
                          AI Suggest
                        </button>
                      </div>
                      <Textarea
                        value={proj.description || ""}
                        onChange={e => updateProject(idx, "description", e.target.value)}
                        placeholder="Provide details on what you built, what challenge it solved, and the final results..."
                        rows={3}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "skills" && (
              <div className="space-y-6">
                <div className="bg-zinc-50 border border-zinc-200/60 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        AI Skill Suggestions
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Generate missing skills based on your target role.</p>
                    </div>
                    <Button
                      type="button"
                      onClick={loadSkillsSuggestions}
                      disabled={skillsLoading}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    >
                      {skillsLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      Generate
                    </Button>
                  </div>

                  {suggestedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {suggestedSkills.map((skill, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => addSuggestedSkill(skill)}
                          className="flex items-center gap-1 bg-white border border-indigo-100 hover:border-indigo-300 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm transition-all"
                        >
                          <Plus className="h-3 w-3" />
                          {skill}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Technical Skills (comma separated)</Label>
                  <Input
                    value={(profile.skills.technical || []).join(", ")}
                    onChange={e => updateSkillsList("technical", e.target.value)}
                    placeholder="Python, Django, AWS, Kubernetes, Terraform"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Soft Skills (comma separated)</Label>
                  <Input
                    value={(profile.skills.soft || []).join(", ")}
                    onChange={e => updateSkillsList("soft", e.target.value)}
                    placeholder="Leadership, Agile Development, Public Speaking"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Languages Spoken</Label>
                    <button
                      type="button"
                      onClick={addLanguage}
                      className="text-xs font-bold text-[var(--hv-teal)] hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      Add Language
                    </button>
                  </div>

                  {(profile.skills.languages || []).map((lang: any, idx: number) => (
                    <div key={idx} className="flex gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100 relative">
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <Input
                          value={lang.name}
                          onChange={e => updateLanguage(idx, "name", e.target.value)}
                          placeholder="e.g. German"
                          className="h-9 text-xs"
                        />
                        <Input
                          value={lang.level}
                          onChange={e => updateLanguage(idx, "level", e.target.value)}
                          placeholder="e.g. Native / Fluent"
                          className="h-9 text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLanguage(idx)}
                        className="text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-5 bg-white rounded-2xl border border-zinc-200/60 shadow-xs overflow-y-auto p-6 space-y-6 flex flex-col">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-md space-y-5">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
              <Type className="h-4 w-4 text-[var(--hv-teal)]" />
              Structural Theme Preferences
            </h3>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Template 1: Classic Minimalist (Green) */}
              <button 
                onClick={() => updateDesign("theme", "modern_minimalist")}
                className={`flex-shrink-0 w-[180px] h-[260px] bg-white rounded-sm p-3 shadow-md snap-center transform hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden border-2 text-left ${profile?.design_prefs?.theme === "modern_minimalist" ? "border-[#1da074] ring-2 ring-[#1da074]/20" : "border-slate-200"}`}
              >
                {/* Resume Content */}
                <div className="flex flex-col h-full text-[4px] leading-[1.4] text-zinc-800">
                  <h1 className="text-[9px] font-bold text-[#1da074] mb-1">Yug Dave</h1>
                  <p className="text-zinc-500 mb-1.5">New York, NY • yugdave@email.com</p>
                  
                  <p className="mb-2 text-zinc-600">
                    7+ years of software engineering experience, driving product growth and engagement...
                  </p>
                  
                  <h2 className="font-bold text-[5px] uppercase mb-1">Work Experience</h2>
                  
                  <div className="mb-2">
                    <h3 className="font-bold">Senior Software Engineer • New York</h3>
                    <p className="font-bold mb-0.5">TechCorp Inc.</p>
                    <ul className="list-disc pl-2 space-y-0.5 text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months...</li>
                      <li>Improved company&apos;s online presence by 25%...</li>
                    </ul>
                  </div>
                </div>
                {profile?.design_prefs?.theme === "modern_minimalist" && (
                  <div className="absolute top-2 right-2 bg-[#1da074] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Selected</div>
                )}
                <div className="absolute bottom-2 left-0 w-full text-center text-xs font-bold text-slate-800 bg-white/80 backdrop-blur-sm py-1 border-t border-slate-100">Modern Minimalist</div>
              </button>

              {/* Template 2: Executive (Red/Border) */}
              <button 
                onClick={() => updateDesign("theme", "classic_executive")}
                className={`flex-shrink-0 w-[180px] h-[260px] bg-white rounded-sm p-3 shadow-md snap-center transform hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden border-2 text-left ${profile?.design_prefs?.theme === "classic_executive" ? "border-red-600 ring-2 ring-red-600/20" : "border-slate-200"}`}
              >
                {/* Resume Content */}
                <div className="flex flex-col h-full text-[4px] leading-[1.4] text-zinc-800">
                  <div className="border-t-2 border-red-600 w-full mb-1.5"></div>
                  <h1 className="text-[9px] font-bold text-red-600 mb-1">Yug Dave</h1>
                  <p className="text-zinc-500 mb-1.5">New York, NY • yugdave@email.com</p>
                  
                  <p className="mb-2 text-zinc-600">
                    7+ years of software engineering experience, driving product growth and engagement...
                  </p>
                  
                  <h2 className="font-bold text-[5px] text-red-600 uppercase mb-1">Work Experience</h2>
                  
                  <div className="mb-2">
                    <h3 className="font-bold">Senior Software Engineer • New York</h3>
                    <p className="font-bold mb-0.5">TechCorp Inc.</p>
                    <ul className="list-disc pl-2 space-y-0.5 text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months...</li>
                      <li>Improved company&apos;s online presence by 25%...</li>
                    </ul>
                  </div>
                </div>
                {profile?.design_prefs?.theme === "classic_executive" && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Selected</div>
                )}
                <div className="absolute bottom-2 left-0 w-full text-center text-xs font-bold text-slate-800 bg-white/80 backdrop-blur-sm py-1 border-t border-slate-100">Classic Executive</div>
              </button>

              {/* Template 3: Professional (Centered/Black) */}
              <button 
                onClick={() => updateDesign("theme", "tech_professional")}
                className={`flex-shrink-0 w-[180px] h-[260px] bg-white rounded-sm p-3 shadow-md snap-center transform hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden border-2 text-left ${profile?.design_prefs?.theme === "tech_professional" ? "border-black ring-2 ring-black/20" : "border-slate-200"}`}
              >
                {/* Resume Content */}
                <div className="flex flex-col h-full text-[4px] leading-[1.4] text-zinc-800">
                  <div className="text-center mb-1.5">
                    <h1 className="text-[9px] font-bold text-black mb-1">Yug Dave</h1>
                    <p className="text-zinc-500">New York, NY • yugdave@email.com</p>
                  </div>
                  <div className="border-t border-black w-full mb-1.5"></div>
                  
                  <p className="mb-2 text-zinc-600 text-center">
                    7+ years of software engineering experience, driving product growth and engagement...
                  </p>
                  
                  <h2 className="font-bold text-[5px] text-black uppercase mb-1 border-b border-black pb-0.5 inline-block w-full">Work Experience</h2>
                  
                  <div className="mb-2 mt-1">
                    <div className="flex justify-between items-center mb-0.5">
                      <h3 className="font-bold">Senior Software Engineer</h3>
                      <span className="text-zinc-500 text-[3px]">New York</span>
                    </div>
                    <p className="font-bold mb-0.5">TechCorp Inc.</p>
                    <ul className="list-disc pl-2 space-y-0.5 text-zinc-600">
                      <li>Increased system throughput by 30% in 3 months...</li>
                      <li>Improved company&apos;s online presence by 25%...</li>
                    </ul>
                  </div>
                </div>
                {profile?.design_prefs?.theme === "tech_professional" && (
                  <div className="absolute top-2 right-2 bg-black text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Selected</div>
                )}
                <div className="absolute bottom-2 left-0 w-full text-center text-xs font-bold text-slate-800 bg-white/80 backdrop-blur-sm py-1 border-t border-slate-100">Tech Professional</div>
              </button>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label className="text-xs font-bold text-slate-700">Custom Accent Palette</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={profile?.design_prefs?.accent_color || "#1d9e75"}
                  onChange={e => updateDesign("accent_color", e.target.value)}
                  className="w-10 h-8 rounded-lg cursor-pointer border border-slate-200"
                />
                <Input
                  value={profile?.design_prefs?.accent_color || "#1d9e75"}
                  onChange={e => updateDesign("accent_color", e.target.value)}
                  className="h-8 text-xs font-mono max-w-[120px]"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-3xl p-6 sm:p-8 shadow-inner border border-slate-200/80 space-y-5 font-sans relative overflow-hidden" style={{
            fontFamily: profile?.design_prefs?.theme === "classic_executive" ? "Georgia, serif" : profile?.design_prefs?.theme === "tech_professional" ? "Arial, sans-serif" : "Inter, sans-serif",
            borderTop: profile?.design_prefs?.theme === "classic_executive" ? `6px solid ${profile?.design_prefs?.accent_color || "#1d9e75"}` : "none"
          }}>
            <div className="absolute top-2 right-2 bg-slate-200 text-slate-500 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              Preview Card
            </div>

            <div className={`space-y-1 pb-3 ${profile?.design_prefs?.theme === "tech_professional" ? "text-center border-b border-black" : "text-left"}`}>
              <h2 className="text-xl font-bold" style={{
                color: profile?.design_prefs?.theme === "classic_executive" ? (profile?.design_prefs?.accent_color || "#1d9e75") : profile?.design_prefs?.theme === "tech_professional" ? "#111" : (profile?.design_prefs?.accent_color || "#1d9e75")
              }}>
                {profile.personal.full_name || "YOUR NAME"}
              </h2>
              <div className={`text-[10px] text-slate-500 flex flex-wrap gap-2 ${profile?.design_prefs?.theme === "tech_professional" ? "justify-center font-mono" : "justify-start"}`}>
                <span>{profile.personal.email || "email@domain.com"}</span>
                <span>|</span>
                <span>{profile.personal.phone || "Phone number"}</span>
                <span>|</span>
                <span>{profile.personal.location || "City, Country"}</span>
              </div>
            </div>

            {profile.personal.summary && (
              <div className="space-y-1 pt-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b-2" style={{
                  borderColor: profile?.design_prefs?.theme === "tech_professional" ? "#111" : (profile?.design_prefs?.accent_color || "#1d9e75"),
                  color: profile?.design_prefs?.theme === "classic_executive" ? (profile?.design_prefs?.accent_color || "#1d9e75") : "#111",
                }}>
                  Professional Summary
                </h4>
                <p className="text-[10px] text-slate-600 leading-relaxed text-justify pt-1">
                  {profile.personal.summary}
                </p>
              </div>
            )}

            <div className="space-y-1 pt-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b-2" style={{
                borderColor: profile?.design_prefs?.theme === "tech_professional" ? "#111" : (profile?.design_prefs?.accent_color || "#1d9e75"),
                color: profile?.design_prefs?.theme === "classic_executive" ? (profile?.design_prefs?.accent_color || "#1d9e75") : "#111",
              }}>
                Work Experience
              </h4>
              {profile.experience.length > 0 ? (
                profile.experience.slice(0, 2).map((exp: any, i: number) => (
                  <div key={i} className="text-[10px] space-y-0.5 py-1.5">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{exp.title || "Job Title"}</span>
                      <span className={`font-normal text-slate-500 ${profile?.design_prefs?.theme === "tech_professional" ? "font-mono text-[9px]" : ""}`}>{exp.start_date || "YYYY"} – {exp.end_date || (exp.is_current ? "Present" : "YYYY")}</span>
                    </div>
                    <div className="text-slate-500 italic">{exp.company || "Company Name"}{exp.location ? `, ${exp.location}` : ""}</div>
                    {exp.bullets && exp.bullets[0] && (
                      <ul className="list-disc pl-4 text-slate-600 space-y-0.5 mt-1.5">
                        {exp.bullets.slice(0, 2).map((b: string, idx: number) => (
                          <li key={idx} className="text-[9.5px] leading-relaxed text-justify">{b || "Achievement detail..."}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-slate-300 italic py-2">Add work experience items to render preview</div>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <h4 className="text-[11px] font-bold uppercase tracking-wider pb-0.5 border-b-2" style={{
                borderColor: profile?.design_prefs?.theme === "tech_professional" ? "#111" : (profile?.design_prefs?.accent_color || "#1d9e75"),
                color: profile?.design_prefs?.theme === "classic_executive" ? (profile?.design_prefs?.accent_color || "#1d9e75") : "#111",
              }}>
                Skills & Spoken Languages
              </h4>
              <div className="text-[10px] text-slate-600 space-y-1 pt-1.5">
                {profile.skills.technical.length > 0 && (
                  <div><strong className={`text-slate-800 ${profile?.design_prefs?.theme === "tech_professional" ? "font-mono text-[9px]" : ""}`}>Technical:</strong> {profile.skills.technical.slice(0, 5).join(", ")}</div>
                )}
                {profile.skills.soft.length > 0 && (
                  <div><strong className={`text-slate-800 ${profile?.design_prefs?.theme === "tech_professional" ? "font-mono text-[9px]" : ""}`}>Soft:</strong> {profile.skills.soft.slice(0, 5).join(", ")}</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {activeEnhance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-40"></div>
              <div className="relative z-10 space-y-1">
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                  ATS AI Optimizer
                </h3>
                <p className="text-[11px] text-slate-100 opacity-90 font-medium">
                  Evaluating {activeEnhance.type === "summary" ? "Professional Summary" : "Experience Bullet Point"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveEnhance(null);
                  setEnhanceResult(null);
                }}
                className="relative z-10 text-white hover:text-red-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all text-xs font-bold shadow-sm"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 border-b border-slate-100 bg-slate-50/50 space-y-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Text</span>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 italic shadow-xs">
                  &quot;{activeEnhance.currentText || "No text entered yet. Enter text to optimize!"}&quot;
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-xs font-bold text-slate-600 whitespace-nowrap">Target Role:</Label>
                  <Input
                    value={enhanceRole}
                    onChange={e => setEnhanceRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    className="h-8 text-xs max-w-xs focus-visible:ring-indigo-500"
                  />
                </div>

                <Button
                  onClick={runEnhancement}
                  disabled={enhanceLoading || !activeEnhance.currentText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs px-4 flex items-center gap-1.5 shadow-sm rounded-lg"
                >
                  {enhanceLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      Scan & Optimize
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {enhanceLoading && (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-indigo-200 rounded-full blur-md animate-ping opacity-60"></div>
                    <Loader2 className="relative h-8 w-8 text-indigo-600 animate-spin" />
                  </div>
                  <p className="text-xs text-slate-500 font-bold animate-pulse">Groq model scanning for ATS triggers...</p>
                </div>
              )}

              {!enhanceLoading && !enhanceResult && (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Sparkles className="h-8 w-8 mx-auto text-indigo-300 opacity-60 animate-bounce" />
                  <p className="text-xs font-semibold">Click &quot;Scan &amp; Optimize&quot; to analyze this block for ATS score, critiques, and alternatives.</p>
                </div>
              )}

              {!enhanceLoading && enhanceResult && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    <div className="md:col-span-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/50 flex flex-col items-center justify-center text-center space-y-2 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ATS Score</span>
                      <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 shadow-sm" style={{
                        borderColor: enhanceResult.score >= 80 ? "#1d9e75" : enhanceResult.score >= 50 ? "#f59e0b" : "#ef4444"
                      }}>
                        <span className="text-2xl font-black tracking-tight" style={{
                          color: enhanceResult.score >= 80 ? "#0f6e56" : enhanceResult.score >= 50 ? "#b45309" : "#dc2626"
                        }}>
                          {enhanceResult.score}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold absolute bottom-2">/100</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{
                        backgroundColor: enhanceResult.score >= 80 ? "rgba(29,158,117,0.1)" : enhanceResult.score >= 50 ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)",
                        color: enhanceResult.score >= 80 ? "#0f6e56" : enhanceResult.score >= 50 ? "#b45309" : "#dc2626"
                      }}>
                        {enhanceResult.score >= 80 ? "ATS Ready" : enhanceResult.score >= 50 ? "Needs Improvement" : "Critical Fix Required"}
                      </span>
                    </div>

                    <div className="md:col-span-8 space-y-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scan Critiques & Weaknesses</span>
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/40 space-y-2 max-h-[160px] overflow-y-auto">
                        {enhanceResult.critiques.length > 0 ? (
                          enhanceResult.critiques.map((crit, cIdx) => (
                            <div key={cIdx} className="text-xs text-slate-600 flex items-start gap-2 leading-relaxed">
                              <span className="text-amber-500 font-bold select-none">•</span>
                              <span>{crit}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                            ✨ Perfect! No notable ATS weaknesses found in this block.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">ATS-Optimized Rewrites (Click to apply)</span>
                    <div className="space-y-3">
                      {enhanceResult.optimized_suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => applyEnhanceRewrite(sug)}
                          className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50/10 transition-all shadow-xs hover:shadow-md flex items-start gap-3 group"
                        >
                          <span className="w-5 h-5 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 mt-0.5 flex-shrink-0 select-none">
                            {sIdx + 1}
                          </span>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs text-slate-700 font-medium leading-relaxed group-hover:text-slate-900">
                              {sug}
                            </p>
                            <span className="text-[9px] font-semibold text-indigo-500/80 group-hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity block">
                              → Apply rewrite into form
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isTailoringOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden w-full max-w-lg flex flex-col">
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                  AI Job Tailoring Studio
                </h3>
                <p className="text-[10.5px] text-indigo-100 opacity-90 font-medium">Globally restructure your CV points for matching requirements</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTailoringOpen(false)}
                className="text-white hover:text-indigo-100 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-all text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-4 text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Paste Target Job Description here...</Label>
                <Textarea
                  value={tailorJobDescription}
                  onChange={e => setTailorJobDescription(e.target.value)}
                  placeholder="Paste the target job posting / technical requirements list here..."
                  rows={8}
                  className="w-full text-xs p-3 rounded-xl border border-zinc-200 focus-visible:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700">Target Role Title Override (Optional)</Label>
                <Input
                  value={tailorTargetRole}
                  onChange={e => setTailorTargetRole(e.target.value)}
                  placeholder="e.g. Senior Staff Python Engineer"
                  className="h-10 text-xs w-full focus-visible:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTailoringOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700"
                >
                  Cancel
                </button>
                <Button
                  onClick={handleGlobalTailor}
                  disabled={!tailorJobDescription.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs px-4 flex items-center gap-1.5 rounded-xl shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Restructure &amp; Match My CV
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tailorLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl border border-zinc-200">
            <Loader2 className="h-10 w-10 animate-spin text-[#1da074] mx-auto" />
            <h3 className="text-base font-bold text-zinc-900">Customizing Your Resume</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              AI is analyzing the job description and rewriting your career milestones for optimal ATS matching...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}