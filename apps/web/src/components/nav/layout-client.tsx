"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface LayoutClientProps {
  displayName: string;
  email: string;
  children: React.ReactNode;
}

export function LayoutClient({ displayName, email, children }: LayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="flex flex-col md:flex-row bg-[#f4f5f6] h-screen overflow-hidden text-zinc-800 antialiased font-sans">
      <MobileNav displayName={displayName} email={email} />
      <div className="hidden md:flex shrink-0">
        <Sidebar
          displayName={displayName}
          email={email}
          isCollapsed={!isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      <div className="flex-grow flex flex-col h-full overflow-hidden transition-all duration-300 bg-white">
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
