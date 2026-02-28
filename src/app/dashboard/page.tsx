"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Guild = { id: string; name: string; icon?: string | null };
type Features = Record<string, boolean>;

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function withGuild(path: string, guildId: string) {
  if (!guildId) return path;
  const glue = path.includes("?") ? "&" : "?";
  return `${path}${glue}guildId=${encodeURIComponent(guildId)}`;
}

function card(): React.CSSProperties {
  return {
    border: "1px solid rgba(255,0,0,0.35)",
    borderRadius: 12,
    padding: 14,
    background: "rgba(45,0,0,0.25)"
  };
}

function input(): React.CSSProperties {
  return {
    width: "100%",
    background: "#090909",
    color: "#ffd9d9",
    border: "1px solid rgba(255,0,0,0.45)",
    borderRadius: 8,
    padding: "10px 12px"
  };
}

function badge(on?: boolean): React.CSSProperties {
  return {
    display: "inline-block",
    border: "1px solid rgba(255,0,0,0.5)",
    borderRadius: 999,
    padding: "2px 10px",
    fontSize: 12,
    color: on ? "#b7ffb7" : "#ffb7b7",
    marginLeft: 6
  };
}

function line(label: string, on?: boolean) {
  return (
    <div style={{ marginTop: 6 }}>
      {label}
      <span style={badge(on)}>{on ? "ENABLED" : "DISABLED"}</span>
    </div>
  );
}

export default function OverviewPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [features, setFeatures] = useState<Features>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const guildName = useMemo(() => guilds.find((g) => g.id === guildId)?.name || guildId, [guilds, guildId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const gid = getGuildId() || list[0]?.id || "";
        setGuildId(gid);
        if (gid && typeof window !== "undefined") {
          localStorage.setItem("activeGuildId", gid);
          const u = new URL(window.location.href);
          u.searchParams.set("guildId", gid);
          window.history.replaceState({}, "", u.toString());
        }
      } catch (e: any) {
        setMsg(e?.message || "Failed to load guild list");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      try {
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        setFeatures(j?.config?.features || {});
      } catch (e: any) {
        setMsg(e?.message || "Failed to load dashboard config");
      }
    })();
  }, [guildId]);

  function switchGuild(next: string) {
    setGuildId(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeGuildId", next);
      const u = new URL(window.location.href);
      u.searchParams.set("guildId", next);
      window.history.replaceState({}, "", u.toString());
    }
  }

  if (loading) return <div style={{ color: "#ff6b6b", padding: 24 }}>Loading overview…</div>;
  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>No guild available. Open /guilds first.</div>;

  return (
    <div style={{ color: "#ff5252", padding: 18 }}>
      <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 20 }}>Control Overview</h1>
      <div style={{ marginTop: 6 }}>Guild-scoped dashboard. Saviors can stay baseline, others can stay blank until configured.</div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, maxWidth: 1050 }}>
        <select value={guildId} onChange={(e) => switchGuild(e.target.value)} style={input()}>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.id})
            </option>
          ))}
        </select>

        <Link href={withGuild("/dashboard/setup", guildId)} style={{ ...input(), textDecoration: "none", textAlign: "center", fontWeight: 900 }}>
          Setup
        </Link>
      </div>

      <div style={{ marginTop: 8, color: "#ff9f9f" }}>Active: {guildName}</div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div style={card()}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Security</div>
          {line("Pre-Onboarding", !!features.onboardingEnabled)}
          {line("Verification", !!features.verificationEnabled)}
          {line("Lockdown", !!features.lockdownEnabled)}
          {line("Raid", !!features.raidEnabled)}
          <div style={{ marginTop: 10 }}><Link href={withGuild("/dashboard/security", guildId)} style={{ color: "#ffb0b0" }}>Open Security</Link></div>
        </div>

        <div style={card()}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Access</div>
          {line("Tickets", !!features.ticketsEnabled)}
          {line("TTS", !!features.ttsEnabled)}
          {line("Governance", !!features.governanceEnabled)}
          <div style={{ marginTop: 10 }}><Link href={withGuild("/dashboard/access", guildId)} style={{ color: "#ffb0b0" }}>Open Access</Link></div>
        </div>

        <div style={card()}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Economy</div>
          {line("Economy", !!features.economyEnabled)}
          {line("Birthdays", !!features.birthdayEnabled)}
          {line("Giveaways", !!features.giveawaysEnabled)}
          <div style={{ marginTop: 10 }}><Link href={withGuild("/dashboard/economy", guildId)} style={{ color: "#ffb0b0" }}>Open Economy</Link></div>
        </div>

        <div style={card()}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Games</div>
          {line("Rare Drop", !!features.rareDropEnabled)}
          {line("Cat Drop", !!features.catdropEnabled)}
          {line("Pokemon", !!features.pokemonEnabled)}
          {line("Pokemon Private-Only", !!features.pokemonPrivateOnly)}
          {line("Crew", !!features.crewEnabled)}
          {line("Contracts", !!features.contractsEnabled)}
          {line("Progression", !!features.progressionEnabled)}
          <div style={{ marginTop: 10 }}><Link href={withGuild("/dashboard/games", guildId)} style={{ color: "#ffb0b0" }}>Open Games</Link></div>
        </div>

        <div style={card()}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>GTA Ops</div>
          {line("Heist", !!features.heistEnabled)}
          <div style={{ marginTop: 10 }}><Link href={withGuild("/dashboard/heist", guildId)} style={{ color: "#ffb0b0" }}>Open GTA Ops</Link></div>
        </div>

        <div style={card()}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>AI Personas</div>
          {line("AI Personas Engine", !!features.aiEnabled)}
          <div style={{ marginTop: 10 }}><Link href={withGuild("/dashboard/ai", guildId)} style={{ color: "#ffb0b0" }}>Open AI Personas</Link></div>
        </div>

        <div style={card()}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>Automation</div>
          <div style={{ marginTop: 8 }}><Link href={withGuild("/dashboard/automations", guildId)} style={{ color: "#ffb0b0" }}>Open Automations</Link></div>
          <div style={{ marginTop: 8 }}><Link href={withGuild("/dashboard/commands", guildId)} style={{ color: "#ffb0b0" }}>Open Command Studio</Link></div>
        </div>
      </div>

      {msg ? <div style={{ marginTop: 10, color: "#ffb3b3" }}>{msg}</div> : null}
    </div>
  );
}
