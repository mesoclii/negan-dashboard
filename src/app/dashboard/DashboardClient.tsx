"use client";

import Link from "next/link";

type Card = {
  href: string;
  title: string;
  description: string;
};

const CARDS: Card[] = [
  { href: "/dashboard/automations", title: "Automations", description: "Bot automation list, limits, and runtime state." },
  { href: "/dashboard/automations/studio", title: "Automation Studio", description: "Visual trigger/condition/action flow builder." },
  { href: "/dashboard/commands", title: "Command Studio", description: "Custom command engine and command toggles." },
  { href: "/dashboard/tickets", title: "Tickets", description: "Support ticket engine controls." },
  { href: "/dashboard/selfroles", title: "Selfroles", description: "Self-role panel configuration and role mapping." },
  { href: "/dashboard/invite-tracker", title: "Invite Tracker", description: "Invite tracking tiers and command behavior." },
  { href: "/dashboard/tts", title: "TTS", description: "Voice route and TTS runtime control." },
  { href: "/dashboard/economy/store", title: "Store", description: "Catalog, prices, stock, and role grants." },
  { href: "/dashboard/economy/progression", title: "Progression", description: "XP/coins progression and reward rules." },
  { href: "/dashboard/economy/radio-birthday", title: "Birthdays", description: "Birthday engine settings and reward flow." },
  { href: "/dashboard/giveaways", title: "Giveaways", description: "Giveaway lifecycle, entrants, rerolls, and controls." },
  { href: "/dashboard/heist", title: "Heist", description: "Heist signup engine controls." },
  { href: "/dashboard/gta-ops", title: "GTA Ops", description: "GTA operations entity, separate from Heist." },
  { href: "/dashboard/crew", title: "Crew", description: "Crew create/join/leave/vault controls." },
  { href: "/dashboard/dominion", title: "Dominion", description: "Dominion raid/alliance/war settings." },
  { href: "/dashboard/contracts", title: "Contracts", description: "Contract progression and rewards." },
  { href: "/dashboard/profile", title: "Profile", description: "Profile, rank, and rep controls." },
  { href: "/dashboard/halloffame", title: "Hall of Fame", description: "Hall of fame display and rules." },
  { href: "/dashboard/achievements", title: "Achievements", description: "Achievements panel and command behavior." },
  { href: "/dashboard/loyalty", title: "Loyalty", description: "Tenure sync and loyalty processing." },
  { href: "/dashboard/catdrop", title: "Cat Drop", description: "Cat spawn/catch and drop tuning." },
  { href: "/dashboard/rarespawn", title: "Rare Spawn", description: "Rare event spawn/claim settings." },
  { href: "/dashboard/range", title: "Range", description: "Range game interactions and limits." },
  { href: "/dashboard/truthdare", title: "Truth Dare", description: "Truth/Dare game flow controls." },
  { href: "/dashboard/governance", title: "Governance", description: "Governance state and enforcement controls." },
  { href: "/dashboard/security", title: "Security", description: "Security stack, moderation, and policies." },
  { href: "/dashboard/blacklist", title: "Blacklist", description: "Blacklist add/remove/show control." },
  { href: "/dashboard/failsafe", title: "Failsafe", description: "Emergency pause and safety switches." },
  { href: "/dashboard/panels", title: "Panel Deploy", description: "Bulk panel deploy and status." },
  { href: "/dashboard/panel", title: "Master Panel", description: "Master panel command routing." },
  { href: "/dashboard/runtime-router", title: "Runtime Router", description: "Gun/possum/vip runtime routing controls." },
  { href: "/dashboard/jed", title: "Jed", description: "Sticker/emote/gif steal and deploy engine." },
  { href: "/dashboard/system-health", title: "System Health", description: "Runtime monitor, drift and health checks." },
  { href: "/dashboard/vip", title: "VIP", description: "VIP tiers, grants, and expiry sync." }
];

export default function DashboardClient() {
  return (
    <section className="space-y-5">
      <header className="rounded-xl border possum-divider bg-black/50 p-5 possum-border">
        <p className="text-xs uppercase tracking-[0.22em] possum-soft">Negan Control</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] possum-red possum-glow">Guild Dashboard</h2>
        <p className="mt-2 text-sm text-red-200/80">
          Every engine is exposed directly. No hub-gating required.
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
