import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WORKER_URL = process.env.WORKER_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const workerRes = await fetch(`${WORKER_URL}/cv/tailor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_cv_context: body.full_cv_context,
        job_description: body.job_description,
        target_role: body.target_role,
      }),
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error in tailoring proxy pipeline." },
      { status: 500 }
    );
  }
}
