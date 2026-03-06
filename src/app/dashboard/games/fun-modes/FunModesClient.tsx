"use client";

import { useEffect, useState } from "react";

type FunConfig = {
  range: { enabled: boolean; channelId: string; cooldownSeconds: number; maxScorePerRound: number };
  truthDare: { enabled: boolean; channelId: string; truthPool: string; darePool: string };
  gunGame: { enabled: boolean; channelId: string; roundMinutes: number; respawnSeconds: number };
  carol: { enabled: boolean; channelId: string; eventMultiplier: number; bonusWindowMinutes: number };
};

type Channel = { id: string; name: string; type?: number | string };

const EMPTY: FunConfig = {
  range: { enabled: false, channelId: "", cooldownSeconds: 10, maxScorePerRound: 100 },
  truthDare: { enabled: false, channelId: "", truthPool: "", darePool: "" },
  gunGame: { enabled: false, channelId: "", roundMinutes: 10, respawnSeconds: 5 },
  carol: { enabled: false, channelId: "", eventMultiplier: 1.0, bonusWindowMinutes: 30 }
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

export default function FunModesClient() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<FunConfig>(EMPTY);
  const [channels, setChannels] = useState<Channel[]>([]);
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
          fetch(`/api/setup/fun-modes-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        setCfg({ ...EMPTY, ...(cfgJson?.config || {}) });
        setChannels((Array.isArray(gdJson?.channels) ? gdJson.channels : []).filter((c: any) => Number(c?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed loading game engines config.");
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
      // Keep range + gungame synchronized to avoid overlap drift.
      const patch: FunConfig = {
        ...cfg,
        range: {
          ...cfg.range,
          enabled: cfg.gunGame.enabled,
          channelId: cfg.gunGame.channelId || cfg.range.channelId,
        },
      };

      const r = await fetch("/api/setup/fun-modes-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config || patch) });
      setMsg("Game engines saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ maxWidth: 1200, color: "#ffcaca" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ff2f2f" }}>Game Engines</h1>
        <button onClick={saveAll} disabled={saving} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontWeight: 900 }}>
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}
      {loading ? <div>Loading...</div> : null}

      {!loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={cardStyle}>
            <h3 style={titleStyle}>Truth / Dare</h3>
            <label><input type="checkbox" checked={cfg.truthDare.enabled} onChange={(e) => setCfg((p) => ({ ...p, truthDare: { ...p.truthDare, enabled: e.target.checked } }))} /> Enabled</label>
            <select style={{ ...inputStyle, marginTop: 8 }} value={cfg.truthDare.channelId || ""} onChange={(e) => setCfg((p) => ({ ...p, truthDare: { ...p.truthDare, channelId: e.target.value } }))}>
              <option value="">Select channel</option>
              {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              <textarea style={{ ...inputStyle, minHeight: 84 }} value={cfg.truthDare.truthPool} onChange={(e) => setCfg((p) => ({ ...p, truthDare: { ...p.truthDare, truthPool: e.target.value } }))} placeholder="Truth prompts (one per line)" />
              <textarea style={{ ...inputStyle, minHeight: 84 }} value={cfg.truthDare.darePool} onChange={(e) => setCfg((p) => ({ ...p, truthDare: { ...p.truthDare, darePool: e.target.value } }))} placeholder="Dare prompts (one per line)" />
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={titleStyle}>Gun Game (Range Engine)</h3>
            <label><input type="checkbox" checked={cfg.gunGame.enabled} onChange={(e) => setCfg((p) => ({ ...p, gunGame: { ...p.gunGame, enabled: e.target.checked }, range: { ...p.range, enabled: e.target.checked } }))} /> Enabled</label>
            <select style={{ ...inputStyle, marginTop: 8 }} value={cfg.gunGame.channelId || ""} onChange={(e) => setCfg((p) => ({ ...p, gunGame: { ...p.gunGame, channelId: e.target.value }, range: { ...p.range, channelId: e.target.value } }))}>
              <option value="">Select channel</option>
              {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <input style={inputStyle} type="number" value={cfg.gunGame.roundMinutes} onChange={(e) => setCfg((p) => ({ ...p, gunGame: { ...p.gunGame, roundMinutes: Number(e.target.value || 0) } }))} placeholder="Round minutes" />
              <input style={inputStyle} type="number" value={cfg.gunGame.respawnSeconds} onChange={(e) => setCfg((p) => ({ ...p, gunGame: { ...p.gunGame, respawnSeconds: Number(e.target.value || 0) } }))} placeholder="Respawn seconds" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <input style={inputStyle} type="number" value={cfg.range.cooldownSeconds} onChange={(e) => setCfg((p) => ({ ...p, range: { ...p.range, cooldownSeconds: Number(e.target.value || 0) } }))} placeholder="Range cooldown seconds" />
              <input style={inputStyle} type="number" value={cfg.range.maxScorePerRound} onChange={(e) => setCfg((p) => ({ ...p, range: { ...p.range, maxScorePerRound: Number(e.target.value || 0) } }))} placeholder="Range max score per round" />
            </div>
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
