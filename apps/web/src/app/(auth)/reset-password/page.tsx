"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Basic check to see if we have a hash fragment (which implies we arrived via a recovery link)
    if (!window.location.hash && !window.location.search.includes("code")) {
      // In Supabase Auth PKCE flow, the callback route exchanges the code for a session, 
      // then redirects here. So the user should already be signed in.
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) {
           setError("Invalid or expired password reset link.");
        }
      });
    }
  }, [supabase]);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({
      password: password
    });
    
    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="hv-auth-page flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl flex flex-col relative z-10">
        <h1 className="hv-auth-heading text-center">Update Password</h1>
        <p className="hv-auth-sub text-center mb-6">Enter your new secure password.</p>

        {error && (
          <div role="alert" className="hv-error-banner mb-4">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleUpdate} noValidate className="hv-form">
          <div className="hv-field">
            <label htmlFor="password">New Password</label>
            <Input id="password" type="password" placeholder="Min. 8 characters" autoComplete="new-password" required
              value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="hv-input" />
          </div>
          <div className="hv-field">
            <label htmlFor="confirm">Confirm Password</label>
            <Input id="confirm" type="password" placeholder="Repeat your password" autoComplete="new-password" required
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="hv-input" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="hv-btn-primary w-full mt-4"
          >
            {loading ? <><Loader2 className="animate-spin inline-block mr-2 w-4 h-4" />Updating...</> : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
