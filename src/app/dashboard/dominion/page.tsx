"use client";

import { useMemo } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type DominionCfg = {
  enabled: boolean;
  seasonsEnabled: boolean;
  seasonLengthDays: number;
  raidWindows: string[];
  basePayout: number;
  territoryDecayHours: number;
  announceChannelId: string;
  defaultRaidDurationMinutes: number;
  defaultRaidHealthPool: number;
  defaultRaidMaxTheft: number;
};

const DEFAULT_DOMINION: DominionCfg = {
  enabled: true,
  seasonsEnabled: false,
  seasonLengthDays: 30,
  raidWindows: ["Fri 20:00-22:00", "Sat 20:00-22:00"],
  basePayout: 500,
  territoryDecayHours: 48,
  announceChannelId: "",
  defaultRaidDurationMinutes: 30,
  defaultRaidHealthPool: 5000,
  defaultRaidMaxTheft: 5000,
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };

export default function DominionEnginePage() {
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
  } = useGuildEngineEditor<DominionCfg>("dominion", DEFAULT_DOMINION);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Dominion Engine</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Real dominion runtime controls with live raids, territories, leaderboard state, and season reset.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading dominion...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Dominion Enabled</label>
              <label><input type="checkbox" checked={cfg.seasonsEnabled} onChange={(e) => setCfg((p) => ({ ...p, seasonsEnabled: e.target.checked }))} /> Seasons Enabled</label>
              <button onClick={() => runAction("resetSeason")} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800 }}>
                Reset Season
              </button>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <div><div style={{ marginBottom: 6 }}>Season Length (days)</div><input style={input} type="number" min={1} value={cfg.seasonLengthDays} onChange={(e) => setCfg((p) => ({ ...p, seasonLengthDays: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Base Payout (coins)</div><input style={input} type="number" min={0} value={cfg.basePayout} onChange={(e) => setCfg((p) => ({ ...p, basePayout: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Territory Decay (hours)</div><input style={input} type="number" min={1} value={cfg.territoryDecayHours} onChange={(e) => setCfg((p) => ({ ...p, territoryDecayHours: Number(e.target.value || 0) }))} /></div>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div><div style={{ marginBottom: 6 }}>Default Raid Minutes</div><input style={input} type="number" min={1} value={cfg.defaultRaidDurationMinutes} onChange={(e) => setCfg((p) => ({ ...p, defaultRaidDurationMinutes: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Default Raid Health</div><input style={input} type="number" min={1} value={cfg.defaultRaidHealthPool} onChange={(e) => setCfg((p) => ({ ...p, defaultRaidHealthPool: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Default Max Theft</div><input style={input} type="number" min={1} value={cfg.defaultRaidMaxTheft} onChange={(e) => setCfg((p) => ({ ...p, defaultRaidMaxTheft: Number(e.target.value || 0) }))} /></div>
            </div>
          </section>

          <section style={card}>
            <div style={{ marginBottom: 6 }}>Raid Windows (one per line)</div>
            <textarea
              style={{ ...input, minHeight: 140, fontFamily: "monospace" }}
              value={(cfg.raidWindows || []).join("\n")}
              onChange={(e) => setCfg((p) => ({ ...p, raidWindows: e.target.value.split(/\n+/).map((s) => s.trim()).filter(Boolean) }))}
            />
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Dominion"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
