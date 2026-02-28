"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const urlGuild = new URLSearchParams(window.location.search).get("guildId") || "";
  const stored = localStorage.getItem("activeGuildId") || "";
  const gid = (urlGuild || stored).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function href(path: string, guildId: string) {
  if (!guildId) return path;
  return `${path}?guildId=${encodeURIComponent(guildId)}`;
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #7a0000",
  borderRadius: 12,
  padding: 16,
  background: "rgba(120,0,0,0.08)"
};

export default function SecurityOverviewPage() {
  const [guildId, setGuildId] = useState("");

  useEffect(() => {
    setGuildId(getGuildId());
  }, []);

  return (
    <div style={{ color: "#ff5252", padding: 24 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Security Command</h1>
      <p>Configure each subsystem separately. No overlap.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, maxWidth: 1100 }}>
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Pre-Onboarding</h3>
          <p>Join gate enforcement, refusal role handling, enforcement routing.</p>
          <Link href={href("/dashboard/security/pre-onboarding", guildId)} style={{ color: "#ff8a8a" }}>Open</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Verification</h3>
          <p>Decline/timeout actions and ID verification fail behavior.</p>
          <Link href={href("/dashboard/security/verification", guildId)} style={{ color: "#ff8a8a" }}>Open</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Onboarding</h3>
          <p>Welcome flow channels, ticket category, staff roles, panel text.</p>
          <Link href={href("/dashboard/security/onboarding", guildId)} style={{ color: "#ff8a8a" }}>Open</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Lockdown</h3>
          <p>Threshold controls and protected roles/channels.</p>
          <Link href={href("/dashboard/security/lockdown", guildId)} style={{ color: "#ff8a8a" }}>Open</Link>
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Raid</h3>
          <p>Burst detection, window, action preset, escalation.</p>
          <Link href={href("/dashboard/security/raid", guildId)} style={{ color: "#ff8a8a" }}>Open</Link>
        </div>
      </div>
    </div>
  );
}
