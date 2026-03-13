"use client";

import { useMemo } from "react";
import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type CounterChannel = {
  id?: string;
  enabled?: boolean;
  channelId?: string;
  metric?: string;
  template?: string;
};

type ChannelFlowConfig = {
  active: boolean;
  counters: {
    enabled: boolean;
    refreshMinutes: number;
    channels: CounterChannel[];
  };
  rooms: {
    enabled: boolean;
    lobbyChannelId: string;
    categoryId: string;
    nameTemplate: string;
    userLimit: number;
    bitrate: number;
    cleanupDelaySeconds: number;
    inheritPermissions: boolean;
  };
  notes: string;
};

type Channel = { id: string; name: string; type?: number | string };

const DEFAULT_CONFIG: ChannelFlowConfig = {
  active: false,
  counters: {
    enabled: false,
    refreshMinutes: 15,
    channels: [],
  },
  rooms: {
    enabled: false,
    lobbyChannelId: "",
    categoryId: "",
    nameTemplate: "{{displayName}} Lounge",
    userLimit: 0,
    bitrate: 64000,
    cleanupDelaySeconds: 12,
    inheritPermissions: true,
  },
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

export default function ChannelFlowClient() {
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
  } = useGuildEngineEditor<ChannelFlowConfig>("channelFlow", DEFAULT_CONFIG);

  const channelList = useMemo(() => channels as Channel[], [channels]);
  const voiceChannels = useMemo(
    () => channelList.filter((channel) => Number(channel?.type) === 2 || Number(channel?.type) === 13 || /voice|stage/i.test(String(channel?.type || ""))),
    [channelList]
  );
  const categoryChannels = useMemo(
    () => channelList.filter((channel) => Number(channel?.type) === 4 || /category/i.test(String(channel?.type || ""))),
    [channelList]
  );

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Channel Flow</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        This engine handles live counters and room-flow voice creation without changing your current command or moderation logic.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading Channel Flow...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} showDetails />

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, alignItems: "end" }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((prev) => ({ ...prev, active: e.target.checked }))} /> Channel Flow Active</label>
              <label><input type="checkbox" checked={cfg.counters.enabled} onChange={(e) => setCfg((prev) => ({ ...prev, counters: { ...prev.counters, enabled: e.target.checked } }))} /> Live Counters Enabled</label>
              <label><input type="checkbox" checked={cfg.rooms.enabled} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, enabled: e.target.checked } }))} /> Room Flow Enabled</label>
              <div>
                <div style={{ marginBottom: 6 }}>Refresh Minutes</div>
                <input style={input} type="number" min={1} value={cfg.counters.refreshMinutes} onChange={(e) => setCfg((prev) => ({ ...prev, counters: { ...prev.counters, refreshMinutes: Number(e.target.value || 1) } }))} />
              </div>
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Lobby Voice Channel</div>
                <select style={input} value={cfg.rooms.lobbyChannelId} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, lobbyChannelId: e.target.value } }))}>
                  <option value="">Select voice channel</option>
                  {voiceChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Category</div>
                <select style={input} value={cfg.rooms.categoryId} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, categoryId: e.target.value } }))}>
                  <option value="">No category override</option>
                  {categoryChannels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Room Name Template</div>
                <input style={input} value={cfg.rooms.nameTemplate} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, nameTemplate: e.target.value } }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Cleanup Delay (sec)</div>
                <input style={input} type="number" min={0} max={300} value={cfg.rooms.cleanupDelaySeconds} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, cleanupDelaySeconds: Number(e.target.value || 0) } }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>User Limit</div>
                <input style={input} type="number" min={0} max={99} value={cfg.rooms.userLimit} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, userLimit: Number(e.target.value || 0) } }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Bitrate</div>
                <input style={input} type="number" min={8000} max={96000} step={1000} value={cfg.rooms.bitrate} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, bitrate: Number(e.target.value || 64000) } }))} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label><input type="checkbox" checked={cfg.rooms.inheritPermissions} onChange={(e) => setCfg((prev) => ({ ...prev, rooms: { ...prev.rooms, inheritPermissions: e.target.checked } }))} /> Inherit category permissions</label>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6 }}>Operator Notes</div>
              <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={micro}>Counter channel definitions stay in the advanced config below so the runtime schema remains unchanged.</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" style={button} disabled={saving} onClick={() => void runAction("refreshCounters")}>Refresh Counters</button>
                <button type="button" style={button} disabled={saving} onClick={() => void runAction("pruneRooms")}>Prune Empty Rooms</button>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Current Shape</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Live Counter Channels</div>
                <div style={micro}>{cfg.counters.channels.length} configured</div>
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  {cfg.counters.channels.length ? cfg.counters.channels.slice(0, 8).map((entry, index) => (
                    <div key={entry.id || index} style={{ border: "1px solid #742222", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700 }}>{entry.template || entry.metric || entry.id || `Counter ${index + 1}`}</div>
                      <div style={micro}>{labelForChannel(channelList, String(entry.channelId || ""))} | {entry.enabled === false ? "disabled" : "enabled"}</div>
                    </div>
                  )) : <div style={micro}>No counter channels configured.</div>}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Room Flow Rules</div>
                <div style={{ border: "1px solid #742222", borderRadius: 8, padding: 10 }}>
                  <div style={{ fontWeight: 700 }}>{cfg.rooms.nameTemplate || "{{displayName}} Lounge"}</div>
                  <div style={micro}>Lobby: {labelForChannel(channelList, cfg.rooms.lobbyChannelId)}</div>
                  <div style={micro}>Category: {labelForChannel(channelList, cfg.rooms.categoryId)}</div>
                  <div style={micro}>Cleanup: {cfg.rooms.cleanupDelaySeconds}s | Limit: {cfg.rooms.userLimit || "open"}</div>
                </div>
              </div>
            </div>
          </section>

          <section style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" style={button} disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : "Save Channel Flow"}</button>
          </section>

          <ConfigJsonEditor
            title="Advanced Channel Flow Config"
            value={cfg}
            disabled={saving}
            onApply={(next) => setCfg({ ...DEFAULT_CONFIG, ...(next as ChannelFlowConfig) })}
          />
        </>
      )}
    </div>
  );
}
