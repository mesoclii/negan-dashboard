"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Channel = { id: string; name: string; type?: number | string };

type GamesConfig = {
  active: boolean;
  rareDrop: {
    enabled: boolean;
    intervalMinutes: number;
    maxActive: number;
    announceChannelId: string;
  };
  catDrop: {
    enabled: boolean;
    intervalMinutes: number;
    maxActive: number;
    announceChannelId: string;
  };
  pokemon: {
    enabled: boolean;
    privateOnly: boolean;
    guildAllowed: boolean;
    battleEnabled: boolean;
    tradingEnabled: boolean;
    intervalMinutes: number;
    maxActive: number;
    spawnChannelIds: string[];
  };
  progression: {
    enabled: boolean;
    achievementsEnabled: boolean;
    xpPerMessageMin: number;
    xpPerMessageMax: number;
    levelUpChannelId: string;
  };
};

const EMPTY: GamesConfig = {
  active: true,
  rareDrop: { enabled: false, intervalMinutes: 20, maxActive: 2, announceChannelId: "" },
  catDrop: { enabled: false, intervalMinutes: 20, maxActive: 2, announceChannelId: "" },
  pokemon: { enabled: false, privateOnly: true, guildAllowed: false, battleEnabled: true, tradingEnabled: true, intervalMinutes: 20, maxActive: 2, spawnChannelIds: [] },
  progression: { enabled: true, achievementsEnabled: true, xpPerMessageMin: 5, xpPerMessageMax: 15, levelUpChannelId: "" }
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const url = new URLSearchParams(window.location.search).get("guildId") || "";
  const stored = localStorage.getItem("activeGuildId") || "";
  const id = (url || stored).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#070707",
  border: "1px solid rgba(255,0,0,.45)",
  color: "#ffd3d3",
  borderRadius: 10,
  padding: "10px 12px"
};

export default function GamesClient() {
  const [guildId, setGuildId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [cfg, setCfg] = useState<GamesConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/games-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));

        setCfg({ ...EMPTY, ...(cfgJson?.config || {}) });
        setChannels((Array.isArray(gdJson?.channels) ? gdJson.channels : []).filter((c: any) => Number(c?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed loading games config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/games-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config || cfg) });
      setMsg("Games settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ maxWidth: 1280, color: "#ffcaca" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900, color: "#ff2f2f" }}>Games Control</div>
          <div style={{ color: "#ff9e9e", marginTop: 4 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/dashboard/games/fun-modes?guildId=${encodeURIComponent(guildId)}`} style={{ ...inputStyle, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Game Engines</Link>
          <Link href={`/dashboard/achievements?guildId=${encodeURIComponent(guildId)}`} style={{ ...inputStyle, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Achievements</Link>
          <button onClick={saveAll} disabled={saving} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}
      {loading ? <div>Loading...</div> : null}

      {!loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={cardStyle}>
            <h3 style={titleStyle}>Global</h3>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Games engine active</label>
          </section>

          <section style={cardStyle}>
            <h3 style={titleStyle}>Rare Drop</h3>
            <label><input type="checkbox" checked={cfg.rareDrop.enabled} onChange={(e) => setCfg((p) => ({ ...p, rareDrop: { ...p.rareDrop, enabled: e.target.checked } }))} /> Enabled</label>
            <div style={grid2}>
              <input style={inputStyle} value={cfg.rareDrop.intervalMinutes} onChange={(e) => setCfg((p) => ({ ...p, rareDrop: { ...p.rareDrop, intervalMinutes: Number(e.target.value || 0) } }))} placeholder="Interval minutes" />
              <input style={inputStyle} value={cfg.rareDrop.maxActive} onChange={(e) => setCfg((p) => ({ ...p, rareDrop: { ...p.rareDrop, maxActive: Number(e.target.value || 0) } }))} placeholder="Max active" />
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={titleStyle}>Cat Drop</h3>
            <label><input type="checkbox" checked={cfg.catDrop.enabled} onChange={(e) => setCfg((p) => ({ ...p, catDrop: { ...p.catDrop, enabled: e.target.checked } }))} /> Enabled</label>
            <div style={grid2}>
              <input style={inputStyle} value={cfg.catDrop.intervalMinutes} onChange={(e) => setCfg((p) => ({ ...p, catDrop: { ...p.catDrop, intervalMinutes: Number(e.target.value || 0) } }))} placeholder="Interval minutes" />
              <input style={inputStyle} value={cfg.catDrop.maxActive} onChange={(e) => setCfg((p) => ({ ...p, catDrop: { ...p.catDrop, maxActive: Number(e.target.value || 0) } }))} placeholder="Max active" />
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={titleStyle}>Pokemon (Private Engine)</h3>
            <div style={{ marginBottom: 8, color: "#ffb5b5", fontSize: 13 }}>
              Keep this private and non-monetized. Use the toggle below to allow Pokemon only in this selected guild.
            </div>
            <label><input type="checkbox" checked={cfg.pokemon.guildAllowed} onChange={(e) => setCfg((p) => ({ ...p, pokemon: { ...p.pokemon, guildAllowed: e.target.checked } }))} /> Allow Pokemon in this guild</label>
            {!cfg.pokemon.guildAllowed ? (
              <div style={{ marginTop: 8, color: "#ff9a9a", fontSize: 12, fontWeight: 700 }}>
                Pokemon is blocked for this guild until you enable "Allow Pokemon in this guild".
              </div>
            ) : null}
            <div style={{ marginTop: 8 }}>
              <label><input type="checkbox" checked={cfg.pokemon.enabled} disabled={!cfg.pokemon.guildAllowed} onChange={(e) => setCfg((p) => ({ ...p, pokemon: { ...p.pokemon, enabled: e.target.checked } }))} /> Pokemon engine enabled</label>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
              <label><input type="checkbox" checked={cfg.pokemon.battleEnabled} disabled={!cfg.pokemon.guildAllowed} onChange={(e) => setCfg((p) => ({ ...p, pokemon: { ...p.pokemon, battleEnabled: e.target.checked } }))} /> Battle enabled</label>
              <label><input type="checkbox" checked={cfg.pokemon.tradingEnabled} disabled={!cfg.pokemon.guildAllowed} onChange={(e) => setCfg((p) => ({ ...p, pokemon: { ...p.pokemon, tradingEnabled: e.target.checked } }))} /> Trading enabled</label>
            </div>
            <div style={grid2}>
              <input style={inputStyle} value={cfg.pokemon.intervalMinutes} onChange={(e) => setCfg((p) => ({ ...p, pokemon: { ...p.pokemon, intervalMinutes: Number(e.target.value || 0) } }))} placeholder="Interval minutes" />
              <input style={inputStyle} value={cfg.pokemon.maxActive} onChange={(e) => setCfg((p) => ({ ...p, pokemon: { ...p.pokemon, maxActive: Number(e.target.value || 0) } }))} placeholder="Max active" />
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={titleStyle}>Progression</h3>
            <label><input type="checkbox" checked={cfg.progression.enabled} onChange={(e) => setCfg((p) => ({ ...p, progression: { ...p.progression, enabled: e.target.checked } }))} /> Enabled</label>
            <label style={{ marginLeft: 14 }}><input type="checkbox" checked={cfg.progression.achievementsEnabled} onChange={(e) => setCfg((p) => ({ ...p, progression: { ...p.progression, achievementsEnabled: e.target.checked } }))} /> Achievements enabled</label>
            <div style={grid2}>
              <input style={inputStyle} value={cfg.progression.xpPerMessageMin} onChange={(e) => setCfg((p) => ({ ...p, progression: { ...p.progression, xpPerMessageMin: Number(e.target.value || 0) } }))} placeholder="XP min per message" />
              <input style={inputStyle} value={cfg.progression.xpPerMessageMax} onChange={(e) => setCfg((p) => ({ ...p, progression: { ...p.progression, xpPerMessageMax: Number(e.target.value || 0) } }))} placeholder="XP max per message" />
            </div>
            <select style={{ ...inputStyle, marginTop: 8 }} value={cfg.progression.levelUpChannelId} onChange={(e) => setCfg((p) => ({ ...p, progression: { ...p.progression, levelUpChannelId: e.target.value } }))}>
              <option value="">Level-up channel (optional)</option>
              {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </section>
        </div>
      ) : null}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.35)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(90,0,0,.10)"
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#ffdada",
  letterSpacing: "0.10em",
  textTransform: "uppercase"
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 8
};
