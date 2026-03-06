"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string; type?: number | string };

type DominionCfg = {
  enabled: boolean;
  seasonsEnabled: boolean;
  seasonLengthDays: number;
  raidWindows: string[];
  basePayout: number;
  territoryDecayHours: number;
  announceChannelId: string;
};

const DEFAULT_DOMINION: DominionCfg = {
  enabled: true,
  seasonsEnabled: false,
  seasonLengthDays: 30,
  raidWindows: ["Fri 20:00-22:00", "Sat 20:00-22:00"],
  basePayout: 500,
  territoryDecayHours: 48,
  announceChannelId: "",
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };

export default function DominionEnginePage() {
  const [guildId, setGuildId] = useState("");
  const [active, setActive] = useState(true);
  const [cfg, setCfg] = useState<DominionCfg>(DEFAULT_DOMINION);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const [govRes, gdRes] = await Promise.all([
          fetch(`/api/setup/governance-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const govJson = await govRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        setActive(govJson?.config?.active ?? true);
        setCfg({ ...DEFAULT_DOMINION, ...(govJson?.config?.dominion || {}) });
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load dominion config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  const raidWindowsText = (cfg.raidWindows || []).join("\n");

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/setup/governance-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { active, dominion: cfg } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setActive(json?.config?.active ?? active);
      setCfg({ ...DEFAULT_DOMINION, ...(json?.config?.dominion || cfg) });
      setMsg("Dominion engine settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Dominion Engine</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {typeof window !== "undefined" ? (localStorage.getItem("activeGuildName") || guildId) : guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>Standalone dominion raid/alliance controls. Saves only dominion block of governance-config.</div>
      {msg ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{msg}</div> : null}

      {loading ? (
        <div style={card}>Loading dominion...</div>
      ) : (
        <>
          <section style={card}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Governance Active</label>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Dominion Enabled</label>
              <label><input type="checkbox" checked={cfg.seasonsEnabled} onChange={(e) => setCfg((p) => ({ ...p, seasonsEnabled: e.target.checked }))} /> Seasons Enabled</label>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Season Length (days)</div>
                <input style={input} type="number" min={1} value={cfg.seasonLengthDays} onChange={(e) => setCfg((p) => ({ ...p, seasonLengthDays: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Base Payout (coins)</div>
                <input style={input} type="number" min={0} value={cfg.basePayout} onChange={(e) => setCfg((p) => ({ ...p, basePayout: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Territory Decay (hours)</div>
                <input style={input} type="number" min={1} value={cfg.territoryDecayHours} onChange={(e) => setCfg((p) => ({ ...p, territoryDecayHours: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Announce Channel</div>
                <select style={input} value={cfg.announceChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, announceChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ marginBottom: 6 }}>Raid Windows (one per line)</div>
            <textarea
              style={{ ...input, minHeight: 140, fontFamily: "monospace" }}
              value={raidWindowsText}
              onChange={(e) => setCfg((p) => ({ ...p, raidWindows: e.target.value.split(/\n+/).map((s) => s.trim()).filter(Boolean) }))}
            />
            <div style={{ color: "#ffb4b4", fontSize: 12, marginTop: 6 }}>Format example: "Fri 20:00-22:00". Entries are kept in order.</div>
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}
            >
              {saving ? "Saving..." : "Save Dominion"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}