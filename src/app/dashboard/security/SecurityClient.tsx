"use client";

import Link from "next/link";

type Item = { label: string; href: string; desc: string };

const ITEMS: Item[] = [
  { label: "Security Engines", href: "/dashboard/security/engines", desc: "Separated engine directory and runtime visibility." },
  { label: "Engine Matrix", href: "/dashboard/security/engine-matrix", desc: "Engine status matrix and toggles." },
  { label: "Security Rule Studio", href: "/dashboard/security/automation-studio", desc: "Security rule actions (separate from Bot Automations)." },
  { label: "Profiles", href: "/dashboard/security/profiles", desc: "Security profiles and presets." },
  { label: "Security Policy", href: "/dashboard/security/policy", desc: "Policy-level controls and guardrails." },
  { label: "Pre-Onboarding", href: "/dashboard/security/pre-onboarding", desc: "Gate entry checks and enforcement." },
  { label: "Verification", href: "/dashboard/security/verification", desc: "Verification thresholds and behavior." },
  { label: "Onboarding", href: "/dashboard/security/onboarding", desc: "Welcome flow and verification hooks." },
  { label: "Lockdown", href: "/dashboard/security/lockdown", desc: "Lockdown triggers and escalation." },
  { label: "Raid", href: "/dashboard/security/raid", desc: "Raid detection and response settings." },

  { label: "Account Integrity", href: "/dashboard/security/account-integrity", desc: "Account risk profiling surface." },
  { label: "Behavioral Drift", href: "/dashboard/security/behavioral-drift", desc: "Behavioral drift monitoring surface." },
  { label: "Link Intel", href: "/dashboard/security/link-intel", desc: "Domain/user intel correlation surface." },
  { label: "Threat Intel", href: "/dashboard/security/threat-intel", desc: "Threat-wave/domain threat surface." },
  { label: "Trust Weight", href: "/dashboard/security/trust-weight", desc: "Trust profile adjustment surface." },
  { label: "Risk Escalation", href: "/dashboard/security/risk-escalation", desc: "Security escalation state surface." },
  { label: "Containment", href: "/dashboard/security/containment", desc: "Containment action handling surface." },
  { label: "Forensics", href: "/dashboard/security/forensics", desc: "Forensics evidence/logging surface." },
  { label: "Crew Security", href: "/dashboard/security/crew-security", desc: "Crew security scoring/logging surface." },
  { label: "Shadow Layer", href: "/dashboard/security/shadow-layer", desc: "Shadow restriction checks surface." },
  { label: "Staff Activity", href: "/dashboard/security/staff-activity", desc: "Staff activity monitoring surface." },
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
        Security engines are split into dedicated entities below.
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
