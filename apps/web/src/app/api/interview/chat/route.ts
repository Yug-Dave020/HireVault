import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { personaId, currentStage, targetPosition, messageHistory, cvVariantId } = body;

    let cv_profile = {};

    if (cvVariantId) {
      const { data: variantData, error: variantErr } = await supabase
        .from("user_cv_variants")
        .select("cv_profile")
        .eq("id", cvVariantId)
        .single();
        
      if (!variantErr && variantData) {
        cv_profile = variantData.cv_profile;
      } else {
        console.error("Error fetching variant profile:", variantErr);
      }
    } else {
      // Fetch master profile for CV context fallback
      const { data: masterProfile, error: masterErr } = await supabase
        .from("user_profiles")
        .select("cv_profile")
        .eq("id", user.id)
        .single();

      if (masterErr && masterErr.code !== 'PGRST116') {
        console.error("Error fetching master profile:", masterErr);
      }
      cv_profile = masterProfile?.cv_profile || {};
    }

    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "http://127.0.0.1:8000";
    
    const workerRes = await fetch(`${workerUrl}/interview/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        persona_id: personaId,
        current_stage: currentStage,
        target_position: targetPosition,
        cv_profile: cv_profile,
        message_history: messageHistory
      })
    });

    if (!workerRes.ok) {
      const errorText = await workerRes.text();
      throw new Error(`Worker Error: ${errorText}`);
    }

    const aiData = await workerRes.json();
    return NextResponse.json(aiData);
  } catch (error: any) {
    console.error("API /interview/chat error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
