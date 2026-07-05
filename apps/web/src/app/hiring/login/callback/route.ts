import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from("hiring_manager_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Create profile
        await supabase.from("hiring_manager_profiles").insert({
          id: user.id,
          company_name: "My Company", // Default, could be updated later
        });
      }
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/hiring/dashboard`);
}
