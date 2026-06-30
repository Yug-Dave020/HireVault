"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Image from "next/image";

export default function HiringLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/hiring/login/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/hiring/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!email || !password) {
      setError("Please enter both email and password to sign up.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/hiring/login/callback`,
        }
      });
      if (error) throw error;
      setSuccess("Check your email for the confirmation link.");
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-zinc-200/60 p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="mb-6">
            <Image src="/logo-cropped.png" alt="HireVault" width={180} height={40} className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Hiring Manager Portal</h1>
          <p className="text-zinc-500 mt-2 text-sm">Access strictly required for authorized personnel.</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 text-center border border-green-100">
            {success}
          </div>
        )}

        <div className="space-y-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="manager@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1da074] focus:border-transparent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1da074] focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button 
                type="submit"
                className="flex-1 h-11 bg-[#1da074] hover:bg-[#15805c] text-white shadow-sm"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
              </Button>
              <Button 
                type="button"
                variant="outline"
                className="flex-1 h-11 border-zinc-200 hover:bg-zinc-50 text-zinc-800"
                onClick={handleEmailSignUp}
                disabled={loading}
              >
                Sign Up
              </Button>
            </div>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <Button 
            type="button"
            className="w-full h-11 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-sm"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
            )}
            Google
          </Button>
          
          <div className="text-center mt-6">
            <p className="text-xs text-zinc-400">
              Only authorized company domains are allowed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
