import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiRateLimiter } from "./ratelimit";
import { z } from "zod";

type HandlerWithAuth<T> = (
  req: Request,
  context: {
    user: any;
    token: string;
    parsedBody: T;
  }
) => Promise<NextResponse>;

export async function withApiAuthAndValidation<T>(
  req: Request,
  schema: z.ZodType<T> | null,
  handler: HandlerWithAuth<T>
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limiting (by user ID) - Using AI rate limiter for these specific endpoints
    const { success, reset } = await aiRateLimiter.limit(user.id);
    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        { error: "Too Many Requests" }, 
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }

    let parsedBody: any = null;
    if (schema) {
      try {
        const body = await req.json();
        parsedBody = schema.parse(body);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return NextResponse.json({ error: "Invalid payload", details: err.errors }, { status: 400 });
        }
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      }
    }

    return await handler(req, {
      user: user,
      token: session?.access_token || "",
      parsedBody,
    });
  } catch (error: any) {
    console.error("API Middleware Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
