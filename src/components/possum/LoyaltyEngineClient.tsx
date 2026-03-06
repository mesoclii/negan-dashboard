"use client";

import { useEffect, useState } from "react";

type Channel = { id: string; name: string; type?: number | string };

type LoyaltyConfig = {
  active: boolean;
  timezone: string;
  announceChannelId: string;
  heistExemptRoleId: string;
  heistExemptDays: number;
  yearRewardRoleId: string;
  yearRewardDays: number;
  notes: string;
};

const EMPTY: LoyaltyConfig = {
  active: true,
  timezone: "America/Los_Angeles",
  announceChannelId: "",
  heistExemptRoleId: "",
  heistExemptDays: 7,
  yearRewardRoleId: "",
  yearRewardDays: 30,
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

export default function LoyaltyEngineClient() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<LoyaltyConfig>(EMPTY);
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
          fetch(`/api/setup/loyalty-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        setCfg({ ...EMPTY, ...(cfgJson?.config || {}) });
        setChannels((Array.isArray(gdJson?.channels) ? gdJson.channels : []).filter((c: any) => Number(c?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load loyalty config.");
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
      const r = await fetch("/api/setup/loyalty-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config || cfg) });
      setMsg("Loyalty engine settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Loyalty Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginBottom: 12 }}>VIP is a separate engine. This page configures loyalty milestone behavior surfaced for VIP + loyalty flow.</div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={box}>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Loyalty Processing Enabled</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div><div>Timezone</div><input style={input} value={cfg.timezone} onChange={(e) => setCfg((p) => ({ ...p, timezone: e.target.value }))} /></div>
              <div><div>Announce Channel</div><select style={input} value={cfg.announceChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, announceChannelId: e.target.value }))}><option value="">Select channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
              <div><div>Heist Exempt Role ID</div><input style={input} value={cfg.heistExemptRoleId} onChange={(e) => setCfg((p) => ({ ...p, heistExemptRoleId: e.target.value }))} /></div>
              <div><div>Heist Exempt Days</div><input style={input} type="number" value={cfg.heistExemptDays} onChange={(e) => setCfg((p) => ({ ...p, heistExemptDays: Number(e.target.value || 0) }))} /></div>
              <div><div>Year Reward Role ID</div><input style={input} value={cfg.yearRewardRoleId} onChange={(e) => setCfg((p) => ({ ...p, yearRewardRoleId: e.target.value }))} /></div>
              <div><div>Year Reward Days</div><input style={input} type="number" value={cfg.yearRewardDays} onChange={(e) => setCfg((p) => ({ ...p, yearRewardDays: Number(e.target.value || 0) }))} /></div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div>Notes</div>
              <textarea style={{ ...input, minHeight: 100 }} value={cfg.notes} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </section>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Loyalty"}
          </button>
        </div>
      )}
    </div>
  );
}
