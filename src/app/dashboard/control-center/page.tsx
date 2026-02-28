"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Config = {
  features?: Record<string, boolean>;
  security?: {
    preOnboarding?: Record<string, any>;
    onboarding?: Record<string, any>;
    verification?: Record<string, any>;
    lockdown?: Record<string, any>;
    raid?: Record<string, any>;
  };
};

type Guild = { id: string; name: string };

export default function ControlCenterPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<Config>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const guildName = useMemo(
    () => guilds.find((g) => g.id === guildId)?.name || guildId,
    [guilds, guildId]
  );

  const ff = (k: string) => Boolean(cfg.features?.[k]);
  const sf = (path: "lockdown" | "raid") => Boolean((cfg.security as any)?.[path]?.enabled);
  const preOnboardingActive =
    Boolean(cfg.security?.preOnboarding?.autoBanOnBlacklistRejoin) ||
    Boolean(cfg.security?.preOnboarding?.autoBanOnRefusalRole);

  function withGuild(path: string) {
    if (!guildId) return path;
    return `${path}${path.includes("?") ? "&" : "?"}guildId=${encodeURIComponent(guildId)}`;
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const q = new URLSearchParams(window.location.search).get("guildId") || "";
        const s = localStorage.getItem("activeGuildId") || "";
        const next = q || s || list[0]?.id || "";
        setGuildId(next);

        if (next) {
          localStorage.setItem("activeGuildId", next);
          const u = new URL(window.location.href);
          u.searchParams.set("guildId", next);
          window.history.replaceState({}, "", u.toString());
        }
      } catch {
        setMsg("Failed to load guilds.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        if (!r.ok || j?.success === false) throw new Error(j?.error || "Failed to load config");
        setCfg(j?.config || {});
      } catch (e: any) {
        setMsg(e?.message || "Failed to load control center");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const card: React.CSSProperties = {
    border: "1px solid #6f0000",
    borderRadius: 12,
    padding: 14,
    background: "rgba(120,0,0,0.08)",
    display: "grid",
    gap: 8
  };

  const on = (v: boolean) => (
    <span
      style={{
        display: "inline-block",
        width: "fit-content",
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid #7a0000",
        background: v ? "rgba(0,120,0,0.20)" : "rgba(120,0,0,0.20)",
        color: v ? "#bcffbc" : "#ff9d9d",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.08em"
      }}
    >
      {v ? "Enabled" : "Disabled"}
    </span>
  );

  return (
    <div style={{ color: "#ff5252", padding: 22 }}>
      <h1 style={{ margin: 0, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ff2a2a" }}>
        Control Center
      </h1>
      <p style={{ marginTop: 8 }}>Engine map + status by guild.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", maxWidth: 920, marginBottom: 14 }}>
        <select
          value={guildId}
          onChange={(e) => {
            const next = e.target.value;
            setGuildId(next);
            localStorage.setItem("activeGuildId", next);
            const u = new URL(window.location.href);
            u.searchParams.set("guildId", next);
            window.history.replaceState({}, "", u.toString());
          }}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #7a0000", background: "#0d0d0d", color: "#ffd2d2" }}
        >
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.id})
            </option>
          ))}
        </select>
      </div>

      <p style={{ color: "#ff8a8a" }}>{guildName ? `Active: ${guildName}` : ""} {msg ? `• ${msg}` : ""}</p>
      {loading ? <p>Loading...</p> : null}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
          <div style={card}><h3 style={{ margin: 0 }}>Pre-Onboarding</h3>{on(preOnboardingActive)}<Link href={withGuild("/dashboard/security/pre-onboarding")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Onboarding</h3>{on(ff("onboardingEnabled"))}<Link href={withGuild("/dashboard/security/onboarding")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Verification</h3>{on(ff("verificationEnabled"))}<Link href={withGuild("/dashboard/security/verification")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Lockdown</h3>{on(sf("lockdown"))}<Link href={withGuild("/dashboard/security/lockdown")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Raid</h3>{on(sf("raid"))}<Link href={withGuild("/dashboard/security/raid")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Economy</h3>{on(ff("economyEnabled"))}<Link href={withGuild("/dashboard/economy")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Games</h3>{on(ff("rareDropEnabled"))}<Link href={withGuild("/dashboard/games")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Giveaways</h3>{on(ff("giveawaysEnabled"))}<Link href={withGuild("/dashboard/giveaways")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>GTA Ops / Heist</h3>{on(ff("heistEnabled"))}<Link href={withGuild("/dashboard/gta-ops")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Access + Tickets + TTS</h3>{on(ff("ticketsEnabled"))}<Link href={withGuild("/dashboard/access")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>AI Personas Engine</h3>{on(ff("aiEnabled"))}<Link href={withGuild("/dashboard/ai/persona")} style={{ color: "#ff9d9d" }}>Open</Link></div>
          <div style={card}><h3 style={{ margin: 0 }}>Automation + Commands</h3><Link href={withGuild("/dashboard/automations")} style={{ color: "#ff9d9d" }}>Automations</Link><Link href={withGuild("/dashboard/custom-commands")} style={{ color: "#ff9d9d" }}>Command Studio</Link></div>
        </div>
      )}
    </div>
  );
}
