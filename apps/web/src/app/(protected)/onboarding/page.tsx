"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Video, User, ArrowRight } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("there");
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function initOnboarding() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "there";
      setUserName(name);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        const { error: insertError } = await supabase.from("user_profiles").insert({
          id: user.id,
          full_name: name,
          target_roles: [],
          target_locations: [],
          skills: [],
          experience_years: 0,
          updated_at: new Date().toISOString()
        });

        if (insertError) {
          console.error("Failed initializing profile row", insertError);
          setInitError("Could not initialize your user profile. Please try reloading.");
        }
      }
      setLoading(false);
    }
    initOnboarding();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f6] flex flex-col items-center justify-center text-zinc-600">
        <Loader2 className="h-8 w-8 animate-spin text-[#1da074] mb-3" />
        <p className="text-zinc-500 text-xs font-semibold">Preparing your career accelerator...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f6] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white rounded-[24px] shadow-sm border border-zinc-200/50 p-8 sm:p-12 text-center space-y-10">

        <div className="flex items-center justify-center gap-2.5">
          <div className="h-9 w-9 shrink-0">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
              <rect width="100" height="100" rx="30" fill="#1da074" />
              <rect x="18" y="34" width="64" height="46" rx="10" stroke="white" stroke-width="8" stroke-linejoin="round" />
              <path d="M36 34V22C36 17.5 39.5 14 44 14H56C60.5 14 64 17.5 64 22V34" stroke="white" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" />
              <path d="M36 34V80" stroke="white" stroke-width="8" stroke-linecap="round" />
              <path d="M64 34V80" stroke="white" stroke-width="8" stroke-linecap="round" />
            </svg>
          </div>
          <span className="text-lg font-black tracking-tight text-zinc-900 leading-none">HireVault</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            Welcome to HireVault, <span className="text-[#1da074]">{userName}</span>!
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            Choose your next target destination. Your end-to-end AI career accelerator starts here.
          </p>
        </div>

        {initError && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-2.5 rounded-xl text-xs inline-block font-semibold">
            ⚠ {initError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">

          <Link href="/cv" className="group relative block p-6 rounded-2xl bg-white border border-zinc-200 hover:border-[#1da074]/50 shadow-xs hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform p-2">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <rect x="15" y="32" width="70" height="48" rx="12" stroke="#1da074" strokeWidth="9" strokeLinejoin="round" />
                <path d="M36 32V20C36 15.6 39.6 12 44 12H56C60.4 12 64 15.6 64 20V32" stroke="#1da074" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M36 32V80" stroke="#1da074" strokeWidth="9" strokeLinecap="round" />
                <path d="M64 32V80" stroke="#1da074" strokeWidth="9" strokeLinecap="round" />
              </svg>
            </div>

            <h2 className="text-base font-bold text-zinc-900 mb-1.5 flex items-center gap-1.5">
              Optimize My CV
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-[#1da074]" />
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Upload an existing resume or build one from scratch to export a highly optimized, single-column, ATS-safe PDF.
            </p>
          </Link>

          <Link href="/interview" className="group relative block p-6 rounded-2xl bg-white border border-zinc-200 hover:border-blue-500/50 shadow-xs hover:shadow-md transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
              <Video className="h-5 w-5 text-blue-500" />
            </div>

            <h2 className="text-base font-bold text-zinc-900 mb-1.5 flex items-center gap-1.5">
              Prepare for Interviews
              <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-blue-500" />
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Practise behavioral mock interviews with our conversational AI system and receive targeted visual and technical feedback.
            </p>
          </Link>

        </div>

        <div className="pt-6 border-t border-zinc-100 flex items-center justify-between gap-4">

          <Link href="/profile" className="flex items-center gap-1.5 text-xs font-bold text-[#1da074] hover:text-zinc-600 transition-colors">
            <User className="h-4 w-4" />
            Want to update your targeting? Edit My Profile
          </Link>
        </div>

      </div>
    </div>
  );
}
