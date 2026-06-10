"use client";

import React, { useState } from "react";
import { Sidebar } from "./sidebar";

interface LayoutClientProps {
  displayName: string;
  email: string;
  children: React.ReactNode;
}

export function LayoutClient({ displayName, email, children }: LayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="flex bg-[#f4f5f6] h-screen overflow-hidden text-zinc-800 antialiased font-sans">
      <Sidebar
        displayName={displayName}
        email={email}
        isCollapsed={!isCollapsed}
        onToggle={() => setIsCollapsed(!isCollapsed)}
      />

      <div className="flex-grow flex flex-col h-full overflow-hidden transition-all duration-300 bg-white">
        <div className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
