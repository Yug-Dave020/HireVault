import { NextResponse } from "next/server";
import { withApiAuthAndValidation } from "@/lib/api-middleware";
import { z } from "zod";

export const maxDuration = 60;

export const dynamic = "force-dynamic";

const WORKER_URL = process.env.WORKER_URL || "http://127.0.0.1:8000";

const SuggestSchema = z.object({
  section_type: z.string(),
  current_text: z.string(),
  target_role: z.string().optional().nullable(),
  job_description: z.string().optional().nullable(),
  full_cv_context: z.record(z.any()).optional().nullable(),
});

export async function POST(req: Request) {
  return withApiAuthAndValidation(req, SuggestSchema, async (req, { token, parsedBody }) => {
    const workerRes = await fetch(`${WORKER_URL}/cv/suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(parsedBody),
    });

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      return NextResponse.json(
        { error: errText || "Failed in ATS suggestion worker." },
        { status: workerRes.status }
      );
    }

    const data = await workerRes.json();
    return NextResponse.json(data);
  });
}
