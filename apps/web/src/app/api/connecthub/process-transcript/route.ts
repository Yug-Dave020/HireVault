import { NextResponse } from "next/server";
import { withApiAuthAndValidation } from "@/lib/api-middleware";

export const dynamic = "force-dynamic";

const WORKER_URL = process.env.WORKER_URL || "http://127.0.0.1:8000";

export async function POST(req: Request) {
  return withApiAuthAndValidation(req, null, async (req, { token }) => {
    try {
      const body = await req.json();

      const workerRes = await fetch(`${WORKER_URL}/connecthub/process-transcript`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!workerRes.ok) {
        const errText = await workerRes.text();
        return NextResponse.json(
          { error: errText || "Failed to process transcript in worker." },
          { status: workerRes.status }
        );
      }

      const data = await workerRes.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error("[process-transcript] Error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  });
}
