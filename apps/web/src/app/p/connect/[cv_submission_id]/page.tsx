import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export default async function ConnectHubRedirectPage({
  params
}: {
  params: { cv_submission_id: string }
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Pass the intended destination so they return here after login
    redirect(`/login?next=/p/connect/${params.cv_submission_id}`);
  }

  // Initialize admin client to bypass RLS since the candidate doesn't own it yet
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // User is authenticated. Let's link the CV submission to their user ID if it isn't already.
  const { data: cvSubmission } = await supabaseAdmin
    .from("cv_submissions")
    .select("id, candidate_id")
    .eq("id", params.cv_submission_id)
    .single();

  if (cvSubmission && !cvSubmission.candidate_id) {
    // Link to the authenticated candidate
    await supabaseAdmin
      .from("cv_submissions")
      .update({ candidate_id: user.id })
      .eq("id", params.cv_submission_id);
  }

  // Redirect to the candidate ConnectHub dashboard
  redirect("/messages");
}
