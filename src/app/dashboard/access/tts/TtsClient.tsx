"use client";

import { useMemo } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type TtsConfig = {
  enabled: boolean;
  commandEnabled: boolean;
  defaultVoice: string;
  maxCharsPerMessage: number;
  allowedChannelIds: string[];
  blockedChannelIds: string[];
  allowedRoleIds: string[];
  voiceChannelOnly: boolean;
  requirePrefix: boolean;
  prefix: string;
};

const DEFAULT_CONFIG: TtsConfig = {
  enabled: false,
  commandEnabled: true,
  defaultVoice: "female",
  maxCharsPerMessage: 300,
  allowedChannelIds: [],
  blockedChannelIds: [],
  allowedRoleIds: [],
  voiceChannelOnly: false,
  requirePrefix: true,
  prefix: "??",
};

const shell: React.CSSProperties = { color: "#ffd0d0", maxWidth: 1280, padding: 16 };
const card: React.CSSProperties = { border: "1px solid #5a0000", borderRadius: 12, padding: 16, background: "rgba(90,0,0,0.12)", marginBottom: 14 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd1d1", border: "1px solid #6f0000", borderRadius: 8 };

function toggle(list: string[], id: string) {
  const set = new Set(list || []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return Array.from(set);
}

export default function TtsAccessPage() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    roles,
    channels,
    summary,
    details,
    loading,
    saving,
    message,
    save,
  } = useGuildEngineEditor<TtsConfig>("tts", DEFAULT_CONFIG);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  if (!guildId) return <div style={shell}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ marginTop: 0, color: "#ff4444", textTransform: "uppercase", letterSpacing: "0.14em" }}>TTS Engine</h1>
      <div style={{ color: "#ff9999" }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Real bot controls for message gating, default voice, route defaults, and TTS command availability. Route creation still happens from the Discord TTS workflow.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={{ ...card, marginTop: 12 }}>Loading TTS...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Engine Enabled</label>
              <label><input type="checkbox" checked={cfg.commandEnabled} onChange={(e) => setCfg((p) => ({ ...p, commandEnabled: e.target.checked }))} /> Slash Command Enabled</label>
              <label><input type="checkbox" checked={cfg.voiceChannelOnly} onChange={(e) => setCfg((p) => ({ ...p, voiceChannelOnly: e.target.checked }))} /> Voice Channel Required</label>
              <label><input type="checkbox" checked={cfg.requirePrefix} onChange={(e) => setCfg((p) => ({ ...p, requirePrefix: e.target.checked }))} /> Require Prefix</label>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Default Voice</div>
                <input style={input} value={cfg.defaultVoice} onChange={(e) => setCfg((p) => ({ ...p, defaultVoice: e.target.value }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Prefix</div>
                <input style={input} value={cfg.prefix} onChange={(e) => setCfg((p) => ({ ...p, prefix: e.target.value }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Max Characters Per Message</div>
                <input style={input} type="number" min={1} value={cfg.maxCharsPerMessage} onChange={(e) => setCfg((p) => ({ ...p, maxCharsPerMessage: Number(e.target.value || 0) }))} />
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Allowed Channels</div>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
              {textChannels.map((channel) => (
                <label key={`allow_${channel.id}`} style={{ display: "block", marginBottom: 4 }}>
                  <input type="checkbox" checked={cfg.allowedChannelIds.includes(channel.id)} onChange={() => setCfg((p) => ({ ...p, allowedChannelIds: toggle(p.allowedChannelIds, channel.id) }))} /> #{channel.name}
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Blocked Channels</div>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
              {textChannels.map((channel) => (
                <label key={`block_${channel.id}`} style={{ display: "block", marginBottom: 4 }}>
                  <input type="checkbox" checked={cfg.blockedChannelIds.includes(channel.id)} onChange={() => setCfg((p) => ({ ...p, blockedChannelIds: toggle(p.blockedChannelIds, channel.id) }))} /> #{channel.name}
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Allowed Roles</div>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
              {roles.map((role) => (
                <label key={`role_${role.id}`} style={{ display: "block", marginBottom: 4 }}>
                  <input type="checkbox" checked={cfg.allowedRoleIds.includes(role.id)} onChange={() => setCfg((p) => ({ ...p, allowedRoleIds: toggle(p.allowedRoleIds, role.id) }))} /> @{role.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ ...card, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save TTS"}
            </button>
            <button onClick={() => save({ enabled: false, commandEnabled: false })} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", borderColor: "#a00000", color: "#ff8a8a" }}>
              Emergency Off
            </button>
          </div>
        </>
      )}
    </div>
  );
}
