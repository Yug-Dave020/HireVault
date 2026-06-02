"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateVariantModal({ masterProfile, defaultRole }: { masterProfile: any, defaultRole: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [targetRole, setTargetRole] = useState(defaultRole);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !targetRole.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error: insertError } = await supabase
        .from("user_cv_variants")
        .insert({
          user_id: user.id,
          label: label.trim(),
          target_role: targetRole.trim(),
          cv_profile: masterProfile || {},
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.refresh();
      router.push(`/cv/editor/${data.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create variant");
      setCreating(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold px-4 h-9 rounded-xl flex items-center gap-1.5 shadow-sm"
      >
        <Plus className="h-4 w-4" />
        New Variant
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-zinc-900">Create CV Variant</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition-colors">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="variant-label" className="text-xs font-bold text-zinc-700">Variant Name</Label>
                <Input
                  id="variant-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Senior Frontend Dev"
                  className="h-10 text-xs rounded-xl border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="variant-role" className="text-xs font-bold text-zinc-700">Target Role</Label>
                <Input
                  id="variant-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Software Engineer"
                  className="h-10 text-xs rounded-xl border-zinc-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-zinc-400">This helps the AI tailor your summary.</p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="text-xs h-9 font-semibold rounded-xl text-zinc-600">
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9 rounded-xl shadow-sm min-w-[100px]">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Variant"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
