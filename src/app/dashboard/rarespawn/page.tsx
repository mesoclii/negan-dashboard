"use client";

import { useEffect, useState } from "react";

type Channel = { id: string; name: string; type?: number | string };

type RareSpawnCfg = {
  enabled: boolean;
  intervalMinutes: number;
  maxActive: number;
  announceChannelId: string;
  spawnChannelIds: string[];
  dropRatePercent: number;
  rewardCoinsMin: number;
  rewardCoinsMax: number;
};

const EMPTY: RareSpawnCfg = {
  enabled: false,
  intervalMinutes: 20,
  maxActive: 2,
  announceChannelId: "",
  spawnChannelIds: [],
  dropRatePercent: 100,
  rewardCoinsMin: 25,
  rewardCoinsMax: 250,
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

const box: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)" };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

export default function RareSpawnEnginePage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<RareSpawnCfg>(EMPTY);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/games-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        setCfg({ ...EMPTY, ...(cfgJson?.config?.rareDrop || {}) });
        setChannels((Array.isArray(gdJson?.channels) ? gdJson.channels : []).filter((c: any) => Number(c?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load Rare Spawn config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/games-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { rareDrop: cfg } }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config?.rareDrop || cfg) });
      setMsg("Rare Spawn engine config saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Rare Spawn Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={box}>
            <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Enabled</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div><div>Spawn Interval (minutes)</div><input style={input} type="number" value={cfg.intervalMinutes} onChange={(e) => setCfg((p) => ({ ...p, intervalMinutes: Number(e.target.value || 0) }))} /></div>
              <div><div>Max Active Spawns</div><input style={input} type="number" value={cfg.maxActive} onChange={(e) => setCfg((p) => ({ ...p, maxActive: Number(e.target.value || 0) }))} /></div>
              <div><div>Drop Rate (%)</div><input style={input} type="number" value={cfg.dropRatePercent} onChange={(e) => setCfg((p) => ({ ...p, dropRatePercent: Number(e.target.value || 0) }))} /></div>
              <div><div>Announce Channel</div><select style={input} value={cfg.announceChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, announceChannelId: e.target.value }))}><option value="">Select channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
              <div><div>Reward Coins Min</div><input style={input} type="number" value={cfg.rewardCoinsMin} onChange={(e) => setCfg((p) => ({ ...p, rewardCoinsMin: Number(e.target.value || 0) }))} /></div>
              <div><div>Reward Coins Max</div><input style={input} type="number" value={cfg.rewardCoinsMax} onChange={(e) => setCfg((p) => ({ ...p, rewardCoinsMax: Number(e.target.value || 0) }))} /></div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div>Spawn Channel IDs (comma-separated)</div>
              <input
                style={input}
                value={cfg.spawnChannelIds.join(",")}
                onChange={(e) => setCfg((p) => ({ ...p, spawnChannelIds: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }))}
              />
            </div>
          </section>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Rare Spawn"}
          </button>
        </div>
      )}
    </div>
  );
}
