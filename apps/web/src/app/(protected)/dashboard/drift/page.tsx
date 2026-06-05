import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DriftClient } from "./DriftClient";

export const metadata = {
  title: "Live Job Description Drift Tracker — HireVault",
  description: "Track changes in job descriptions over time.",
};

export default async function DriftPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: snapshots } = await supabase
    .from("jd_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <DriftClient initialSnapshots={snapshots || []} userId={user.id} />;
}
