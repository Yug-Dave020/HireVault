import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiAuthAndValidation } from "@/lib/api-middleware";
import { z } from "zod";

export const maxDuration = 60;

const ChatSchema = z.object({
  personaId: z.string(),
  currentStage: z.string(),
  targetPosition: z.string(),
  messageHistory: z.array(z.any()), // keep it flexible for now, or refine
  cvVariantId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  return withApiAuthAndValidation(req, ChatSchema, async (req, { user, token, parsedBody }) => {
    const supabase = await createClient();
    const { personaId, currentStage, targetPosition, messageHistory, cvVariantId } = parsedBody;

    let cv_profile = {};

    if (cvVariantId) {
      const { data: variantData, error: variantErr } = await supabase
        .from("user_cv_variants")
        .select("cv_profile")
        .eq("id", cvVariantId)
        // Explicitly scoping to user for IDOR double check
        .eq("user_id", user.id)
        .single();
        
      if (!variantErr && variantData) {
        cv_profile = variantData.cv_profile;
      } else {
        console.error("Error fetching variant profile:", variantErr);
      }
    } else {
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
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
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
  });
}
