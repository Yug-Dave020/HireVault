import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("hiring_manager_profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden: Not a hiring manager" }, { status: 403 });
    }

    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8000";
    const contentType = request.headers.get("content-type");

    const workerResponse = await fetch(`${workerUrl}/api/talentlens/upload-bulk`, {
      method: "POST",
      headers: {
        "x-user-id": user.id,
        ...(contentType ? { "content-type": contentType } : {})
      },
      body: request.body,
      // @ts-expect-error missing duplex option in types
      duplex: "half"
    });

    if (!workerResponse.ok) {
      const errorText = await workerResponse.text();
      return NextResponse.json({ error: errorText }, { status: workerResponse.status });
    }

    const data = await workerResponse.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
