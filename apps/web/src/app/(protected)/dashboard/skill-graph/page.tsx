import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SkillGraphClient } from "./SkillGraphClient";

export const metadata = {
  title: "Cross-Resume Skill Topology — HireVault",
  description: "Visualize your skills across different CV variants.",
};

export default async function SkillGraphPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SkillGraphClient userId={user.id} />;
}
