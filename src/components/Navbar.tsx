/**
 * @fileoverview Bottom navigation bar for mobile.
 * Fixed position, glass background, icon + text labels.
 * Active state with gradient indicator.
 */

"use client";


import Link from "next/link";
import React, { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", icon: "🏠", label: "Home" },
  { href: "/journal", icon: "📝", label: "Journal" },
  { href: "/mood", icon: "🎭", label: "Mood" },
  { href: "/companion", icon: "💬", label: "Companion" },
  { href: "/insights", icon: "📊", label: "Insights" },
  { href: "/mindfulness", icon: "🧘", label: "Mindful" },
];

/**
 * Bottom navigation with icon + text labels.
 * Active route highlighted with gradient underline.
 */
export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "nav-item--active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
