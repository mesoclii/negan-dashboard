"use client";



import { useEffect, useMemo, useState } from "react";

type Config = {
  active: boolean;
  signupEnabled: boolean;
  signupChannelId: string;
  announceChannelId: string;
  transcriptChannelId: string;
  hostRoleIds: string[];
  maxPlayers: number;
  reserveSlots: number;
  joinWindowMinutes: number;
  sessionDurationMinutes: number;
  cooldownMinutes: number;
  autoLockOnStart: boolean;
  requireVoiceChannel: boolean;
  voiceChannelId: string;
  payoutEnabled: boolean;
  payoutCoinsWin: number;
  payoutCoinsLose: number;
  streakBonusEnabled: boolean;
  minAccountAgeDays: number;
  mustBeVerified: boolean;
  verifiedRoleId: string;
  blockedRoleIds: string[];
  notes: string;
  updatedAt: string;
};

const DEFAULTS: Config = {
  active: true,
  signupEnabled: true,
  signupChannelId: "",
  announceChannelId: "",
  transcriptChannelId: "",
  hostRoleIds: [],
  maxPlayers: 8,
  reserveSlots: 2,
  joinWindowMinutes: 10,
  sessionDurationMinutes: 45,
  cooldownMinutes: 15,
  autoLockOnStart: true,
  requireVoiceChannel: false,
  voiceChannelId: "",
  payoutEnabled: true,
  payoutCoinsWin: 1000,
  payoutCoinsLose: 250,
  streakBonusEnabled: true,
  minAccountAgeDays: 0,
  mustBeVerified: false,
  verifiedRoleId: "",
  blockedRoleIds: [],
  notes: "",
  updatedAt: "",
};

const box: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.10)",
  marginBottom: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #6f0000",
  background: "#0a0a0a",
  color: "#ffd7d7",
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const v = (q || s).trim();
  if (v) localStorage.setItem("activeGuildId", v);
  return v;
}

function csvToArr(v: string): string[] {
  return String(v || "").split(",").map((x) => x.trim()).filter(Boolean);
}
function arrToCsv(v: string[]): string {
  return Array.isArray(v) ? v.join(", ") : "";
}

export default function HeistPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [orig, setOrig] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const r = await fetch(`/api/setup/heist-ops-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" });
        const j = await r.json();
        const next = { ...DEFAULTS, ...(j?.config || {}) };
        setCfg(next);
        setOrig(next);
      } catch {
        setMsg("Failed to load heist config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(orig), [cfg, orig]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/heist-ops-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, ...cfg }),
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      const next = { ...DEFAULTS, ...(j?.config || {}) };
      setCfg(next);
      setOrig(next);
      setMsg("Saved heist ops config.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading heist ops...</div>;

  return (
    <div style={{ color: "#ffb3b3", padding: 14, maxWidth: 1300 }}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Heist Ops Studio</h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      <div style={box}>
        <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Heist engine active</label><br />
        <label><input type="checkbox" checked={cfg.signupEnabled} onChange={(e) => setCfg({ ...cfg, signupEnabled: e.target.checked })} /> Signup flow enabled</label><br />
        <label><input type="checkbox" checked={cfg.autoLockOnStart} onChange={(e) => setCfg({ ...cfg, autoLockOnStart: e.target.checked })} /> Auto lock signup on start</label><br />
        <label><input type="checkbox" checked={cfg.requireVoiceChannel} onChange={(e) => setCfg({ ...cfg, requireVoiceChannel: e.target.checked })} /> Require voice channel</label>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Channels and Roles</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 10 }}>
          <div><label>Signup channel ID</label><input style={input} value={cfg.signupChannelId} onChange={(e) => setCfg({ ...cfg, signupChannelId: e.target.value })} /></div>
          <div><label>Announce channel ID</label><input style={input} value={cfg.announceChannelId} onChange={(e) => setCfg({ ...cfg, announceChannelId: e.target.value })} /></div>
          <div><label>Transcript channel ID</label><input style={input} value={cfg.transcriptChannelId} onChange={(e) => setCfg({ ...cfg, transcriptChannelId: e.target.value })} /></div>
          <div><label>Voice channel ID</label><input style={input} value={cfg.voiceChannelId} onChange={(e) => setCfg({ ...cfg, voiceChannelId: e.target.value })} /></div>
          <div><label>Verified role ID</label><input style={input} value={cfg.verifiedRoleId} onChange={(e) => setCfg({ ...cfg, verifiedRoleId: e.target.value })} /></div>
          <div><label>Host role IDs (csv)</label><input style={input} value={arrToCsv(cfg.hostRoleIds)} onChange={(e) => setCfg({ ...cfg, hostRoleIds: csvToArr(e.target.value) })} /></div>
          <div style={{ gridColumn: "1 / span 3" }}><label>Blocked role IDs (csv)</label><input style={input} value={arrToCsv(cfg.blockedRoleIds)} onChange={(e) => setCfg({ ...cfg, blockedRoleIds: csvToArr(e.target.value) })} /></div>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Session Rules</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(180px, 1fr))", gap: 10 }}>
          <div><label>Max players</label><input style={input} type="number" value={cfg.maxPlayers} onChange={(e) => setCfg({ ...cfg, maxPlayers: Number(e.target.value || 0) })} /></div>
          <div><label>Reserve slots</label><input style={input} type="number" value={cfg.reserveSlots} onChange={(e) => setCfg({ ...cfg, reserveSlots: Number(e.target.value || 0) })} /></div>
          <div><label>Join window (minutes)</label><input style={input} type="number" value={cfg.joinWindowMinutes} onChange={(e) => setCfg({ ...cfg, joinWindowMinutes: Number(e.target.value || 0) })} /></div>
          <div><label>Session duration (minutes)</label><input style={input} type="number" value={cfg.sessionDurationMinutes} onChange={(e) => setCfg({ ...cfg, sessionDurationMinutes: Number(e.target.value || 0) })} /></div>
          <div><label>Cooldown (minutes)</label><input style={input} type="number" value={cfg.cooldownMinutes} onChange={(e) => setCfg({ ...cfg, cooldownMinutes: Number(e.target.value || 0) })} /></div>
          <div><label>Min account age (days)</label><input style={input} type="number" value={cfg.minAccountAgeDays} onChange={(e) => setCfg({ ...cfg, minAccountAgeDays: Number(e.target.value || 0) })} /></div>
        </div>
        <div style={{ marginTop: 8 }}>
          <label><input type="checkbox" checked={cfg.mustBeVerified} onChange={(e) => setCfg({ ...cfg, mustBeVerified: e.target.checked })} /> Must be verified to join</label>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Payouts</h3>
        <label><input type="checkbox" checked={cfg.payoutEnabled} onChange={(e) => setCfg({ ...cfg, payoutEnabled: e.target.checked })} /> Payouts enabled</label><br />
        <label><input type="checkbox" checked={cfg.streakBonusEnabled} onChange={(e) => setCfg({ ...cfg, streakBonusEnabled: e.target.checked })} /> Streak bonus enabled</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <div><label>Win payout coins</label><input style={input} type="number" value={cfg.payoutCoinsWin} onChange={(e) => setCfg({ ...cfg, payoutCoinsWin: Number(e.target.value || 0) })} /></div>
          <div><label>Loss payout coins</label><input style={input} type="number" value={cfg.payoutCoinsLose} onChange={(e) => setCfg({ ...cfg, payoutCoinsLose: Number(e.target.value || 0) })} /></div>
        </div>
      </div>

      <div style={box}>
        <label>Notes</label>
        <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
      </div>

      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div style={{
        position: "fixed", right: 18, bottom: 18, zIndex: 40, border: "1px solid #7a0000",
        borderRadius: 12, padding: 10, background: "rgba(20,0,0,0.95)", display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{dirty ? "DIRTY" : "READY"}</span>
        <button onClick={save} disabled={saving || !dirty} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>
          {saving ? "Saving..." : "Save Heist Ops"}
        </button>
      </div>
    </div>
  );
}
