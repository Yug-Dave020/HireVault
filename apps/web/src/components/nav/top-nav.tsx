// apps/web/src/components/nav/top-nav.tsx
/**
 * TopNav — Server Component.
 * Active link detection requires the pathname, which is only available
 * in a Client Component. We pass the nav links down to NavLinks (client)
 * which uses usePathname() to apply the teal active style.
 */

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Briefcase } from "lucide-react";
import { UserNav } from "./user-nav";
import { NavLinks } from "./nav-links";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cv",        label: "My CVs" },
  { href: "/profile",   label: "My Profile" },
] as const;

export async function TopNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const displayName =
    profile?.full_name ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "User";

  const email = user?.email ?? "";

  return (
    <header className="hv-topnav">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="hv-nav-logo" aria-label="HireVault home">
          <Image
            src="/logo-dark.png"
            alt="HireVault Logo"
            width={160}
            height={36}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>

        {/* Nav links (client component — needs usePathname) */}
        <NavLinks items={NAV_ITEMS} />

        {/* Right side: bell + avatar */}
        <UserNav displayName={displayName} email={email} />
      </div>
    </header>
  );
}
