import { NextResponse } from "next/server";
import { withApiAuthAndValidation } from "@/lib/api-middleware";
import { z } from "zod";

export const dynamic = "force-dynamic";

const WORKER_URL = process.env.WORKER_URL || "http://127.0.0.1:8000";

const TailorSchema = z.object({
  full_cv_context: z.record(z.any()),
  job_description: z.string(),
  target_role: z.string(),
});

export async function POST(req: Request) {
  return withApiAuthAndValidation(req, TailorSchema, async (req, { token, parsedBody }) => {
    const workerRes = await fetch(`${WORKER_URL}/cv/tailor`, {
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
        { error: errText || "Failed in ATS tailoring worker." },
        { status: workerRes.status }
      );
    }

    const data = await workerRes.json();
    return NextResponse.json(data);
  });
}
