// apps/web/src/components/nav/user-nav.tsx
"use client";

/**
 * UserNav — avatar dropdown + notification bell.
 * Client Component: sign-out requires the browser Supabase client.
 */

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Bell } from "lucide-react";

interface UserNavProps {
  displayName: string;
  email: string;
}

export function UserNav({ displayName, email }: UserNavProps) {
  const router   = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {/* Notification bell — UI only, no functionality yet */}
      <button
        aria-label="Notifications"
        className="relative rounded-full p-1.5 text-slate-400 hover:text-[var(--hv-teal)] hover:bg-[#1d9e7510] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hv-teal)]"
      >
        <Bell className="h-5 w-5" />
      </button>

      {/* Avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          id="user-avatar-button"
          className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hv-teal)] focus-visible:ring-offset-2 transition-opacity hover:opacity-80"
          aria-label="Open user menu"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[var(--hv-teal)] text-white text-xs font-bold">
              {initials || <User className="h-4 w-4" />}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-0.5">
              <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            id="sign-out-menu-item"
            onClick={handleSignOut}
            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
