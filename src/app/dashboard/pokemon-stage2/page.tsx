"use client";

import { useEffect, useState } from "react";

type PokemonCfg = {
  enabled: boolean;
  guildAllowed: boolean;
  privateOnly: boolean;
  stage2Enabled: boolean;
  battleEnabled: boolean;
  tradingEnabled: boolean;
  catchCooldownSeconds: number;
  shinyChancePercent: number;
  legendaryChancePercent: number;
  baseRewardCoins: number;
};

const EMPTY: PokemonCfg = {
  enabled: false,
  guildAllowed: false,
  privateOnly: true,
  stage2Enabled: true,
  battleEnabled: true,
  tradingEnabled: true,
  catchCooldownSeconds: 5,
  shinyChancePercent: 2,
  legendaryChancePercent: 1,
  baseRewardCoins: 50,
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

export default function PokemonStage2Page() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<PokemonCfg>(EMPTY);
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
        const r = await fetch(`/api/setup/games-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        setCfg({ ...EMPTY, ...(j?.config?.pokemon || {}) });
      } catch (e: any) {
        setMsg(e?.message || "Failed to load Pokemon Stage2 config.");
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
        body: JSON.stringify({ guildId, patch: { pokemon: cfg } }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config?.pokemon || cfg) });
      setMsg("Pokemon Stage2 config saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Pokemon Stage2 Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={box}>
            <label><input type="checkbox" checked={cfg.guildAllowed} onChange={(e) => setCfg((p) => ({ ...p, guildAllowed: e.target.checked }))} /> Allow Pokemon in this guild</label>
            <div style={{ marginTop: 8 }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Pokemon Enabled</label>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.stage2Enabled} onChange={(e) => setCfg((p) => ({ ...p, stage2Enabled: e.target.checked }))} /> Stage2 UI</label>
              <label><input type="checkbox" checked={cfg.battleEnabled} onChange={(e) => setCfg((p) => ({ ...p, battleEnabled: e.target.checked }))} /> Battle</label>
              <label><input type="checkbox" checked={cfg.tradingEnabled} onChange={(e) => setCfg((p) => ({ ...p, tradingEnabled: e.target.checked }))} /> Trading</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div><div>Catch Cooldown (seconds)</div><input style={input} type="number" value={cfg.catchCooldownSeconds} onChange={(e) => setCfg((p) => ({ ...p, catchCooldownSeconds: Number(e.target.value || 0) }))} /></div>
              <div><div>Base Reward Coins</div><input style={input} type="number" value={cfg.baseRewardCoins} onChange={(e) => setCfg((p) => ({ ...p, baseRewardCoins: Number(e.target.value || 0) }))} /></div>
              <div><div>Shiny Chance (%)</div><input style={input} type="number" value={cfg.shinyChancePercent} onChange={(e) => setCfg((p) => ({ ...p, shinyChancePercent: Number(e.target.value || 0) }))} /></div>
              <div><div>Legendary Chance (%)</div><input style={input} type="number" value={cfg.legendaryChancePercent} onChange={(e) => setCfg((p) => ({ ...p, legendaryChancePercent: Number(e.target.value || 0) }))} /></div>
            </div>
          </section>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Pokemon Stage2"}
          </button>
        </div>
      )}
    </div>
  );
}
