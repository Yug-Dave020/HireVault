"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Video, User, LogOut, ChevronLeft, ChevronRight
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  displayName: string;
  email: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ displayName, email, isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      activeClass: "bg-indigo-50 text-indigo-600 font-bold",
      iconClass: "text-indigo-600"
    },
    {
      href: "/cv",
      label: "CV Studio",
      icon: FileText,
      activeClass: "bg-emerald-50 text-emerald-600 font-bold",
      iconClass: "text-emerald-600"
    },
    {
      href: "/interview",
      label: "AI Interviewer",
      icon: Video,
      activeClass: "bg-purple-50 text-purple-600 font-bold",
      iconClass: "text-purple-600"
    },
    {
      href: "/profile",
      label: "My Profile",
      icon: User,
      activeClass: "bg-teal-50 text-teal-600 font-bold",
      iconClass: "text-teal-600"
    },
  ];

  return (
    <aside className={`${isCollapsed ? "w-20 px-2" : "w-64 p-4"} bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 shrink-0 h-screen sticky top-0 z-40 transition-all duration-300`}>
      <div className="space-y-6">

        {/* Branding & Header Section */}
        <div className={`flex ${isCollapsed ? "flex-col items-center space-y-3 justify-center w-full" : "items-center justify-between px-2"}`}>
          {!isCollapsed ? (
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-8 w-8 shrink-0">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <rect width="100" height="100" rx="30" fill="#1da074" />
                  <rect x="18" y="34" width="64" height="46" rx="10" stroke="white" strokeWidth="8" strokeLinejoin="round" />
                  <path d="M36 34V22C36 17.5 39.5 14 44 14H56C60.5 14 64 17.5 64 22V34" stroke="white" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
                  <path d="M36 34V80" stroke="white" strokeWidth="8" strokeLinecap="round" />
                  <path d="M64 34V80" stroke="white" strokeWidth="8" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-[15px] font-black tracking-tight text-white leading-none">HireVault</span>
            </Link>
          ) : (
            <Link href="/dashboard" className="h-8 w-8 shrink-0 block">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                <rect width="100" height="100" rx="30" fill="#1da074" />
                <rect x="18" y="34" width="64" height="46" rx="10" stroke="white" strokeWidth="8" strokeLinejoin="round" />
                <path d="M36 34V22C36 17.5 39.5 14 44 14H56C60.5 14 64 17.5 64 22V34" stroke="white" strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M36 34V80" stroke="white" strokeWidth="8" strokeLinecap="round" />
                <path d="M64 34V80" stroke="white" strokeWidth="8" strokeLinecap="round" />
              </svg>
            </Link>
          )}

          {/* Corrected Toggle Button Positioning Container */}
          <button
            onClick={onToggle}
            className={`p-1.5 rounded-lg border border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${isCollapsed ? "w-9 h-9 flex items-center justify-center mx-auto" : "ml-auto"
              }`}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Top Dark Divider Line */}
        <div className="h-px bg-slate-800 w-full" />

        {/* Navigation Link Loop Area */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                  ? "bg-[#1da074]/15 text-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                title={item.label}
              >
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-all w-full text-left"
          title="Sign Out"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>

        {/* Bottom Dark Divider Line */}
        <div className="h-px bg-slate-800 w-full" />

        {/* User Card Metadata Frame */}
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold uppercase shrink-0">
            {displayName.charAt(0) || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-500 truncate">{email}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
