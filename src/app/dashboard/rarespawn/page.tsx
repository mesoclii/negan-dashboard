"use client";

import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type RareSpawnCfg = {
  enabled: boolean;
  minMinutes: number;
  maxMinutes: number;
  rewardCoinsMin: number;
  rewardCoinsMax: number;
  channels: string[];
  categories: string[];
  logChannelId: string;
};

const EMPTY: RareSpawnCfg = {
  enabled: true,
  minMinutes: 30,
  maxMinutes: 90,
  rewardCoinsMin: 150,
  rewardCoinsMax: 450,
  channels: [],
  categories: [],
  logChannelId: "",
};

const box: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)", marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

function toggle(list: string[], id: string) {
  const set = new Set(list || []);
  if (set.has(id)) set.delete(id); else set.add(id);
  return Array.from(set);
}

export default function RareSpawnEnginePage() {
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
    runAction,
  } = useGuildEngineEditor<RareSpawnCfg>("rareSpawn", EMPTY);

  const textChannels = channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text"));
  const categories = channels.filter((c) => Number(c?.type) === 4 || String(c?.type || "").toLowerCase().includes("category"));

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Rare Spawn Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? <div style={box}>Loading...</div> : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...box, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Enabled</label>
              <button onClick={() => runAction("spawnNow")} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800 }}>Spawn Now</button>
            </div>
          </section>

          <section style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div><div>Minimum Minutes</div><input style={input} type="number" value={cfg.minMinutes} onChange={(e) => setCfg((p) => ({ ...p, minMinutes: Number(e.target.value || 0) }))} /></div>
              <div><div>Maximum Minutes</div><input style={input} type="number" value={cfg.maxMinutes} onChange={(e) => setCfg((p) => ({ ...p, maxMinutes: Number(e.target.value || 0) }))} /></div>
              <div><div>Reward Coins Min</div><input style={input} type="number" value={cfg.rewardCoinsMin} onChange={(e) => setCfg((p) => ({ ...p, rewardCoinsMin: Number(e.target.value || 0) }))} /></div>
              <div><div>Reward Coins Max</div><input style={input} type="number" value={cfg.rewardCoinsMax} onChange={(e) => setCfg((p) => ({ ...p, rewardCoinsMax: Number(e.target.value || 0) }))} /></div>
            </div>
          </section>

          <section style={box}>
            <div style={{ marginBottom: 6 }}>Log Channel</div>
            <select style={input} value={cfg.logChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, logChannelId: e.target.value }))}>
              <option value="">None</option>
              {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </section>

          <section style={box}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Spawn Channels</div>
            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
              {textChannels.map((c) => (
                <label key={c.id} style={{ display: "block", marginBottom: 4 }}>
                  <input type="checkbox" checked={cfg.channels.includes(c.id)} onChange={() => setCfg((p) => ({ ...p, channels: toggle(p.channels, c.id) }))} /> #{c.name}
                </label>
              ))}
            </div>
          </section>

          <section style={box}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Spawn Categories</div>
            <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
              {categories.map((c) => (
                <label key={c.id} style={{ display: "block", marginBottom: 4 }}>
                  <input type="checkbox" checked={cfg.categories.includes(c.id)} onChange={() => setCfg((p) => ({ ...p, categories: toggle(p.categories, c.id) }))} /> {c.name}
                </label>
              ))}
            </div>
          </section>

          <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Rare Spawn"}
          </button>
        </>
      )}
    </div>
  );
}
