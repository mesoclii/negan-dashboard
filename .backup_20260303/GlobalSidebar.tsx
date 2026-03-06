"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/access", label: "Access" },
  { href: "/dashboard/ai", label: "AI" },
  { href: "/dashboard/economy", label: "Economy" },
  { href: "/dashboard/heist", label: "Heist" },
  { href: "/dashboard/security", label: "Security" },
  { href: "/dashboard/system-health", label: "System Health" },
  { href: "/dashboard/vip", label: "VIP" }
];

export default function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-3 text-sm font-semibold text-white">Navigation</p>
      <nav className="space-y-1">
        {LINKS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "block rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
                  : "block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
