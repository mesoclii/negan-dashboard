"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/bot-personalizer", label: "Bot Personalizer" },
  { href: "/dashboard/ai/learning", label: "Possum AI" },
  { href: "/dashboard/ai/persona", label: "Persona AI" },
  { href: "/dashboard/automations/studio", label: "Automation Studio" },
  { href: "/dashboard/commands", label: "Command Studio" },
  { href: "/dashboard/tickets", label: "Tickets" },
  { href: "/dashboard/selfroles", label: "Selfroles" },
  { href: "/dashboard/invite-tracker", label: "Invite Tracker" },
  { href: "/dashboard/tts", label: "TTS" },
  { href: "/dashboard/economy", label: "Economy" },
  { href: "/dashboard/games", label: "Games" },
  { href: "/dashboard/pokemon-catching", label: "Pokemon Catching" },
  { href: "/dashboard/pokemon-battle", label: "Pokemon Battle" },
  { href: "/dashboard/pokemon-trade", label: "Pokemon Trade" },
  { href: "/dashboard/heist", label: "Heist" },
  { href: "/dashboard/gta-ops", label: "GTA Ops" },
  { href: "/dashboard/panels", label: "Panel Deploy" },
  { href: "/dashboard/panel", label: "Master Panel" },
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
