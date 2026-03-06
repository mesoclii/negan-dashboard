"use client";

import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type RangeCfg = {
  enabled: boolean;
  allowedChannelIds: string[];
  winningPoints: number;
  shootCooldownMs: number;
  defaultWeapon: string;
};

const EMPTY: RangeCfg = {
  enabled: true,
  allowedChannelIds: [],
  winningPoints: 150,
  shootCooldownMs: 2000,
  defaultWeapon: "rifle",
};

const box: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)", marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

function toggle(list: string[], id: string) {
  const set = new Set(list || []);
  if (set.has(id)) set.delete(id); else set.add(id);
  return Array.from(set);
}

export default function RangeEnginePage() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    channels,
    summary,
    details,
    loading,
    saving,
    message,
    save,
  } = useGuildEngineEditor<RangeCfg>("range", EMPTY);

  const textChannels = channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text"));

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Range Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? <div style={box}>Loading...</div> : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...box, marginTop: 12 }}>
            <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Enabled</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 10 }}>
              <div><div>Winning Points</div><input style={input} type="number" min={1} value={cfg.winningPoints} onChange={(e) => setCfg((p) => ({ ...p, winningPoints: Number(e.target.value || 0) }))} /></div>
              <div><div>Shoot Cooldown (ms)</div><input style={input} type="number" min={0} value={cfg.shootCooldownMs} onChange={(e) => setCfg((p) => ({ ...p, shootCooldownMs: Number(e.target.value || 0) }))} /></div>
              <div><div>Default Weapon</div><input style={input} value={cfg.defaultWeapon} onChange={(e) => setCfg((p) => ({ ...p, defaultWeapon: e.target.value }))} /></div>
            </div>
          </section>

          <section style={box}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Allowed Channels</div>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
              {textChannels.map((c) => (
                <label key={c.id} style={{ display: "block", marginBottom: 4 }}>
                  <input type="checkbox" checked={cfg.allowedChannelIds.includes(c.id)} onChange={() => setCfg((p) => ({ ...p, allowedChannelIds: toggle(p.allowedChannelIds, c.id) }))} /> #{c.name}
                </label>
              ))}
            </div>
          </section>

          <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Range"}
          </button>
        </>
      )}
    </div>
  );
}
