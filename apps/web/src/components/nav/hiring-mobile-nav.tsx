"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Briefcase, Video, MessageSquare, LogOut, Menu, X } from "lucide-react";

export function HiringMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      href: "/hiring/dashboard",
      label: "Job Postings",
      icon: Briefcase,
    },
    {
      href: "/hiring/async-screen",
      label: "Async Screens",
      icon: Video,
    },
    {
      href: "/hiring/connecthub-preview",
      label: "Chat Preview",
      icon: MessageSquare,
    },
  ];

  return (
    <div className="md:hidden flex flex-col w-full bg-white border-b border-zinc-200 z-50 shrink-0">
      <div className="flex items-center justify-between px-6 h-16">
        <Link href="/hiring/dashboard" className="flex items-center gap-2">
          <img src="/logo-cropped.png" alt="HireVault" className="h-7 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-500 hover:text-zinc-900 p-2 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-zinc-200 shadow-xl overflow-y-auto max-h-[calc(100vh-4rem)] flex flex-col">
          <nav className="flex-col space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/hiring/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-md font-medium text-sm transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-zinc-200">
            <form action="/auth/signout" method="post">
              <button className="flex items-center gap-3 text-sm text-rose-600 hover:text-rose-700 font-medium w-full px-3 py-3 rounded-md hover:bg-rose-50 transition-colors">
                <LogOut className="h-5 w-5 shrink-0" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
