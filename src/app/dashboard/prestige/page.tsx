"use client";

import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type PrestigeCfg = {
  enabled: boolean;
  maxLevel: number;
  announceChannelId: string;
  roleRewards: Record<string, string>;
};

const DEFAULT_PRESTIGE: PrestigeCfg = {
  enabled: true,
  maxLevel: 50,
  announceChannelId: "",
  roleRewards: {},
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)", marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

function roleRewardsToText(value: Record<string, string>) {
  return Object.entries(value || {}).map(([level, roleId]) => `${level}:${roleId}`).join("\n");
}

function textToRoleRewards(text: string) {
  return text.split(/\n+/).reduce<Record<string, string>>((out, line) => {
    const [level, roleId] = line.split(":").map((part) => String(part || "").trim());
    if (level && roleId) out[level] = roleId;
    return out;
  }, {});
}

export default function PrestigePage() {
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
  } = useGuildEngineEditor<PrestigeCfg>("prestige", DEFAULT_PRESTIGE);

  const textChannels = channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text"));

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Prestige Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? <div style={card}>Loading...</div> : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Prestige Enabled</label>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Required Max Level</div>
                <input style={input} type="number" min={1} value={cfg.maxLevel} onChange={(e) => setCfg((p) => ({ ...p, maxLevel: Number(e.target.value || 0) }))} />
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
            <div style={{ marginBottom: 6 }}>Role Rewards (one per line, `prestige:roleId`)</div>
            <textarea
              style={{ ...input, minHeight: 120, fontFamily: "monospace" }}
              value={roleRewardsToText(cfg.roleRewards)}
              onChange={(e) => setCfg((p) => ({ ...p, roleRewards: textToRoleRewards(e.target.value) }))}
            />
          </section>

          <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Prestige"}
          </button>
        </>
      )}
    </div>
  );
}
