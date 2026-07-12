import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("hiring_manager_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden: Not a hiring manager" }, { status: 403 });
    }

    const { cv_submission_id, job_posting_id } = await request.json();

    if (!cv_submission_id || !job_posting_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // We use the regular client to verify read access (which enforces RLS)
    // If the HM cannot read the job posting, they don't own it.
    const { data: jobAccess, error: jobAccessError } = await supabase
      .from("job_postings")
      .select("id")
      .eq("id", job_posting_id)
      .single();

    if (jobAccessError || !jobAccess) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this job posting." }, { status: 403 });
    }

    // Initialize admin client to bypass INSERT RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Ensure a conversation exists
    const { data: existingConv, error: convError } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("job_posting_id", job_posting_id)
      .eq("cv_submission_id", cv_submission_id)
      .maybeSingle();
      
    let conversation = existingConv;

    if (convError) throw convError;

    if (!conversation) {
      const { data: newConv, error: insertConvError } = await supabaseAdmin
        .from("conversations")
        .insert({
          job_posting_id,
          hiring_manager_id: profile.id,
          cv_submission_id,
          status: 'active'
        })
        .select()
        .single();
      
      if (insertConvError) throw insertConvError;
      conversation = newConv;
    }

    // 2. Ensure an async video screen request exists
    const { data: existingVideo, error: videoError } = await supabaseAdmin
      .from("async_video_screens")
      .select("*")
      .eq("cv_submission_id", cv_submission_id)
      .maybeSingle();
      
    let videoScreen = existingVideo;
    
    if (videoError) throw videoError;

    if (!videoScreen) {
      const { data: newVideoScreen, error: insertVideoError } = await supabaseAdmin
        .from("async_video_screens")
        .insert({
          cv_submission_id,
          status: 'pending'
        })
        .select()
        .single();
      
      if (insertVideoError) throw insertVideoError;
      videoScreen = newVideoScreen;
    }

    // 3. Generate Link
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const link = `${protocol}://${host}/p/connect/${cv_submission_id}`;

    // Return candidate email so frontend can construct mailto
    const { data: cvSubmission } = await supabase
      .from("cv_submissions")
      .select("parsed_json")
      .eq("id", cv_submission_id)
      .single();
    
    const candidateEmail = cvSubmission?.parsed_json?.email;

    return NextResponse.json({ link, conversation, videoScreen, candidateEmail });
  } catch (error: any) {
    console.error("Connect API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
