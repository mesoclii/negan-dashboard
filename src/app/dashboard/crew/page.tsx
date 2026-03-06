"use client";

import { useMemo } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type CrewCfg = {
  enabled: boolean;
  maxCrews: number;
  creationCost: number;
  maxCrewSize: number;
  allowPublicRecruitment: boolean;
  recruitChannelId: string;
  crewRolePrefix: string;
};

const DEFAULT_CREW: CrewCfg = {
  enabled: true,
  maxCrews: 25,
  creationCost: 10000,
  maxCrewSize: 25,
  allowPublicRecruitment: true,
  recruitChannelId: "",
  crewRolePrefix: "Crew",
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };

export default function CrewEnginePage() {
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
  } = useGuildEngineEditor<CrewCfg>("crew", DEFAULT_CREW);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Crew Engine</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Real bot controls for crew creation cost, size limits, recruitment routing, and live crew state.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading crew...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Crew Enabled</label>
              <label><input type="checkbox" checked={cfg.allowPublicRecruitment} onChange={(e) => setCfg((p) => ({ ...p, allowPublicRecruitment: e.target.checked }))} /> Allow public recruitment</label>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Max Crews</div>
                <input style={input} type="number" min={1} value={cfg.maxCrews} onChange={(e) => setCfg((p) => ({ ...p, maxCrews: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Creation Cost (coins)</div>
                <input style={input} type="number" min={0} value={cfg.creationCost} onChange={(e) => setCfg((p) => ({ ...p, creationCost: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Max Crew Size</div>
                <input style={input} type="number" min={1} value={cfg.maxCrewSize} onChange={(e) => setCfg((p) => ({ ...p, maxCrewSize: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Crew Role Prefix</div>
                <input style={input} value={cfg.crewRolePrefix} onChange={(e) => setCfg((p) => ({ ...p, crewRolePrefix: e.target.value }))} />
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, alignItems: "end" }}>
              <div>
                <div style={{ marginBottom: 6 }}>Recruitment Channel</div>
                <select style={input} value={cfg.recruitChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, recruitChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div style={{ color: "#ffb2b2", fontSize: 12 }}>
                Used as the public crew recruiting lane when you leave recruitment enabled.
              </div>
            </div>
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Crew"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
