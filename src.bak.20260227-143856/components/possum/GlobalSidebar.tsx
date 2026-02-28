"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { label: string; href: string };

const SECTION_STYLE: React.CSSProperties = {
  marginTop: 18,
  marginBottom: 8,
  fontWeight: 950,
  letterSpacing: "0.28em",
  fontSize: 12,
  textTransform: "uppercase",
  color: "rgba(255,140,140,0.85)",
};

const ITEM_BASE: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "11px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,0,0,0.22)",
  background: "rgba(0,0,0,0.28)",
  color: "#ffb2b2",
  textDecoration: "none",
  fontWeight: 900,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontSize: 12,
};

function ItemLink({ label, href }: Item) {
  const path = usePathname();
  const active = path === href;

  return (
    <Link
      href={href}
      style={{
        ...ITEM_BASE,
        border: active ? "1px solid rgba(255,0,0,0.55)" : ITEM_BASE.border,
        boxShadow: active ? "0 0 18px rgba(255,0,0,0.18)" : "none",
        color: active ? "#ff4b4b" : (ITEM_BASE.color as string),
      }}
    >
      {label}
    </Link>
  );
}

export default function GlobalSidebar() {
  const wrap: React.CSSProperties = { padding: 18 };

  return (
    <div style={wrap}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 950, letterSpacing: "0.28em", fontSize: 22, color: "#ff1a1a" }}>
          POSSUM
        </div>
        <div style={{ marginTop: 6, letterSpacing: "0.22em", fontSize: 11, opacity: 0.85 }}>
          CONTROL SYSTEM
        </div>
      </div>

      <div style={SECTION_STYLE}>CORE</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ItemLink label="Overview" href="/dashboard" />
        <ItemLink label="System Health" href="/dashboard/system-health" />
        <ItemLink label="Audit" href="/dashboard/audit" />
      </div>

      <div style={SECTION_STYLE}>SECURITY</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ItemLink label="PreOnboarding" href="/dashboard/security/preonboarding" />
        <ItemLink label="Onboarding" href="/dashboard/security/onboarding" />
        <ItemLink label="Verification" href="/dashboard/security/verification" />
        <ItemLink label="Lockdown" href="/dashboard/security/lockdown" />
        <ItemLink label="Enforcement" href="/dashboard/security/enforcement" />
      </div>

      <div style={SECTION_STYLE}>ACCESS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ItemLink label="VIP Policy" href="/dashboard/access/vip" />
        <ItemLink label="Supporter Policy" href="/dashboard/access/supporter" />
        <ItemLink label="Nitro Policy" href="/dashboard/access/nitro" />
        <ItemLink label="Role Policy Matrix" href="/dashboard/access/role-matrix" />
      </div>

      <div style={SECTION_STYLE}>ECONOMY</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ItemLink label="Economy" href="/dashboard/economy" />
      </div>

      <div style={SECTION_STYLE}>GAMES</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ItemLink label="Games" href="/dashboard/games" />
      </div>

      <div style={SECTION_STYLE}>GTA OPS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ItemLink label="GTA Ops" href="/dashboard/gta-ops" />
      </div>

      <div style={SECTION_STYLE}>AI</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <ItemLink label="AI" href="/dashboard/ai" />
      </div>

      <div style={{ marginTop: 18, letterSpacing: "0.18em", fontSize: 12, opacity: 0.7 }}>
        DESIGNED BY ASTONEDPOSSUM &amp; ACITYRACCOON
      </div>
    </div>
  );
}
