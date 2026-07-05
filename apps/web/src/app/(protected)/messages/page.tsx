import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MessagesClient } from "./MessagesClient";

export default async function CandidateMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch candidate's conversations
  const { data: conversationsData } = await supabase
    .from("conversations")
    .select(`
      id,
      job_posting_id,
      cv_submission_id,
      status,
      created_at,
      job_postings (
        title,
        company_name,
        location,
        employment_type,
        hiring_manager_id
      )
    `)
    .order("created_at", { ascending: false });

  const conversations = conversationsData || [];

  // Fetch associated async video screens
  const cvSubmissionIds = conversations.map(c => c.cv_submission_id);
  
  let videoScreens: any[] = [];
  if (cvSubmissionIds.length > 0) {
    const { data: vsData } = await supabase
      .from("async_video_screens")
      .select("*")
      .in("cv_submission_id", cvSubmissionIds);
      
    if (vsData) videoScreens = vsData;
  }

  return (
    <MessagesClient 
      conversations={conversations} 
      videoScreens={videoScreens}
      currentUserId={user.id}
    />
  );
}
