"use client";

import Link from "next/link";
import { useState } from "react";

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function withGuild(path: string, guildId: string): string {
  if (!guildId) return path;
  return `${path}?guildId=${encodeURIComponent(guildId)}`;
}

export default function GtaOpsPage() {
  const [guildId] = useState<string>(() => getGuildId());

  return (
    <div style={{ color: "#ffb3b3", padding: 24, maxWidth: 980 }}>
      <h1 style={{ margin: 0, letterSpacing: "0.14em", textTransform: "uppercase", color: "#ff4444" }}>GTA Ops</h1>
      <p style={{ marginTop: 10 }}>
        Separate entity from Heist. Heist remains signup/session flow only.
      </p>
      <p style={{ marginTop: 10 }}>
        Use this entity for GTA operations modules and route into crew/dominion/contracts controls.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 14 }}>
        <Link href={withGuild("/dashboard/crew", guildId)} style={linkStyle}>Open Crew</Link>
        <Link href={withGuild("/dashboard/dominion", guildId)} style={linkStyle}>Open Dominion</Link>
        <Link href={withGuild("/dashboard/contracts", guildId)} style={linkStyle}>Open Contracts</Link>
        <Link href={withGuild("/dashboard/heist", guildId)} style={linkStyle}>Open Heist Signup</Link>
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  display: "inline-block",
  border: "1px solid #7a0000",
  borderRadius: 10,
  padding: "9px 12px",
  color: "#ffd7d7",
  textDecoration: "none",
  fontWeight: 800,
  background: "#140000"
};
