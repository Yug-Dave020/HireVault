import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RedTeamClient } from "./RedTeamClient";

export const metadata = {
  title: "Red Team Resume — HireVault",
  description: "Adversarial resume stress test",
};

export default async function RedTeamPage() {
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
        <p className="text-zinc-500 mt-2">Please create a CV variant in the dashboard first to perform Red Teaming.</p>
      </div>
    );
  }

  const cvId = variants[0].id;

  return <RedTeamClient cvId={cvId} />;
}
