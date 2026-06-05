import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NegotiateClient } from "./NegotiateClient";

export const metadata = {
  title: "Offer Negotiation Simulator — HireVault",
  description: "Roleplay salary negotiations with an AI recruiter.",
};

export default async function NegotiatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <NegotiateClient userId={user.id} />;
}
