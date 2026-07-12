import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LogOut, Briefcase, Video, MessageSquare } from "lucide-react";
import { HiringMobileNav } from "@/components/nav/hiring-mobile-nav";

export default async function HiringLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Conditionally render the shell layout only for authenticated users.
  // Unauthenticated users (e.g., on the login page) will just render children.

  if (!user) {
    return <>{children}</>;
  }

  // Check if hiring manager profile exists
  const { data: profile } = await supabase
    .from("hiring_manager_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // If logged in but no profile, and not on login page, redirect to login
    // Let the login page handle the profile creation
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-zinc-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200">
          <Link href="/hiring/dashboard" className="flex items-center gap-2">
            <img src="/logo-cropped.png" alt="HireVault" className="h-8 w-auto object-contain" />
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/hiring/dashboard" className="flex items-center gap-3 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-md font-medium text-sm">
            <Briefcase className="h-4 w-4" />
            Job Postings
          </Link>
          <Link href="/hiring/async-screen" className="flex items-center gap-3 px-3 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-md font-medium text-sm">
            <Video className="h-4 w-4" />
            Async Screens
          </Link>
          <Link href="/hiring/connecthub-preview" className="flex items-center gap-3 px-3 py-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-md font-medium text-sm">
            <MessageSquare className="h-4 w-4" />
            Chat Preview
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-200">
          <form action="/auth/signout" method="post">
            <button className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 font-medium w-full px-3 py-2 rounded-md hover:bg-zinc-100 transition-colors">
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <HiringMobileNav />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
