"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2, MailCheck } from "lucide-react";
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

/* Shared left panel — extracted to avoid duplication */
function AuthLeftPanel() {
  return (
    <div className="hv-auth-left">
      <ParticleCanvas />
      <div className="hv-auth-left-inner">
        <Image
          src="/logo.png"
          alt="HireVault Logo"
          width={160}
          height={36}
          className="h-12 w-auto object-contain"
          priority
        />
        <p className="hv-auth-tagline">
          AI that builds ATS-compliant CVs and masters interviews with our conversational AI trainer.
        </p>
        <div className="hv-stats-row">
          <StatCounter target={100} suffix="%" label="ATS compliance" />
          <div className="hv-stats-divider" />
          <StatCounter target={1200} suffix="+" label="CV variants built" />
          <div className="hv-stats-divider" />
          <StatCounter target={1500} suffix="+" label="Interviews completed" />
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  function validate(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email address.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    return null;
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    setSuccessEmail(email);
    setLoading(false);
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

  if (successEmail) {
    return (
      <div className="hv-auth-page">
        <div className="hv-auth-card">
          <AuthLeftPanel />
          <div className="hv-auth-right">
            <div className="hv-auth-form-wrap" style={{ textAlign: "center" }}>
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
              <h1 className="hv-auth-heading" style={{ textAlign: "center" }}>Check your email</h1>
              <p className="hv-auth-sub" style={{ textAlign: "center" }}>
                We sent a confirmation link to{" "}
                <strong style={{ color: "#0f1c2e" }}>{successEmail}</strong>.
                <br />Click it to activate your account.
              </p>
              <Link href="/login" className="hv-btn-primary" style={{ marginTop: "1.5rem" }}>
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hv-auth-page">
      <div className="hv-auth-card">

        <AuthLeftPanel />

        <div className="hv-auth-right">
          <div className="hv-auth-form-wrap">
            <h1 className="hv-auth-heading">Create your account</h1>
            <p className="hv-auth-sub">Start finding your perfect role in Europe</p>

            {error && (
              <div role="alert" className="hv-error-banner">
                <span>⚠</span> {error}
              </div>
            )}

            <form onSubmit={handleSignUp} noValidate className="hv-form">
              <div className="hv-field">
                <label htmlFor="full-name">Full name</label>
                <Input id="full-name" type="text" placeholder="Alex Müller" autoComplete="name" required
                  value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} className="hv-input" />
              </div>
              <div className="hv-field">
                <label htmlFor="signup-email">Email address</label>
                <Input id="signup-email" type="email" placeholder="you@example.com" autoComplete="email" required
                  value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="hv-input" />
              </div>
              <div className="hv-field">
                <label htmlFor="signup-password">Password</label>
                <Input id="signup-password" type="password" placeholder="Min. 8 characters" autoComplete="new-password" required
                  value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="hv-input" />
              </div>
              <div className="hv-field">
                <label htmlFor="confirm-password">Confirm password</label>
                <Input id="confirm-password" type="password" placeholder="Repeat your password" autoComplete="new-password" required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="hv-input" />
              </div>

              <button
                id="create-account-button"
                type="submit"
                disabled={loading}
                className="hv-btn-primary"
                style={{ marginTop: "0.25rem" }}
              >
                {loading
                  ? <><Loader2 style={{ marginRight: "0.5rem", width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />Creating account…</>
                  : "Create Account"}
              </button>
            </form>

            <div className="hv-divider"><span>or</span></div>

            <button id="google-signup-button" type="button" onClick={handleGoogleSignIn}
              disabled={loading || googleLoading} className="hv-btn-outline">
              {googleLoading
                ? <Loader2 style={{ marginRight: "0.5rem", width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} />
                : <GoogleIcon />}
              <span style={{ marginLeft: "0.5rem" }}>Continue with Google</span>
            </button>

            <p className="hv-auth-footer">
              Already have an account?{" "}
              <Link href="/login" className="hv-link">Sign in</Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
