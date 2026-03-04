"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/access", label: "Access" },
  { href: "/dashboard/ai", label: "AI" },
  { href: "/dashboard/commands", label: "Command Studio" },
  { href: "/dashboard/economy", label: "Economy" },
  { href: "/dashboard/games", label: "Games" },
  { href: "/dashboard/giveaways", label: "Giveaways" },
  { href: "/dashboard/governance", label: "Governance" },
  { href: "/dashboard/gta-ops", label: "GTA Ops" },
  { href: "/dashboard/heist", label: "Heist" },
  { href: "/dashboard/roles", label: "Roles" },
  { href: "/dashboard/security", label: "Security" },
  { href: "/dashboard/system-health", label: "System Health" },
  { href: "/dashboard/vip", label: "VIP" }
];

function itemClass(active: boolean): string {
  return active
    ? "block rounded-md border border-red-500/60 bg-red-900/20 px-3 py-2 text-sm font-extrabold uppercase tracking-[0.05em] text-red-200 possum-glow-soft"
    : "block rounded-md border border-transparent px-3 py-2 text-sm font-bold uppercase tracking-[0.04em] text-red-300/85 hover:border-red-500/40 hover:bg-red-950/40 hover:text-red-200";
}

export default function PossumSidebar() {
  const pathname = usePathname();

  return (
    <div className="rounded-xl border possum-divider bg-black/55 p-4 possum-border">
      <div className="mb-4 border-b possum-divider pb-3">
        <p className="text-[11px] uppercase tracking-[0.24em] possum-soft">Possum Bot</p>
        <h2 className="mt-1 text-lg font-black uppercase tracking-[0.08em] possum-red possum-glow-soft">Dashboard</h2>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={itemClass(Boolean(active))}>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
