"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, Video, User, LogOut, Menu, X, MessageSquare
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface MobileNavProps {
  displayName: string;
  email: string;
}

export function MobileNav({ displayName, email }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/cv",
      label: "CV Studio",
      icon: FileText,
    },
    {
      href: "/interview",
      label: "AI Interviewer",
      icon: Video,
    },
    {
      href: "/messages",
      label: "Employer Chats",
      icon: MessageSquare,
    },
    {
      href: "/profile",
      label: "My Profile",
      icon: User,
    },
  ];

  return (
    <div className="md:hidden flex flex-col w-full bg-slate-900 border-b border-slate-800 z-50 shrink-0">
      <div className="flex items-center justify-between px-4 h-16">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="HireVault Logo" width={140} height={32} className="h-8 w-auto object-contain" priority />
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-300 hover:text-white p-2 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 shadow-xl overflow-y-auto max-h-[calc(100vh-4rem)] flex flex-col">
          <nav className="flex-col space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-[#1da074]/15 text-emerald-400"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold uppercase shrink-0">
                {displayName.charAt(0) || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-all w-full text-left"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
