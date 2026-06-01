import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WORKER_URL = process.env.WORKER_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const workerRes = await fetch(`${WORKER_URL}/cv/export-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        profile: body.profile,
        design_prefs: body.design_prefs,
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error in PDF export pipeline." },
      { status: 500 }
    );
  }
}
