"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Globe, Copy, Check, FileText, ArrowRight, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function VariantCard({ variant }: { variant: any }) {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(variant.is_public);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = typeof window !== "undefined"
    ? `${window.location.origin}/p/${variant.username || "your-slug"}`
    : `hirevault.com/p/${variant.username || "your-slug"}`;

  const handleToggle = async (checked: boolean) => {
    setIsPublic(checked);
    setToggling(true);
    const supabase = createClient();
    await supabase.from("user_cv_variants").update({ is_public: checked }).eq("id", variant.id);
    setToggling(false);
    router.refresh();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-xl p-5 bg-white hover:border-zinc-300 transition-all text-left flex flex-col justify-between group shadow-sm h-full">
      <div className="space-y-3">
        <div className="border-b border-dashed border-zinc-200 pb-3 flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-800 tracking-tight">{variant.label}</h4>
              {typeof variant.cached_ats_score === "number" && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  ATS: {variant.cached_ats_score}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{variant.target_role}</p>
          </div>
          <Link href={`/cv/editor/${variant.id}`} className="shrink-0 h-8 w-8 bg-zinc-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg flex items-center justify-center text-zinc-400 transition-colors">
            <FileText className="h-4 w-4" />
          </Link>
        </div>


        <div className="pt-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-600 flex items-center gap-1.5">
              <Globe className={`h-3 w-3 ${isPublic ? 'text-indigo-500' : 'text-zinc-400'}`} />
              Public Access
            </span>
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
            ) : (
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isPublic}
                  onChange={(e) => handleToggle(e.target.checked)}
                />
                <div className="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            )}
          </div>

          {isPublic ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-2.5 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-mono text-zinc-500 select-all focus:outline-none truncate"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="h-7 px-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100 rounded-lg text-[10px] font-bold gap-1 min-w-[70px] justify-center"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-zinc-400" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 bg-zinc-50 px-2 py-1.5 rounded-lg border border-zinc-100">
              <EyeOff className="h-3 w-3 shrink-0" />
              <span>Offline</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">
          Edited {new Date(variant.updated_at).toLocaleDateString()}
        </span>
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
            <PopoverContent className="w-80 p-5" align="end" sideOffset={8}>
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
          <Link href={`/cv/editor/${variant.id}`} className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1">
            Open Editor <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
