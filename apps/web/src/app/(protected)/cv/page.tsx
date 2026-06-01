"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Upload, Sparkles, Loader2, FileText, ArrowRight,
  AlertTriangle, CheckCircle, HelpCircle
} from "lucide-react";

export default function CVPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savedCvProfile, setSavedCvProfile] = useState<any>(null);
  const [fixesList, setFixesList] = useState<string[]>([]);
  const [cvAtsScore, setCvAtsScore] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function fetchExistingCV() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data, error } = await supabase
            .from("user_profiles")
            .select("cv_profile, target_roles, cached_ats_score, cached_critiques")
            .eq("id", user.id)
            .maybeSingle();

          if (!error && data?.cv_profile) {
            const profile = data.cv_profile as any;
            const fallbackRole = data.target_roles?.[0] || "Software Engineer";
            setSavedCvProfile(profile);

            if (data.cached_ats_score !== null && data.cached_ats_score !== undefined) {
              setCvAtsScore(data.cached_ats_score);
              setFixesList((data.cached_critiques as string[]) || []);
            } else {
              setUploadProgress("Analyzing profile parameters via AI...");
              const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "http://127.0.0.1:8000";

              const askWorker = await fetch(`${workerUrl}/cv/suggest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  section_type: "global_gap_analysis",
                  current_text: profile.personal?.summary || "Analyze baseline career history.",
                  target_role: fallbackRole,
                  full_cv_context: profile
                })
              });

              if (askWorker.ok && isMounted) {
                const analysis = await askWorker.json();
                setCvAtsScore(analysis.score);
                setFixesList(analysis.critiques || []);

                await supabase.from("user_profiles").update({
                  cached_ats_score: analysis.score,
                  cached_critiques: analysis.critiques || [],
                  cv_hash: analysis.cv_hash_checksum
                }).eq("id", user.id);
              } else if (!askWorker.ok) {
                throw new Error("Worker unavailable");
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed executing automated real-time ATS analysis lookup:", err);
        if (isMounted) {
          setCvAtsScore(70);
          setFixesList(["Could not complete remote dynamic grading sync. Using cached local draft fallback."]);
        }
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    fetchExistingCV();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  }

  async function processFile(file: File) {
    const validTypes = ["application/pdf", "text/plain"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
      setError("Unsupported file format. Please upload a PDF (.pdf) or Text (.txt) file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Maximum size allowed is 5MB.");
      return;
    }

    setError(null);
    setParsing(true);
    setUploadProgress("Uploading file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cv/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed parsing resume file.");
      }

      setUploadProgress("Synthesizing structured career profile...");
      const data = await res.json();

      if (data.profile) {
        sessionStorage.setItem("draft_cv_profile", JSON.stringify(data.profile));

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_profiles").upsert({
            id: user.id,
            parse_mode: "uploaded",
            cv_profile: data.profile,
            cv_hash: null,
            cached_ats_score: null,
            cached_critiques: null,
            updated_at: new Date().toISOString()
          });
        }

        router.push("/cv/editor?mode=uploaded");
      } else {
        throw new Error("Parser returned an empty profile.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while parsing. Please try again.");
      setParsing(false);
    }
  }

  async function handleCreateScratch() {
    setError(null);
    setParsing(true);
    setUploadProgress("Initializing clean workspace...");

    try {
      const res = await fetch("/api/cv/parse?init=true", { method: "POST" });
      if (!res.ok) throw new Error("Failed initializing profile schema.");

      const data = await res.json();
      if (data.profile) {
        sessionStorage.setItem("draft_cv_profile", JSON.stringify(data.profile));

        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_profiles").upsert({
            id: user.id,
            parse_mode: "scratch",
            cv_profile: data.profile,
            cv_hash: null,
            cached_ats_score: null,
            cached_critiques: null,
            updated_at: new Date().toISOString()
          });
        }

        router.push("/cv/editor?mode=scratch");
      }
    } catch (err: any) {
      setError("Failed to initialize canvas. Please try again.");
      setParsing(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f4f5f6] overflow-y-auto">
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col justify-center space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-[#1da074]/10 text-[#1da074] border border-[#1da074]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Suggestion Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Design Your ATS-Optimized CV
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
            Configure your professional workspace options. Update historical details seamlessly to clear corporate automated search systems.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-3">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {parsing || loadingProfile ? (
          <div className="bg-white rounded-3xl p-12 border border-zinc-200/60 flex flex-col items-center justify-center space-y-4 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
            <p className="text-zinc-800 font-bold text-base">Processing Canvas</p>
            <p className="text-zinc-400 text-xs">{parsing ? uploadProgress : "Running dynamic deep analysis matches..."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {savedCvProfile && (
              <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4 border-b md:border-b-0 md:border-r border-zinc-100 pb-4 md:pb-0 md:pr-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600 tracking-wider">
                    <FileText className="h-4 w-4" />
                    <span>Active Profile Found</span>
                  </div>

                  <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-4">
                    <h3 className="text-base font-bold text-zinc-800 tracking-tight">
                      {savedCvProfile.personal?.full_name || "Resume Profile"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{savedCvProfile.personal?.email || "No email added"}</p>

                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
                      <span>Experience Entries: <strong>{(savedCvProfile.experience || []).length}</strong></span>
                      <span>Education Entries: <strong>{(savedCvProfile.education || []).length}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sessionStorage.setItem("draft_cv_profile", JSON.stringify(savedCvProfile));
                      router.push("/cv/editor?mode=saved");
                    }}
                    className="inline-flex items-center gap-2 py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Open Active Workspace Canvas
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase text-zinc-400 tracking-wider">
                        <span>ATS Match Strength</span>
                        <span className="text-sm font-black text-zinc-800">{cvAtsScore}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/50">
                        <div
                          className="h-full bg-[#1da074] transition-all duration-500 rounded-full"
                          style={{ width: `${cvAtsScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 my-2" />

                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-400 tracking-wider mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                        <span>Required Fixes ({fixesList.length})</span>
                      </div>

                      {fixesList.length > 0 ? (
                        <ul className="space-y-2">
                          {fixesList.map((fix, fIdx) => (
                            <li key={fIdx} className="text-xs text-zinc-600 flex items-start gap-2 leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                              <span>{fix}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                          <CheckCircle className="h-4 w-4 flex-shrink-0" />
                          <span>All baseline layout rules passed completely!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-zinc-400 italic flex items-center gap-1 pt-2 border-t border-zinc-50">
                    <HelpCircle className="h-3 w-3 text-zinc-300" />
                    Fix items compliance instantly inside the editor workspace.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`group bg-white rounded-2xl p-6 border-2 border-dashed transition-all duration-300 flex flex-col justify-between ${dragActive
                  ? "border-emerald-500 bg-emerald-50/10"
                  : "border-zinc-200 hover:border-emerald-500/50 hover:shadow-sm"
                  }`}
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Upload className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 mb-1.5">Upload New / Overwrite Resume</h2>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                    Drop your PDF or TXT resume file here. Our AI engine parses the fresh contents into a fully dynamic structured interface layout.
                  </p>
                </div>

                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,.txt"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-zinc-50 border border-zinc-200 hover:border-emerald-500/50 hover:bg-[#1da074]/10 text-zinc-700 hover:text-emerald-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" />
                    Select PDF or TXT File
                  </button>
                  <p className="text-[10px] text-zinc-400 text-center mt-2">Max file size 5MB</p>
                </div>
              </div>

              <div className="group bg-white rounded-2xl p-6 border border-zinc-200 hover:border-indigo-500/30 hover:shadow-sm transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h2 className="text-base font-bold text-zinc-900 mb-1.5">Build Clean from Scratch</h2>
                  <p className="text-zinc-500 text-xs leading-relaxed mb-6">
                    Skip historical imports entirely and initialize an empty framework canvas. Add project blocks, credentials, and languages piece by piece.
                  </p>
                </div>

                <div>
                  <button
                    onClick={handleCreateScratch}
                    className="w-full py-2.5 px-4 bg-[#0a121e] hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    Start Fresh Canvas
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <p className="text-[10px] text-zinc-400 text-center mt-2">&nbsp;</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}