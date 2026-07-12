import { NextResponse } from "next/server";
import { withApiAuthAndValidation } from "@/lib/api-middleware";

export const maxDuration = 60;

export const dynamic = "force-dynamic";

const WORKER_URL = process.env.WORKER_URL || "http://127.0.0.1:8000";

export async function POST(req: Request) {
  return withApiAuthAndValidation(req, null, async (req, { token }) => {
    const { searchParams } = new URL(req.url);
    const isInit = searchParams.get("init") === "true";

    if (isInit) {
      // Call empty profile builder
      const workerRes = await fetch(`${WORKER_URL}/cv/init`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!workerRes.ok) {
        throw new Error("Worker failed to initialize CV profile.");
      }

      const data = await workerRes.json();
      return NextResponse.json(data);
    }

    // Otherwise, we have a file upload for parsing
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    // Forward file upload to worker using FormData
    const workerFormData = new FormData();
    workerFormData.append("file", file);

    const workerRes = await fetch(`${WORKER_URL}/cv/parse`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: workerFormData,
    });

    if (!workerRes.ok) {
      const errText = await workerRes.text();
      return NextResponse.json(
        { error: errText || "Failed in parser worker execution." },
        { status: workerRes.status }
      );
    }

    const data = await workerRes.json();
    return NextResponse.json(data);
  });
}
