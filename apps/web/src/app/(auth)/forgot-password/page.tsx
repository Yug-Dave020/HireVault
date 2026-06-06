"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="hv-auth-page flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl flex flex-col items-center relative z-10">
          <div style={{
            margin: "0 auto 1.25rem",
            width: "4rem", height: "4rem",
            borderRadius: "50%",
            background: "rgba(29,158,117,0.1)",
            border: "1px solid rgba(29,158,117,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MailCheck style={{ width: "2rem", height: "2rem", color: "var(--hv-teal)" }} />
          </div>
          <h1 className="hv-auth-heading text-center">Check your email</h1>
          <p className="hv-auth-sub text-center">
            We sent a password reset link to <strong style={{ color: "#0f1c2e" }}>{email}</strong>.
          </p>
          <Link href="/login" className="hv-btn-primary mt-6 w-full text-center block">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hv-auth-page flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl flex flex-col relative z-10">
        <h1 className="hv-auth-heading text-center">Forgot Password</h1>
        <p className="hv-auth-sub text-center mb-6">Enter your email to receive a reset link.</p>

        {error && (
          <div role="alert" className="hv-error-banner mb-4">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleReset} noValidate className="hv-form">
          <div className="hv-field">
            <label htmlFor="email">Email address</label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" required
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="hv-input" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hv-btn-primary w-full mt-4"
          >
            {loading ? <><Loader2 className="animate-spin inline-block mr-2 w-4 h-4" />Sending...</> : "Send Reset Link"}
          </button>
        </form>

        <p className="hv-auth-footer mt-6 text-center">
          Remembered your password?{" "}
          <Link href="/login" className="hv-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
