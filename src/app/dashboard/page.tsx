"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

type Guild = { id: string; name: string; icon?: string | null };
type DashboardConfig = {
  features?: Record<string, boolean>;
  security?: {
    preOnboarding?: { enabled?: boolean };
    verification?: { enabled?: boolean };
    onboarding?: { enabled?: boolean };
  };
};
type GiveawaysCfg = {
  enabled?: boolean;
  defaultChannelId?: string | null;
  channelId?: string | null;
  ticketChannelId?: string | null;
  defaultImageUrl?: string | null;
};

const card: CSSProperties = {
  border: "1px solid #6f0000",
  borderRadius: 14,
  padding: 14,
  background: "rgba(120,0,0,0.10)"
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 8
};

const btn: CSSProperties = {
  textDecoration: "none",
  display: "inline-block",
  padding: "8px 12px",
  border: "1px solid #a30000",
  borderRadius: 10,
  color: "#ff6b6b",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontSize: 12
};

function Status({ on }: { on: boolean }) {
  return (
    <span
      style={{
        border: "1px solid #a30000",
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        color: on ? "#b7ffb7" : "#ff9b9b",
        background: on ? "rgba(0,120,0,0.22)" : "rgba(120,0,0,0.22)"
      }}
    >
      {on ? "ENABLED" : "DISABLED"}
    </span>
  );
}

function qGuild(href: string, guildId: string) {
  if (!guildId) return href;
  return href.includes("?")
    ? `${href}&guildId=${encodeURIComponent(guildId)}`
    : `${href}?guildId=${encodeURIComponent(guildId)}`;
}

function readFlag(features: Record<string, boolean> | undefined, key: string, fallback = false) {
  const v = features?.[key];
  return typeof v === "boolean" ? v : fallback;
}

export default function DashboardPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<DashboardConfig>({});
  const [giveaways, setGiveaways] = useState<GiveawaysCfg>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const activeGuild = useMemo(
    () => guilds.find((g) => g.id === guildId),
    [guilds, guildId]
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const fromUrl =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("guildId") || ""
            : "";
        const fromStore =
          typeof window !== "undefined" ? localStorage.getItem("activeGuildId") || "" : "";
        const next = fromUrl || fromStore || list[0]?.id || "";

        if (next) {
          setGuildId(next);
          if (typeof window !== "undefined") {
            localStorage.setItem("activeGuildId", next);
            const u = new URL(window.location.href);
            u.searchParams.set("guildId", next);
            window.history.replaceState({}, "", u.toString());
          }
        }
      } catch {
        setMsg("Failed to load guilds.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      try {
        const [cfgRes, gwRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=giveaways`)
        ]);

        const cfgJson = await cfgRes.json();
        const gwJson = await gwRes.json();

        setCfg(cfgJson?.config || {});
        setGiveaways(gwJson?.config || {});
      } catch {
        setMsg("Failed to load config.");
      }
    })();
  }, [guildId]);

  const f = cfg.features || {};
  const preOnboardingEnabled = cfg.security?.preOnboarding?.enabled !== false;
  const verificationEnabled = readFlag(f, "verificationEnabled", false);
  const onboardingEnabled = readFlag(f, "onboardingEnabled", false);

  const ttsEnabled = readFlag(f, "ttsEnabled", false);
  const governanceEnabled = readFlag(f, "governanceEnabled", false);

  const economyEnabled = readFlag(f, "economyEnabled", false);
  const birthdayEnabled = readFlag(f, "birthdayEnabled", false);
  const giveawaysEnabled = giveaways.enabled !== false;

  const rareDropEnabled = readFlag(f, "rareDropEnabled", false);
  const pokemonEnabled = readFlag(f, "pokemonEnabled", false);
  const catDropEnabled = readFlag(f, "catDropEnabled", true);
  const contractsEnabled = readFlag(f, "contractsEnabled", true);

  const heistEnabled = readFlag(f, "heistEnabled", false);
  const aiEnabled = readFlag(f, "aiEnabled", false);

  if (loading) return <div style={{ color: "#ff7a7a", padding: 20 }}>Loading...</div>;
  if (!guildId) return <div style={{ color: "#ff7a7a", padding: 20 }}>No guild selected.</div>;

  return (
    <div style={{ color: "#ff5a5a" }}>
      <h1 style={{ letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 8 }}>
        Control Overview
      </h1>
      <p style={{ marginTop: 0, opacity: 0.9 }}>
        Guild-scoped dashboard. Saviors can stay baseline, others can start blank.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
        <select
          value={guildId}
          onChange={(e) => {
            const next = e.target.value;
            setGuildId(next);
            if (typeof window !== "undefined") {
              localStorage.setItem("activeGuildId", next);
              const u = new URL(window.location.href);
              u.searchParams.set("guildId", next);
              window.history.replaceState({}, "", u.toString());
            }
          }}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #7a0000",
            background: "#0b0b0b",
            color: "#ffd2d2"
          }}
        >
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.id})
            </option>
          ))}
        </select>

        <Link href={qGuild("/dashboard/control-center", guildId)} style={{ ...btn, textAlign: "center" }}>
          Setup
        </Link>
      </div>

      <div style={{ marginBottom: 14 }}>
        Active: {activeGuild?.name || guildId}
      </div>

      {msg ? <p style={{ color: "#ff8080" }}>{msg}</p> : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(280px,1fr))", gap: 12 }}>
        <div style={card}>
          <h3 style={{ marginTop: 0, letterSpacing: "0.10em", textTransform: "uppercase" }}>Security</h3>
          <div style={row}><span>Pre-Onboarding</span><Status on={preOnboardingEnabled} /></div>
          <div style={row}><span>Verification</span><Status on={verificationEnabled} /></div>
          <div style={row}><span>Onboarding</span><Status on={onboardingEnabled} /></div>
          <Link href={qGuild("/dashboard/security", guildId)} style={btn}>Open Security</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0, letterSpacing: "0.10em", textTransform: "uppercase" }}>Access</h3>
          <div style={row}><span>TTS</span><Status on={ttsEnabled} /></div>
          <div style={row}><span>Governance</span><Status on={governanceEnabled} /></div>
          <Link href={qGuild("/dashboard/access", guildId)} style={btn}>Open Access</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0, letterSpacing: "0.10em", textTransform: "uppercase" }}>Economy</h3>
          <div style={row}><span>Economy</span><Status on={economyEnabled} /></div>
          <div style={row}><span>Birthdays</span><Status on={birthdayEnabled} /></div>
          <div style={row}><span>Giveaways</span><Status on={giveawaysEnabled} /></div>
          <Link href={qGuild("/dashboard/economy", guildId)} style={btn}>Open Economy</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0, letterSpacing: "0.10em", textTransform: "uppercase" }}>Games</h3>
          <div style={row}><span>Rare Drop</span><Status on={rareDropEnabled} /></div>
          <div style={row}><span>Pokemon</span><Status on={pokemonEnabled} /></div>
          <div style={row}><span>Cat Drop</span><Status on={catDropEnabled} /></div>
          <div style={row}><span>Contracts</span><Status on={contractsEnabled} /></div>
          <Link href={qGuild("/dashboard/games", guildId)} style={btn}>Open Games</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0, letterSpacing: "0.10em", textTransform: "uppercase" }}>GTA Ops</h3>
          <div style={row}><span>Heist</span><Status on={heistEnabled} /></div>
          <Link href={qGuild("/dashboard/gta-ops", guildId)} style={btn}>Open GTA Ops</Link>
        </div>

        <div style={card}>
          <h3 style={{ marginTop: 0, letterSpacing: "0.10em", textTransform: "uppercase" }}>AI Personas</h3>
          <div style={row}><span>AI Engine</span><Status on={aiEnabled} /></div>
          <p style={{ marginTop: 8, marginBottom: 10 }}>Separate from bot persona settings.</p>
          <Link href={qGuild("/dashboard/ai", guildId)} style={btn}>Open AI Personas</Link>
        </div>
      </div>
    </div>
  );
}
