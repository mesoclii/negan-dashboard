"use client";

import Link from "next/link";

type Item = { label: string; href: string; desc: string };

const ITEMS: Item[] = [
  { label: "Moderator", href: "/dashboard/security/moderator", desc: "Automod, restrictions, moderation logging." },
  { label: "Moderator Command Controls", href: "/dashboard/security/commands", desc: "Moderation command permissions and policy." },
  { label: "Command Studio", href: "/dashboard/commands", desc: "Custom command behavior and studio UX (separate from moderation controls)." },
  { label: "Dashboard Access Control", href: "/dashboard/security/access-control", desc: "Role/user access rules for dashboard pages." },
  { label: "Security Engines", href: "/dashboard/security/engines", desc: "Separated engine directory and runtime visibility." },
  { label: "Engine Matrix", href: "/dashboard/security/engine-matrix", desc: "Engine status matrix and toggles." },
  { label: "Automation Studio", href: "/dashboard/security/automation-studio", desc: "Rule actions and automation behavior." },
  { label: "Welcome + Goodbye", href: "/dashboard/security/welcome-goodbye", desc: "Join/leave messages and card controls." },
  { label: "Profiles", href: "/dashboard/security/profiles", desc: "Security profiles and presets." },
  { label: "Security Policy", href: "/dashboard/security/policy", desc: "Policy-level controls and guardrails." },
  { label: "Onboarding Builder", href: "/dashboard/security/onboarding-builder", desc: "Pre-onboarding, verification, onboarding flow." },
  { label: "Pre-Onboarding", href: "/dashboard/security/pre-onboarding", desc: "Gate entry checks and enforcement." },
  { label: "Verification", href: "/dashboard/security/verification", desc: "Verification thresholds and behavior." },
  { label: "Lockdown", href: "/dashboard/security/lockdown", desc: "Lockdown triggers and escalation." },
  { label: "Raid", href: "/dashboard/security/raid", desc: "Raid detection and response settings." },
];

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const g = (q || s).trim();
  if (g) localStorage.setItem("activeGuildId", g);
  return g;
}

function withGuild(href: string, guildId: string): string {
  if (!guildId) return href;
  return `${href}?guildId=${encodeURIComponent(guildId)}`;
}

export default function SecurityPage() {
  const guildId = getGuildId();

  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: 1, textTransform: "uppercase" }}>Security Center</h1>
      <p style={{ marginTop: 8, color: "#ff8a8a" }}>
        Stable launcher mode. Open any security module below.
      </p>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
          gap: 12,
        }}
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={withGuild(item.href, guildId)}
            style={{
              display: "block",
              border: "1px solid #5f0000",
              borderRadius: 10,
              padding: 12,
              background: "rgba(35,0,0,0.45)",
              textDecoration: "none",
              color: "#ffd0d0",
            }}
          >
            <div style={{ fontWeight: 800, color: "#ff4d4d", marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 13, lineHeight: 1.4 }}>{item.desc}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
