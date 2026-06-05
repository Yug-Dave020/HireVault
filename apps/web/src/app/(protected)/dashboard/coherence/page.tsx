import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoherenceClient } from "./CoherenceClient";

export const metadata = {
  title: "Coherence Audit — HireVault",
  description: "Semantic analysis of your CV",
};

export default async function CoherencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the first active CV variant for this user
  const { data: variants } = await supabase
    .from("user_cv_variants")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!variants || variants.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">No CV Variants Found</h1>
        <p className="text-zinc-500 mt-2">Please create a CV variant in the dashboard first to analyze coherence.</p>
      </div>
    );
  }

  const cvId = variants[0].id;

  return <CoherenceClient cvId={cvId} />;
}
