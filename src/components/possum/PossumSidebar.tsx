"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard/ai", label: "AI" },
  { href: "/dashboard/automations", label: "Automations" },
  { href: "/dashboard/automations/studio", label: "Automation Studio" },
  { href: "/dashboard/commands", label: "Command Studio" },
  { href: "/dashboard/tickets", label: "Tickets" },
  { href: "/dashboard/selfroles", label: "Selfroles" },
  { href: "/dashboard/invite-tracker", label: "Invite Tracker" },
  { href: "/dashboard/tts", label: "TTS" },
  { href: "/dashboard/economy", label: "Economy" },
  { href: "/dashboard/economy/store", label: "Store" },
  { href: "/dashboard/economy/progression", label: "Progression" },
  { href: "/dashboard/prestige", label: "Prestige" },
  { href: "/dashboard/economy/radio-birthday", label: "Birthdays" },
  { href: "/dashboard/giveaways", label: "Giveaways" },
  { href: "/dashboard/gta-ops", label: "GTA Ops" },
  { href: "/dashboard/heist", label: "Heist" },
  { href: "/dashboard/crew", label: "Crew" },
  { href: "/dashboard/dominion", label: "Dominion" },
  { href: "/dashboard/contracts", label: "Contracts" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/halloffame", label: "Hall of Fame" },
  { href: "/dashboard/achievements", label: "Achievements" },
  { href: "/dashboard/loyalty", label: "Loyalty" },
  { href: "/dashboard/catdrop", label: "Cat Drop" },
  { href: "/dashboard/rarespawn", label: "Rare Spawn" },
  { href: "/dashboard/range", label: "Range" },
  { href: "/dashboard/truthdare", label: "Truth Dare" },
  { href: "/dashboard/pokemon-stage2", label: "Pokemon Stage2" },
  { href: "/dashboard/pokemon-battle", label: "Pokemon Battle" },
  { href: "/dashboard/pokemon-trade", label: "Pokemon Trade" },
  { href: "/dashboard/event-reactor", label: "Event Reactor" },
  { href: "/dashboard/governance", label: "Governance" },
  { href: "/dashboard/security", label: "Security" },
  { href: "/dashboard/security-enforcer", label: "Security Enforcer" },
  { href: "/dashboard/blacklist", label: "Blacklist" },
  { href: "/dashboard/failsafe", label: "Failsafe" },
  { href: "/dashboard/panels", label: "Panels" },
  { href: "/dashboard/panel", label: "Master Panel" },
  { href: "/dashboard/runtime-router", label: "Runtime Router" },
  { href: "/dashboard/jed", label: "Jed" },
  { href: "/dashboard/system-health", label: "System Health" },
  { href: "/dashboard/vip", label: "VIP" },
  { href: "/dashboard/vip/loyalty", label: "VIP Loyalty" }
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
        <p className="text-[11px] uppercase tracking-[0.24em] possum-soft">Negan Bot</p>
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
