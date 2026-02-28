"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { possum } from "@/styles/possumTheme";

type NavItem = { label: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    title: "Core",
    items: [
      { label: "Overview", href: "/dashboard" },
      { label: "Control Center", href: "/dashboard/control-center" },
      { label: "Guild Roles", href: "/dashboard/roles" },
      { label: "System Health", href: "/dashboard/system-health" }
    ]
  },
  {
    title: "Security",
    items: [
      { label: "Security Overview", href: "/dashboard/security" },
      { label: "Pre-Onboarding", href: "/dashboard/security/pre-onboarding" },
      { label: "Onboarding", href: "/dashboard/security/onboarding" },
      { label: "Verification", href: "/dashboard/security/verification" },
      { label: "Lockdown", href: "/dashboard/security/lockdown" },
      { label: "Raid", href: "/dashboard/security/raid" },
      { label: "Escalation", href: "/dashboard/security/escalation" },
      { label: "Policy", href: "/dashboard/security/policy" }
    ]
  },
  {
    title: "Access",
    items: [
      { label: "VIP", href: "/dashboard/vip" },
      { label: "Tiers", href: "/dashboard/vip/tiers" },
      { label: "Clearance", href: "/dashboard/vip/clearance" },
      { label: "Role Sync", href: "/dashboard/vip/rolesync" },
      { label: "Loyalty", href: "/dashboard/vip/loyalty" }
    ]
  },
  {
    title: "Automation",
    items: [
      { label: "Automations", href: "/dashboard/automations" },
      { label: "Custom Commands", href: "/dashboard/custom-commands" }
    ]
  }
];

export function PossumSidebar() {
  const pathname = usePathname() || "/dashboard";
  const searchParams = useSearchParams();
  const guildId = String(searchParams?.get("guildId") || "").trim();

  const withGuild = (href: string) => {
    if (!guildId) return href;
    const glue = href.includes("?") ? "&" : "?";
    return `${href}${glue}guildId=${encodeURIComponent(guildId)}`;
  };

  const activeGroupIndex = useMemo(() => {
    const idx = GROUPS.findIndex((g) =>
      g.items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    );
    return idx === -1 ? 0 : idx;
  }, [pathname]);

  const [openIndex, setOpenIndex] = useState(activeGroupIndex);

  return (
    <aside
      style={{
        width: 300,
        borderRight: `1px solid ${possum.divider}`,
        padding: "20px 18px",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            color: possum.red,
            textShadow: possum.glowSoft,
            fontWeight: 950,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontSize: 22
          }}
        >
          POSSUM
        </div>
        <div
          style={{
            marginTop: 10,
            color: possum.soft,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontSize: 12,
            opacity: 0.9
          }}
        >
          Control System
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${possum.divider}`, margin: "14px 0" }} />

      <div style={{ marginBottom: 12 }}>
        <Link
          href={withGuild("/guilds")}
          style={{
            textDecoration: "none",
            display: "block",
            textAlign: "left",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,0,0,0.25)",
            color: possum.soft,
            fontWeight: 900,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 12
          }}
        >
          Change Guild
        </Link>
      </div>

      <div style={{ overflowY: "auto", paddingRight: 6 }}>
        {GROUPS.map((g, idx) => {
          const isOpen = idx === openIndex;
          return (
            <div key={g.title} style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  cursor: "pointer",
                  padding: "10px 10px",
                  borderRadius: 12,
                  border: `1px solid ${isOpen ? "rgba(255,0,0,0.40)" : "rgba(255,0,0,0.16)"}`,
                  background: isOpen ? "rgba(255,0,0,0.10)" : "transparent",
                  color: isOpen ? "#fff" : possum.soft,
                  fontWeight: 950,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontSize: 12,
                  boxShadow: isOpen ? "0 0 18px rgba(255,0,0,0.18)" : "none"
                }}
              >
                {g.title}
              </button>

              {isOpen ? (
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {g.items.map((it) => {
                    const isActive = pathname === it.href || pathname.startsWith(it.href + "/");
                    return (
                      <Link
                        key={it.href}
                        href={withGuild(it.href)}
                        style={{
                          textDecoration: "none",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: `1px solid ${isActive ? "rgba(255,0,0,0.55)" : "rgba(255,0,0,0.18)"}`,
                          background: isActive ? "rgba(255,0,0,0.16)" : "transparent",
                          color: isActive ? "#fff" : possum.soft,
                          fontWeight: 900,
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          fontSize: 12,
                          boxShadow: isActive ? "0 0 22px rgba(255,0,0,0.20)" : "none"
                        }}
                      >
                        {it.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
