"use client";

import { useEffect, useState } from "react";

type EventCfg = {
  active: boolean;
  listeners: {
    messageCreate: boolean;
    interactionCreate: boolean;
    guildMemberAdd: boolean;
    guildMemberRemove: boolean;
  };
  retries: { enabled: boolean; maxRetries: number; baseDelayMs: number };
  deadLetter: { enabled: boolean; maxAgeHours: number; channelId: string };
};

type Channel = { id: string; name: string; type?: number | string };

const EMPTY: EventCfg = {
  active: true,
  listeners: { messageCreate: true, interactionCreate: true, guildMemberAdd: true, guildMemberRemove: true },
  retries: { enabled: true, maxRetries: 2, baseDelayMs: 250 },
  deadLetter: { enabled: true, maxAgeHours: 24, channelId: "" },
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

export default function EventReactorPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<EventCfg>(EMPTY);
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
          fetch(`/api/setup/event-routing-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const c = await cfgRes.json().catch(() => ({}));
        const g = await gdRes.json().catch(() => ({}));
        setCfg({ ...EMPTY, ...(c?.config || {}) });
        setChannels((Array.isArray(g?.channels) ? g.channels : []).filter((x: any) => Number(x?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load Event Reactor config.");
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
      const r = await fetch("/api/setup/event-routing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config || cfg) });
      setMsg("Event Reactor config saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Event Reactor Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={box}>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Active</label>
            <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.listeners.messageCreate} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, messageCreate: e.target.checked } }))} /> messageCreate</label>
              <label><input type="checkbox" checked={cfg.listeners.interactionCreate} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, interactionCreate: e.target.checked } }))} /> interactionCreate</label>
              <label><input type="checkbox" checked={cfg.listeners.guildMemberAdd} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, guildMemberAdd: e.target.checked } }))} /> guildMemberAdd</label>
              <label><input type="checkbox" checked={cfg.listeners.guildMemberRemove} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, guildMemberRemove: e.target.checked } }))} /> guildMemberRemove</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div><div>Max Retries</div><input style={input} type="number" value={cfg.retries.maxRetries} onChange={(e) => setCfg((p) => ({ ...p, retries: { ...p.retries, maxRetries: Number(e.target.value || 0) } }))} /></div>
              <div><div>Base Delay (ms)</div><input style={input} type="number" value={cfg.retries.baseDelayMs} onChange={(e) => setCfg((p) => ({ ...p, retries: { ...p.retries, baseDelayMs: Number(e.target.value || 0) } }))} /></div>
              <div><div>Dead Letter Max Age (hours)</div><input style={input} type="number" value={cfg.deadLetter.maxAgeHours} onChange={(e) => setCfg((p) => ({ ...p, deadLetter: { ...p.deadLetter, maxAgeHours: Number(e.target.value || 0) } }))} /></div>
              <div><div>Dead Letter Channel</div><select style={input} value={cfg.deadLetter.channelId || ""} onChange={(e) => setCfg((p) => ({ ...p, deadLetter: { ...p.deadLetter, channelId: e.target.value } }))}><option value="">Select channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
            </div>
          </section>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Event Reactor"}
          </button>
        </div>
      )}
    </div>
  );
}
