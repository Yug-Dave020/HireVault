"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { ParticleCanvas } from "@/components/auth/particle-canvas";
import { StatCounter } from "@/components/auth/stat-counter";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
    });
    if (authError) { setError(authError.message); setGoogleLoading(false); }
  }

  return (
    /* Full-page dark backdrop */
    <div className="hv-auth-page">
      {/* Floating modal card */}
      <div className="hv-auth-card">

        <div className="hv-auth-left">
          <ParticleCanvas />
          <div className="hv-auth-left-inner">
            {/* Logo */}
            <Image
              src="/logo.png"
              alt="HireVault Logo"
              width={160}
              height={36}
              className="h-12 w-auto object-contain"
              priority
            />

            {/* Tagline */}
            <p className="hv-auth-tagline">
              AI that builds ATS-compliant CVs and masters interviews with our conversational AI trainer.
            </p>

            {/* Animated stats */}
            <div className="hv-stats-row">
              <StatCounter target={100} suffix="%" label="ATS compliance" />
              <div className="hv-stats-divider" />
              <StatCounter target={1200} suffix="+" label="CV variants built" />
              <div className="hv-stats-divider" />
              <StatCounter target={1500} suffix="+" label="Interviews completed" />
            </div>
          </div>
        </div>

        <div className="hv-auth-right">
          <div className="hv-auth-form-wrap">
            <h1 className="hv-auth-heading">Welcome back</h1>
            <p className="hv-auth-sub">Sign in to your job intelligence platform</p>

            {error && (
              <div role="alert" className="hv-error-banner">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSignIn} noValidate className="hv-form">
              <div className="hv-field">
                <label htmlFor="login-email">Email address</label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || googleLoading}
                  className="hv-input"
                />
              </div>
              <div className="hv-field">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <label htmlFor="login-password">Password</label>
                  <Link href="/forgot-password" style={{ fontSize: "13px", color: "#1da074", textDecoration: "none" }}>Forgot Password?</Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || googleLoading}
                  className="hv-input"
                />
              </div>

              <button
                id="sign-in-button"
                type="submit"
                disabled={loading || googleLoading}
                className="hv-btn-primary"
                style={{ marginTop: "0.25rem" }}
              >
                {loading
                  ? <><Loader2 style={{ marginRight: "0.5rem", width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />Signing in…</>
                  : "Sign In"}
              </button>
            </form>

            <div className="hv-divider"><span>or</span></div>

            <button
              id="google-sign-in-button"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="hv-btn-outline"
            >
              {googleLoading
                ? <Loader2 style={{ marginRight: "0.5rem", width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                : <GoogleIcon />}
              <span style={{ marginLeft: "0.5rem" }}>Continue with Google</span>
            </button>

            <p className="hv-auth-footer">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="hv-link">Sign up</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
