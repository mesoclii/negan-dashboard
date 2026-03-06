"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/access", label: "Access" },
  { href: "/dashboard/ai", label: "AI" },
  { href: "/dashboard/commands", label: "Commands" },
  { href: "/dashboard/custom-commands", label: "Custom Commands" },
  { href: "/dashboard/economy", label: "Economy" },
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
    ? "block rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
    : "block rounded-md border border-transparent px-3 py-2 text-sm text-zinc-300 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white";
}

export default function PossumSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Negan Bot</p>
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
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
    </aside>
  );
}
