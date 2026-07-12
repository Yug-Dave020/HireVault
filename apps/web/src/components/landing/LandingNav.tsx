"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "@supabase/supabase-js";

export function LandingNav({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-zinc-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center">
            <Image src="/logo-cropped.png" alt="HireVault" width={140} height={32} className="h-10 w-auto object-contain" />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-zinc-600">
          <Link href="#testimonials" className="hover:text-zinc-900 transition-colors">Testimonials</Link>
          <Link href="#templates" className="hover:text-zinc-900 transition-colors">Templates</Link>
          <Link href="#features" className="hover:text-zinc-900 transition-colors">Features</Link>
          <Link href="/hiring/login" className="hover:text-zinc-900 transition-colors font-semibold text-[#1da074]">For Employers</Link>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {user ? (
            <Link href="/dashboard" className="px-5 py-2 text-sm font-semibold bg-[#1da074] hover:bg-[#15805c] text-white rounded-lg transition-colors">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/hiring/login" className="px-3 sm:px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors whitespace-nowrap">
                Employers
              </Link>
              <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
                Log in
              </Link>
              <Link href="/signup" className="px-4 sm:px-5 py-2 text-sm font-semibold bg-[#1da074] hover:bg-[#15805c] text-white rounded-lg transition-colors whitespace-nowrap">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
