"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildDashboardHref, readDashboardGuildId } from "@/lib/dashboardContext";

type PanelOwner = {
  href: string;
  title: string;
  description: string;
  status: string;
};

type GuildDataResponse = {
  guild?: {
    id?: string;
    name?: string;
  };
};

const PANEL_OWNERS: PanelOwner[] = [
  {
    href: "/dashboard/selfroles",
    title: "Selfroles",
    description: "Role buttons, button emoji, panel layout, labels, and publish actions stay inside the Selfroles tab.",
    status: "Live panel owner",
  },
  {
    href: "/dashboard/tickets",
    title: "Tickets",
    description: "Ticket panels, ticket-type buttons, welcome copy, close flow, transcript flow, and staff routing stay inside Tickets.",
    status: "Live panel owner",
  },
  {
    href: "/dashboard/range",
    title: "Range",
    description: "Weapon art, setup/live embeds, and any future range panel presentation stay with the Range engine instead of a shared panel page.",
    status: "Engine-owned presentation",
  },
  {
    href: "/dashboard/truthdare",
    title: "Truth Or Dare",
    description: "Prompt boards, button copy, and any deployable truth-or-dare surfaces belong in the Truth Or Dare engine tab.",
    status: "Engine-owned presentation",
  },
  {
    href: "/dashboard/pokemon-catching",
    title: "Pokemon Catching",
    description: "Any catch-panel or spawn-facing presentation belongs in Pokemon Catching and not inside a shared panel editor.",
    status: "Private engine owner",
  },
];

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1280 };
const card: React.CSSProperties = {
  border: "1px solid #650000",
  borderRadius: 14,
  background: "rgba(120,0,0,0.10)",
  padding: 16,
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 14,
};
const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "auto",
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #8f0000",
  color: "#ffe0e0",
  background: "#090909",
  cursor: "pointer",
  fontWeight: 900,
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

export default function PanelHubClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");

  useEffect(() => {
    const activeGuildId = readDashboardGuildId();
    setGuildId(activeGuildId);
    if (!activeGuildId) return;

    const cachedName = localStorage.getItem("activeGuildName") || "";
    if (cachedName.trim()) {
      setGuildName(cachedName.trim());
    }

    fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(activeGuildId)}`, { cache: "no-store" })
      .then((res) => res.json().catch(() => ({} as GuildDataResponse)))
      .then((json: GuildDataResponse) => {
        const nextName = String(json?.guild?.name || "").trim();
        if (!nextName) return;
        setGuildName(nextName);
        localStorage.setItem("activeGuildName", nextName);
      })
      .catch(() => {});
  }, []);

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Panel Hub</h1>
      <div style={{ color: "#ff9999", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4, maxWidth: 920, lineHeight: 1.6 }}>
        This tab is only the hub for panel-backed engines. It does not own ticket buttons, selfrole layouts, game setup embeds, or other engine-specific panel logic. Each engine keeps its own panel controls inside its own tab.
      </div>

      <section style={{ ...card, marginTop: 14 }}>
        <div style={{ color: "#ff6767", fontSize: 13, fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
          Panel Rule
        </div>
        <div style={{ color: "#ffd3d3", lineHeight: 1.7, maxWidth: 980 }}>
          If an engine needs a panel, that engine owns the panel. Use this hub only to jump to the correct engine tab. Shared panel editing is intentionally not done here so game panels, ticket panels, and selfrole panels do not get flattened into one generic page.
        </div>
      </section>

      <section style={{ ...grid, marginTop: 14 }}>
        {PANEL_OWNERS.map((item) => (
          <div key={item.href} style={card}>
            <div style={{ color: "#ff5d5d", fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase", fontSize: 15 }}>
              {item.title}
            </div>
            <div style={{ color: "#ffcc7a", fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", marginTop: 8 }}>
              {item.status}
            </div>
            <div style={{ color: "#ffd0d0", fontSize: 13, lineHeight: 1.65, marginTop: 10, minHeight: 88 }}>
              {item.description}
            </div>
            <Link href={buildDashboardHref(item.href)} style={{ ...button, marginTop: 12 }}>
              Open Engine
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
