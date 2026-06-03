"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Video, Loader2, Target, User, Sparkles, FileText } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function InterviewPrepPage() {
  const router = useRouter();
  const supabase = createClient();

  const [targetPosition, setTargetPosition] = useState("");
  const [persona, setPersona] = useState("mentor");
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cvVariants, setCvVariants] = useState<any[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  useEffect(() => {
    async function loadVariants() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_cv_variants")
        .select("id, label, cv_profile")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setCvVariants(data);
      }
    }
    loadVariants();
  }, [supabase]);

  const handleVariantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedVariantId(val);
    if (val) {
      const variant = cvVariants.find(v => v.id === val);
      if (variant && variant.cv_profile) {
        const roles = variant.cv_profile.target_roles;
        if (roles && roles.length > 0) {
          setTargetPosition(roles[0]);
        } else if (variant.cv_profile.personal?.target_role) {
          setTargetPosition(variant.cv_profile.personal.target_role);
        }
      }
    }
  };

  const handleStart = async () => {
    if (!targetPosition.trim()) {
      setError("Please specify a target position.");
      return;
    }
    setError(null);
    setIsStarting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: dbError } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          selected_persona: persona,
          target_position: targetPosition,
          cv_variant_id: selectedVariantId || null,
          current_stage: "Intro",
          status: "active"
        })
        .select("id")
        .single();

      if (dbError) throw dbError;

      router.push(`/interview/${data.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start interview session.");
      setIsStarting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-50/30">
      <div className="w-full max-w-lg space-y-8 bg-white p-8 sm:p-10 rounded-2xl border border-zinc-200/80 shadow-sm">
        
        <div className="text-center space-y-2">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <Video className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Configure Interview</h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm mx-auto">
            Set up your AI mock interview session. Your CV will be automatically provided to the interviewer.
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-lg border border-rose-100 text-center">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-zinc-400" />
              Select CV Variant (Optional)
            </label>
            <select
              value={selectedVariantId}
              onChange={handleVariantChange}
              className="w-full h-11 px-3 text-sm rounded-xl border border-zinc-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
            >
              <option value="">Master Profile (Default)</option>
              {cvVariants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label || "Unnamed Variant"}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="h-3.5 w-3.5 text-zinc-400" />
              Target Position
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              value={targetPosition}
              onChange={(e) => setTargetPosition(e.target.value)}
              className="w-full h-11 px-3 text-sm rounded-xl border border-zinc-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Select Interviewer Persona
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              <button
                type="button"
                onClick={() => setPersona("mentor")}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                  persona === "mentor" 
                  ? "border-indigo-500 bg-indigo-50/50" 
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <h4 className="text-sm font-bold text-zinc-900">The Mentor</h4>
                  {persona === "mentor" && <Sparkles className="h-4 w-4 text-indigo-500" />}
                </div>
                <p className="text-[11px] text-zinc-500 text-left leading-relaxed">
                  Supportive and constructive. Guides you through roadblocks.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPersona("hardliner")}
                className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all ${
                  persona === "hardliner" 
                  ? "border-rose-500 bg-rose-50/50" 
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <h4 className="text-sm font-bold text-zinc-900">The FAANG Hardliner</h4>
                  {persona === "hardliner" && <Target className="h-4 w-4 text-rose-500" />}
                </div>
                <p className="text-[11px] text-zinc-500 text-left leading-relaxed">
                  Strict and pedantic. Drills into edge cases and trade-offs.
                </p>
              </button>

            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t border-zinc-100 flex flex-col items-center gap-4">
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              "Start Interview Session"
            )}
          </button>
          <Link href="/dashboard" className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
