import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("hiring_manager_profiles")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Forbidden: Not a hiring manager" }, { status: 403 });
    }

    const body = await request.json();
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8000";

    const workerResponse = await fetch(`${workerUrl}/api/talentlens/rerank`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": session.user.id,
      },
      body: JSON.stringify(body),
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
