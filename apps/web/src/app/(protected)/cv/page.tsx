"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Upload, Sparkles, Loader2, FileText, ArrowRight,
  AlertTriangle, Briefcase, Globe, Settings2, Pencil, Trash2,
  Check, CheckCircle, AlertCircle
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function CVPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const masterFileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [masterProfile, setMasterProfile] = useState<any>(null);
  const [masterScore, setMasterScore] = useState<number>(0);
  const [variantsList, setVariantsList] = useState<any[]>([]);

  // Metadata Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"scratch" | "upload" | "master" | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [variantName, setVariantName] = useState("");
  const [targetRole, setTargetRole] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user && isMounted) {
          const { data: masterData, error: masterErr } = await supabase
            .from("user_profiles")
            .select("cv_profile, target_roles, cached_ats_score, cached_critiques")
            .eq("id", user.id)
            .maybeSingle();

          if (!masterErr && masterData?.cv_profile) {
            const profile = masterData.cv_profile as any;
            const fallbackRole = masterData.target_roles?.[0] || "Software Engineer";
            setMasterProfile(profile);

            if (masterData.cached_ats_score !== null && masterData.cached_ats_score !== undefined) {
              setMasterScore(masterData.cached_ats_score);
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
                setMasterScore(analysis.score);

                await supabase.from("user_profiles").update({
                  cached_ats_score: analysis.score,
                  cached_critiques: analysis.critiques || [],
                  cv_hash: analysis.cv_hash_checksum
                }).eq("id", user.id);
              }
            }
          }

          const { data: variantsData, error: variantsErr } = await supabase
            .from("user_cv_variants")
            .select("id, label, target_role, is_public, username, updated_at, cached_ats_score, cached_critiques")
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false });

          if (!variantsErr && variantsData) {
            setVariantsList(variantsData);
          }
        }
      } catch (err) {
        console.error("Failed executing automated real-time ATS analysis lookup:", err);
        if (isMounted) {
          setMasterScore(70);
        }
      } finally {
        if (isMounted) {
          setLoadingDashboard(false);
        }
      }
    }

    fetchDashboardData();

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
      interceptUpload(e.dataTransfer.files[0]);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      interceptUpload(e.target.files[0]);
    }
  }

  async function handleMasterFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
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
      setUploadProgress("Uploading master CV...");

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
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { error: updateError } = await supabase.from("user_profiles").update({
              cv_profile: data.profile,
              cached_ats_score: null,
              cached_critiques: null,
              cv_hash: null
            }).eq("id", user.id);

            if (updateError) throw updateError;
            
            window.location.reload();
          }
        } else {
          throw new Error("Parser returned an empty profile.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while parsing. Please try again.");
        setParsing(false);
      }
    }
  }

  function interceptUpload(file: File) {
    const validTypes = ["application/pdf", "text/plain"];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".pdf") && !file.name.endsWith(".txt")) {
      setError("Unsupported file format. Please upload a PDF (.pdf) or Text (.txt) file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Maximum size allowed is 5MB.");
      return;
    }
    setPendingFile(file);
    setVariantName("");
    setTargetRole("");
    setModalType("upload");
    setIsModalOpen(true);
  }

  function interceptScratch() {
    setVariantName("");
    setTargetRole("");
    setModalType("scratch");
    setIsModalOpen(true);
  }

  function interceptMaster() {
    setVariantName("");
    setTargetRole("");
    setModalType("master");
    setIsModalOpen(true);
  }

  async function deleteVariant(id: string) {
    if (!window.confirm("Are you sure you want to delete this variant? This cannot be undone.")) return;
    
    try {
      const supabase = createClient();
      const { error: delError } = await supabase.from("user_cv_variants").delete().eq("id", id);
      if (delError) throw delError;
      
      setVariantsList(prev => prev.filter(v => v.id !== id));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to delete variant");
    }
  }

  async function submitModal() {
    if (!variantName.trim() || !targetRole.trim()) {
      setError("Please fill in both Variant Name and Target Role.");
      return;
    }
    setIsModalOpen(false);
    setError(null);
    setParsing(true);

    if (modalType === "upload" && pendingFile) {
      setUploadProgress("Uploading file...");
      try {
        const formData = new FormData();
        formData.append("file", pendingFile);

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
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newVariant, error: insertError } = await supabase.from("user_cv_variants").insert({
              user_id: user.id,
              label: variantName.trim(),
              target_role: targetRole.trim(),
              cv_profile: data.profile,
            }).select().single();
            
            if (insertError) throw insertError;
            if (newVariant) {
               router.refresh();
               router.push(`/cv/editor/${newVariant.id}`);
               return;
            }
          }
        } else {
          throw new Error("Parser returned an empty profile.");
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred while parsing. Please try again.");
        setParsing(false);
      }
    } else if (modalType === "scratch") {
      setUploadProgress("Initializing clean workspace...");
      try {
        const res = await fetch("/api/cv/parse?init=true", { method: "POST" });
        if (!res.ok) throw new Error("Failed initializing profile schema.");

        const data = await res.json();
        if (data.profile) {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: newVariant, error: insertError } = await supabase.from("user_cv_variants").insert({
              user_id: user.id,
              label: variantName.trim(),
              target_role: targetRole.trim(),
              cv_profile: data.profile,
            }).select().single();
            
            if (insertError) throw insertError;
            if (newVariant) {
               router.refresh();
               router.push(`/cv/editor/${newVariant.id}`);
               return;
            }
          }
        }
      } catch (_) {
        setError("Failed to initialize canvas. Please try again.");
        setParsing(false);
      }
    } else if (modalType === "master") {
      setUploadProgress("Cloning master profile...");
      try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user && masterProfile) {
            const { data: newVariant, error: insertError } = await supabase.from("user_cv_variants").insert({
              user_id: user.id,
              label: variantName.trim(),
              target_role: targetRole.trim(),
              cv_profile: masterProfile,
            }).select().single();
            
            if (insertError) throw insertError;
            if (newVariant) {
               router.refresh();
               router.push(`/cv/editor/${newVariant.id}`);
               return;
            }
          }
      } catch (err: any) {
        setError("Failed to clone master profile. Please try again.");
        setParsing(false);
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f4f5f6] overflow-y-auto">
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col justify-start space-y-8">
        <div className="text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-[#1da074]/10 text-[#1da074] border border-[#1da074]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
            <Sparkles className="h-3 w-3" />
            <span>AI Suggestion Ready</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Design Your ATS-Optimized CV
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 max-w-xl leading-relaxed">
            Manage your master profile foundation and create unlimited tailored variants to perfectly match specific job requirements.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-3">
            <AlertTriangle className="h-4.5 w-4.5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {parsing || loadingDashboard ? (
          <div className="bg-white rounded-3xl p-12 border border-zinc-200/60 flex flex-col items-center justify-center space-y-4 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-700" />
            <p className="text-zinc-800 font-bold text-base">Processing Canvas</p>
            <p className="text-zinc-400 text-xs">{parsing ? uploadProgress : "Running dynamic deep analysis matches..."}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            <div className="space-y-6">
              {masterProfile ? (
                <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm flex flex-col space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase text-indigo-600 tracking-wider">
                    <FileText className="h-4 w-4" />
                    <span>Master Profile Foundation</span>
                  </div>

                  <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-4">
                    <h3 className="text-base font-bold text-zinc-800 tracking-tight">
                      {masterProfile.personal?.full_name || "Resume Profile"}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{masterProfile.personal?.email || "No email added"}</p>

                    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500">
                      <span>Experience Entries: <strong>{(masterProfile.experience || []).length}</strong></span>
                      <span>Education Entries: <strong>{(masterProfile.education || []).length}</strong></span>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold uppercase text-zinc-400 tracking-wider">
                        <span>ATS Match Strength</span>
                        <span className="text-sm font-black text-zinc-800">{masterScore}%</span>
                      </div>
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200/50">
                        <div
                          className="h-full bg-[#1da074] transition-all duration-500 rounded-full"
                          style={{ width: `${masterScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-zinc-100 flex flex-col sm:flex-row justify-end gap-3">
                    <input
                      type="file"
                      ref={masterFileInputRef}
                      onChange={handleMasterFileSelect}
                      accept=".pdf,.txt"
                      className="hidden"
                    />
                    <button
                      onClick={() => masterFileInputRef.current?.click()}
                      className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Replace Master CV
                    </button>
                    <button
                      onClick={interceptMaster}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      Create Variant from Master
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-zinc-200/60 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center py-12 text-center">
                   <AlertTriangle className="h-8 w-8 text-amber-500 mb-3" />
                   <h3 className="font-bold text-zinc-800 text-sm">No Master Profile Found</h3>
                   <p className="text-xs text-zinc-500 mt-2 max-w-xs mb-4">You don&apos;t have a master profile yet. Start by uploading an existing resume or building from scratch.</p>
                   
                   <input
                     type="file"
                     ref={masterFileInputRef}
                     onChange={handleMasterFileSelect}
                     accept=".pdf,.txt"
                     className="hidden"
                   />
                   <button
                     onClick={() => masterFileInputRef.current?.click()}
                     className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                   >
                     <Upload className="h-3.5 w-3.5" />
                     Upload Master CV
                   </button>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`group bg-white rounded-2xl p-6 border-2 border-dashed transition-all duration-300 flex flex-col md:flex-row items-center gap-6 ${dragActive
                    ? "border-emerald-500 bg-emerald-50/10"
                    : "border-zinc-200 hover:border-emerald-500/50 hover:shadow-sm"
                    }`}
                >
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Upload className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-sm font-bold text-zinc-900 mb-1">Upload New Resume</h2>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-4">
                      Drop your PDF or TXT resume file here. Our AI engine parses the fresh contents.
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.txt"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full md:w-auto py-2 px-4 bg-zinc-50 border border-zinc-200 hover:border-emerald-500/50 hover:bg-[#1da074]/10 text-zinc-700 hover:text-emerald-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Select PDF or TXT
                    </button>
                  </div>
                </div>

                <div className="group bg-white rounded-2xl p-6 border border-zinc-200 hover:border-indigo-500/30 hover:shadow-sm transition-all duration-300 flex flex-col md:flex-row items-center gap-6">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-sm font-bold text-zinc-900 mb-1">Build Clean from Scratch</h2>
                    <p className="text-zinc-500 text-xs leading-relaxed mb-4">
                      Initialize an empty framework canvas to add projects and credentials piece by piece.
                    </p>
                    <button
                      onClick={interceptScratch}
                      className="w-full md:w-auto py-2 px-4 bg-[#0a121e] hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      Start Fresh Canvas
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-500 tracking-wider mb-2">
                 <Briefcase className="h-4 w-4" />
                 <span>Tailored CV Variants ({variantsList.length})</span>
               </div>
               
               {variantsList.length === 0 ? (
                 <div className="bg-white border border-zinc-200/50 rounded-2xl p-8 text-center flex flex-col items-center">
                    <Settings2 className="h-8 w-8 text-zinc-300 mb-3" />
                    <p className="text-zinc-500 text-sm font-medium">No Tailored Variants Found</p>
                    <p className="text-zinc-400 text-xs mt-1 max-w-xs">Generate custom resumes targeted for specific roles and companies.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 gap-4">
                   {variantsList.map((variant) => (
                     <div key={variant.id} className="bg-white border border-zinc-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between items-start gap-4">
                       <div className="w-full flex items-start justify-between">
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className="text-sm font-bold text-zinc-900 tracking-tight">{variant.label}</h3>
                             {typeof variant.cached_ats_score === "number" && (
                               <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                 ATS: {variant.cached_ats_score}%
                               </span>
                             )}
                           </div>
                           <p className="text-[11px] text-zinc-500 mt-1 font-medium bg-zinc-100 inline-block px-2 py-0.5 rounded-md">
                             Target: {variant.target_role || "General"}
                           </p>
                         </div>
                         {variant.is_public && (
                           <div className="flex items-center gap-1 text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-1 rounded-md uppercase">
                             <Globe className="h-3 w-3" /> Public
                           </div>
                         )}
                       </div>
                       
                       <div className="w-full flex items-center justify-between border-t border-zinc-100 pt-4 mt-1">
                         <span className="text-[10px] text-zinc-400">
                           Updated: {new Date(variant.updated_at).toLocaleDateString()}
                         </span>
                         <div className="flex items-center gap-2">
                           <button
                             onClick={() => deleteVariant(variant.id)}
                             title="Delete Variant"
                             className="flex items-center justify-center h-8 w-8 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                           >
                             <Trash2 className="h-3.5 w-3.5" />
                           </button>
                           <div className="flex items-center gap-2">
                             <Popover>
                               {Array.isArray(variant.cached_critiques) && variant.cached_critiques.length > 0 ? (
                                 <PopoverTrigger className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-rose-100 text-rose-600 text-[9px] font-black cursor-pointer hover:scale-105 active:scale-95 transition-transform" title={`${variant.cached_critiques.length} actionable fixes`}>
                                   {variant.cached_critiques.length}
                                 </PopoverTrigger>
                               ) : (
                                 <PopoverTrigger className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100 text-emerald-600 text-[9px] font-black cursor-pointer hover:scale-105 active:scale-95 transition-transform" title="No urgent fixes">
                                   <Check className="h-2.5 w-2.5" />
                                 </PopoverTrigger>
                               )}
                               <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
                                 {Array.isArray(variant.cached_critiques) && variant.cached_critiques.length > 0 ? (
                                   <div className="space-y-3">
                                     <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                                       <AlertCircle className="h-4 w-4 text-amber-500" />
                                       Actionable Fixes
                                     </h4>
                                     <ul className="space-y-2">
                                       {variant.cached_critiques.map((critique: string, i: number) => (
                                         <li key={i} className="flex items-start gap-2">
                                           <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                           <span className="text-xs text-zinc-600 leading-relaxed">{critique}</span>
                                         </li>
                                       ))}
                                     </ul>
                                   </div>
                                 ) : (
                                   <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
                                     <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1">
                                       <CheckCircle className="h-5 w-5 text-emerald-500" />
                                     </div>
                                     <h4 className="text-sm font-bold text-zinc-900">All Clear</h4>
                                     <p className="text-xs text-zinc-600 leading-relaxed">No urgent fixes detected for this targeted variant. Excellent work!</p>
                                   </div>
                                 )}
                               </PopoverContent>
                             </Popover>
                             <button
                               onClick={() => {
                                 router.refresh();
                                 router.push(`/cv/editor/${variant.id}`);
                               }}
                               className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 h-8 rounded-lg transition-colors"
                             >
                               <Pencil className="h-3.5 w-3.5" />
                               Edit Variant
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>

          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200/60 p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight mb-2">
              {modalType === "upload" ? "Configure Uploaded Variant" : 
               modalType === "master" ? "Clone Master Profile" : 
               "Initialize New Canvas"}
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Provide metadata for this specific CV version. This helps organize your tailored collection.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Variant Name <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="e.g., Junior Backend Engineer - Dortmund" 
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700">Target Role <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Java Core Software Developer" 
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitModal}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-xl transition-colors"
              >
                Create Variant
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}