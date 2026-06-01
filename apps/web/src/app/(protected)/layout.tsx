import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LayoutClient } from "@/components/nav/layout-client";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Career Builder";
  const email = user.email || "";

  return (
    <LayoutClient displayName={displayName} email={email}>
      {children}
    </LayoutClient>
  );
}
