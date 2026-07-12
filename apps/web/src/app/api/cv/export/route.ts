import { NextResponse } from "next/server";
import { withApiAuthAndValidation } from "@/lib/api-middleware";
import { z } from "zod";

export const maxDuration = 60;

export const dynamic = "force-dynamic";

const WORKER_URL = process.env.WORKER_URL || "http://127.0.0.1:8000";

const ExportSchema = z.object({
  profile: z.record(z.any()),
  design_prefs: z.record(z.any()).optional().nullable(),
});

export async function POST(req: Request) {
  return withApiAuthAndValidation(req, ExportSchema, async (req, { token, parsedBody }) => {
    const workerRes = await fetch(`${WORKER_URL}/cv/export-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        profile: parsedBody.profile,
        design_prefs: parsedBody.design_prefs,
      }),
    });

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      return NextResponse.json(
        { error: errText || "Failed in PDF rendering worker." },
        { status: workerRes.status }
      );
    }

    const pdfBuffer = await workerRes.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=cv-ats-optimized.pdf",
        "Access-Control-Expose-Headers": "Content-Disposition",
      },
    });
  });
}
