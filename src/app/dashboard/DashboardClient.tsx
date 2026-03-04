"use client";

import Link from "next/link";

type Card = {
  href: string;
  title: string;
  description: string;
};

const CARDS: Card[] = [
  { href: "/dashboard/access", title: "Access", description: "Roles, selfroles, tickets, and TTS controls." },
  { href: "/dashboard/ai", title: "AI", description: "Persona, tone, and memory configuration." },
  { href: "/dashboard/commands", title: "Command Studio", description: "Custom command studio settings." },
  { href: "/dashboard/economy", title: "Economy", description: "Store, progression, and currency systems." },
  { href: "/dashboard/games", title: "Games", description: "Rare drops, cat drops, Pokemon private features, and progression toggles." },
  { href: "/dashboard/giveaways", title: "Giveaways", description: "Giveaway runtime, templates, limits, and anti-abuse controls." },
  { href: "/dashboard/governance", title: "Governance", description: "Policy and governance tooling." },
  { href: "/dashboard/gta-ops", title: "GTA Ops", description: "GTA-specific operation controls." },
  { href: "/dashboard/heist", title: "Heist", description: "Heist signup and operation engine controls." },
  { href: "/dashboard/roles", title: "Roles", description: "Role-related dashboard actions." },
  { href: "/dashboard/security", title: "Security", description: "Moderation, access control, and safety engines." },
  { href: "/dashboard/system-health", title: "System Health", description: "Runtime and health monitoring." },
  { href: "/dashboard/vip", title: "VIP", description: "VIP tiers and role sync settings." }
];

export default function DashboardClient() {
  return (
    <section className="space-y-5">
      <header className="rounded-xl border possum-divider bg-black/50 p-5 possum-border">
        <p className="text-xs uppercase tracking-[0.22em] possum-soft">Possum Control</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] possum-red possum-glow">Guild Dashboard</h2>
        <p className="mt-2 text-sm text-red-200/80">
          Baseline/stock policy is enforced automatically. Open any module to manage server behavior.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border possum-divider bg-black/45 p-4 transition hover:bg-black/65 possum-border"
          >
            <h3 className="text-base font-extrabold uppercase tracking-[0.06em] possum-red">{card.title}</h3>
            <p className="mt-1 text-sm text-red-200/75">{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
