"use client";

import { useEffect, useState } from "react";

type PrestigeCfg = {
  active: boolean;
  achievementsEnabled: boolean;
  badgePanelEnabled: boolean;
  announceChannelId: string;
  notes: string;
};

type Channel = { id: string; name: string; type?: number | string };

const EMPTY: PrestigeCfg = {
  active: true,
  achievementsEnabled: true,
  badgePanelEnabled: false,
  announceChannelId: "",
  notes: "",
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

export default function PrestigePage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<PrestigeCfg>(EMPTY);
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
        const [progRes, gdRes] = await Promise.all([
          fetch(`/api/setup/progression-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const p = await progRes.json().catch(() => ({}));
        const g = await gdRes.json().catch(() => ({}));
        setCfg({
          active: !!p?.config?.active,
          achievementsEnabled: !!p?.config?.achievements?.enabled,
          badgePanelEnabled: !!p?.config?.badges?.panelEnabled,
          announceChannelId: String(p?.config?.achievements?.announceChannelId || ""),
          notes: String(p?.config?.notes || ""),
        });
        setChannels((Array.isArray(g?.channels) ? g.channels : []).filter((c: any) => Number(c?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load prestige config.");
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
      const patch = {
        active: cfg.active,
        achievements: { enabled: cfg.achievementsEnabled, announceChannelId: cfg.announceChannelId },
        badges: { panelEnabled: cfg.badgePanelEnabled },
        notes: cfg.notes,
      };
      const r = await fetch("/api/setup/progression-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Prestige/Progression config saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Prestige Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={box}>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Progression Active</label>
            <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.achievementsEnabled} onChange={(e) => setCfg((p) => ({ ...p, achievementsEnabled: e.target.checked }))} /> Achievements Enabled</label>
              <label><input type="checkbox" checked={cfg.badgePanelEnabled} onChange={(e) => setCfg((p) => ({ ...p, badgePanelEnabled: e.target.checked }))} /> Badge Panel Enabled</label>
            </div>
            <div style={{ marginTop: 10 }}><div>Achievements Announce Channel</div><select style={input} value={cfg.announceChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, announceChannelId: e.target.value }))}><option value="">Select channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
            <div style={{ marginTop: 10 }}><div>Notes</div><textarea style={{ ...input, minHeight: 100 }} value={cfg.notes} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} /></div>
          </section>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Prestige"}
          </button>
        </div>
      )}
    </div>
  );
}
