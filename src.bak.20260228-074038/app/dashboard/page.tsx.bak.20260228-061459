"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Card = {
  title: string;
  desc: string;
  href: string;
};

function withGuild(href: string, guildId: string) {
  if (!guildId) return href;
  const glue = href.includes("?") ? "&" : "?";
  return `${href}${glue}guildId=${encodeURIComponent(guildId)}`;
}

const CARDS: Card[] = [
  { title: "Control Center", desc: "Full deep config (all engine settings).", href: "/dashboard/control-center" },
  { title: "Pre-Onboarding", desc: "Join gate, auto-kick fail, bypass roles, logs.", href: "/dashboard/security/pre-onboarding" },
  { title: "Onboarding", desc: "Welcome channel, panel copy, DM behavior.", href: "/dashboard/security/onboarding" },
  { title: "Verification", desc: "Timeouts, role mapping, ticket flow, approve roles.", href: "/dashboard/security/verification" },
  { title: "Lockdown", desc: "Thresholds, presets, exempt roles/channels.", href: "/dashboard/security/lockdown" },
  { title: "Raid", desc: "Join burst policy and escalation controls.", href: "/dashboard/security/raid" },
  { title: "Automations", desc: "Event trigger builder and flow editor.", href: "/dashboard/automations" },
  { title: "Custom Commands", desc: "Staff-friendly command studio.", href: "/dashboard/commands" },
  { title: "Bot Personalizer", desc: "Per-guild persona settings (not global app avatar).", href: "/dashboard/ai/persona" }
];

export default function DashboardOverviewPage() {
  const [guildId, setGuildId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const fromUrl = String(url.searchParams.get("guildId") || "").trim();
    const fromStore = String(localStorage.getItem("activeGuildId") || "").trim();
    const gid = fromUrl || fromStore || "";
    if (!gid) return;

    setGuildId(gid);
    localStorage.setItem("activeGuildId", gid);

    if (!fromUrl) {
      url.searchParams.set("guildId", gid);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const cards = useMemo(() => CARDS.map((c) => ({ ...c, href: withGuild(c.href, guildId) })), [guildId]);

  if (!guildId) {
    return (
      <div style={{ color: "#ff6b6b", padding: 24 }}>
        <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Control Overview</h1>
        <p>Select a guild first.</p>
        <Link href="/guilds" style={{ color: "#ff3b3b" }}>Open Guild Selection</Link>
      </div>
    );
  }

  return (
    <div style={{ color: "#ff5252", padding: 24 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Control Overview</h1>
      <p style={{ marginBottom: 18 }}>Guild context locked: {guildId}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            style={{
              display: "block",
              border: "1px solid #6f0000",
              borderRadius: 12,
              padding: 14,
              color: "#ffd2d2",
              textDecoration: "none",
              background: "rgba(120,0,0,0.08)"
            }}
          >
            <div style={{ color: "#ff3b3b", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              {card.title}
            </div>
            <div style={{ color: "#ff9d9d", fontSize: 13 }}>{card.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
