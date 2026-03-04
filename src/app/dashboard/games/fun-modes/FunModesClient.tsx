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
        setMsg(e?.message || "Failed loading fun modes config.");
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
      const r = await fetch("/api/setup/fun-modes-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config || cfg) });
      setMsg("Fun modes saved.");
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
        <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ff2f2f" }}>Fun Modes</h1>
        <button onClick={saveAll} disabled={saving} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontWeight: 900 }}>
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}
      {loading ? <div>Loading...</div> : null}

      {!loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          {(["range", "truthDare", "gunGame", "carol"] as const).map((key) => (
            <section key={key} style={cardStyle}>
              <h3 style={titleStyle}>{key === "truthDare" ? "Truth / Dare" : key.toUpperCase()}</h3>
              <label><input type="checkbox" checked={(cfg as any)[key].enabled} onChange={(e) => setCfg((p) => ({ ...p, [key]: { ...(p as any)[key], enabled: e.target.checked } } as any))} /> Enabled</label>
              {"channelId" in (cfg as any)[key] ? (
                <select style={{ ...inputStyle, marginTop: 8 }} value={(cfg as any)[key].channelId || ""} onChange={(e) => setCfg((p) => ({ ...p, [key]: { ...(p as any)[key], channelId: e.target.value } } as any))}>
                  <option value="">Select channel</option>
                  {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              ) : null}
            </section>
          ))}
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
