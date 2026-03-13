"use client";

import { useMemo, useState } from "react";
import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type SignalSource = {
  id?: string;
  enabled?: boolean;
  label?: string;
  provider?: string;
  channelId?: string;
  feedUrl?: string;
  postAsEmbed?: boolean;
  includeSummary?: boolean;
  pollMinutes?: number;
};

type SignalRelayConfig = {
  active: boolean;
  pollIntervalMinutes: number;
  sourceDefaults: {
    color: string;
    mentionRoleId: string;
    includeSummary: boolean;
    postAsEmbed: boolean;
    footerText: string;
  };
  sources: SignalSource[];
  notes: string;
};

type Channel = { id: string; name: string; type?: number | string };
type Role = { id: string; name: string };

const DEFAULT_CONFIG: SignalRelayConfig = {
  active: false,
  pollIntervalMinutes: 15,
  sourceDefaults: {
    color: "#4fd1c5",
    mentionRoleId: "",
    includeSummary: true,
    postAsEmbed: true,
    footerText: "Signal Relay",
  },
  sources: [],
  notes: "",
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1280 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };
const button: React.CSSProperties = { ...input, width: "auto", cursor: "pointer", fontWeight: 800 };
const micro: React.CSSProperties = { fontSize: 12, color: "#ffb2b2", lineHeight: 1.6 };

function labelForChannel(channels: Channel[], channelId: string) {
  const found = channels.find((entry) => entry.id === channelId);
  return found ? `#${found.name}` : (channelId || "Not set");
}

export default function SignalRelayClient() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    channels,
    roles,
    summary,
    details,
    loading,
    saving,
    message,
    save,
    runAction,
  } = useGuildEngineEditor<SignalRelayConfig>("signalRelay", DEFAULT_CONFIG);

  const [selectedSourceId, setSelectedSourceId] = useState("");
  const channelList = useMemo(() => channels as Channel[], [channels]);
  const roleList = useMemo(() => roles as Role[], [roles]);

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Signal Relay</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Feed-driven creator and community dispatches. This stays intentionally different from MEE6 by leaning on configurable feed sources instead of a cloned alert stack.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading Signal Relay...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} showDetails />

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, alignItems: "end" }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((prev) => ({ ...prev, active: e.target.checked }))} /> Signal Relay Active</label>
              <label><input type="checkbox" checked={cfg.sourceDefaults.includeSummary} onChange={(e) => setCfg((prev) => ({ ...prev, sourceDefaults: { ...prev.sourceDefaults, includeSummary: e.target.checked } }))} /> Include Summary By Default</label>
              <label><input type="checkbox" checked={cfg.sourceDefaults.postAsEmbed} onChange={(e) => setCfg((prev) => ({ ...prev, sourceDefaults: { ...prev.sourceDefaults, postAsEmbed: e.target.checked } }))} /> Post Embeds By Default</label>
              <div>
                <div style={{ marginBottom: 6 }}>Default Poll Minutes</div>
                <input style={input} type="number" min={1} value={cfg.pollIntervalMinutes} onChange={(e) => setCfg((prev) => ({ ...prev, pollIntervalMinutes: Number(e.target.value || 1) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Default Color</div>
                <input style={input} value={cfg.sourceDefaults.color} onChange={(e) => setCfg((prev) => ({ ...prev, sourceDefaults: { ...prev.sourceDefaults, color: e.target.value } }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Default Mention Role</div>
                <select style={input} value={cfg.sourceDefaults.mentionRoleId} onChange={(e) => setCfg((prev) => ({ ...prev, sourceDefaults: { ...prev.sourceDefaults, mentionRoleId: e.target.value } }))}>
                  <option value="">No role ping</option>
                  {roleList.map((role) => <option key={role.id} value={role.id}>@{role.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Default Footer</div>
                <input style={input} value={cfg.sourceDefaults.footerText} onChange={(e) => setCfg((prev) => ({ ...prev, sourceDefaults: { ...prev.sourceDefaults, footerText: e.target.value } }))} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6 }}>Operator Notes</div>
              <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Run Relay</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("checkNow")}>Run All Sources</button>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("resetSeen")}>Reset All Seen</button>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Per-Source Control</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select style={input} value={selectedSourceId} onChange={(e) => setSelectedSourceId(e.target.value)}>
                    <option value="">Choose source</option>
                    {cfg.sources.map((entry, index) => (
                      <option key={entry.id || index} value={entry.id || ""}>{entry.label || entry.id || `Source ${index + 1}`}</option>
                    ))}
                  </select>
                  <button type="button" style={button} disabled={saving || !selectedSourceId} onClick={() => void runAction("checkNow", { sourceId: selectedSourceId })}>Run</button>
                  <button type="button" style={button} disabled={saving || !selectedSourceId} onClick={() => void runAction("resetSeen", { sourceId: selectedSourceId })}>Reset Seen</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, ...micro }}>
              Source definitions stay in the advanced config editor below so the feed runtime remains stable and we do not accidentally alter the bot&apos;s existing event surfaces.
            </div>
          </section>

          <section style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Configured Sources</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
              {cfg.sources.length ? cfg.sources.slice(0, 12).map((entry, index) => (
                <div key={entry.id || index} style={{ border: "1px solid #742222", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 700 }}>{entry.label || entry.id || `Source ${index + 1}`}</div>
                  <div style={micro}>{String(entry.provider || "rss").toUpperCase()} | {labelForChannel(channelList, String(entry.channelId || ""))}</div>
                  <div style={micro}>{entry.postAsEmbed === false ? "text dispatch" : "embed dispatch"} | every {entry.pollMinutes || cfg.pollIntervalMinutes} min</div>
                  <div style={micro}>{entry.includeSummary === false ? "summary off" : "summary on"} | {entry.enabled === false ? "disabled" : "enabled"}</div>
                </div>
              )) : <div style={micro}>No signal sources configured yet.</div>}
            </div>
          </section>

          <section style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" style={button} disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : "Save Signal Relay"}</button>
          </section>

          <ConfigJsonEditor
            title="Advanced Signal Relay Config"
            value={cfg}
            disabled={saving}
            onApply={(next) => setCfg({ ...DEFAULT_CONFIG, ...(next as SignalRelayConfig) })}
          />
        </>
      )}
    </div>
  );
}
