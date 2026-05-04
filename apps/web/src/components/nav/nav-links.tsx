// apps/web/src/components/nav/nav-links.tsx
"use client";

/**
 * NavLinks — Client Component so we can use usePathname() to apply
 * teal active styles to the current route link.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  readonly href: string;
  readonly label: string;
}

interface NavLinksProps {
  items: readonly NavItem[];
}

export function NavLinks({ items }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
      {items.map(({ href, label }) => {
        // Mark a link active if the pathname starts with its href
        const isActive = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "hv-nav-link",
              isActive && "hv-nav-link--active"
            )}
          >
            {label}
            {/* Teal underline bar for active link */}
            {isActive && <span className="hv-nav-underline" aria-hidden="true" />}
          </Link>
        );
      })}
    </nav>
  );
}
