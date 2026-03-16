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
  color?: string;
  pingRoleId?: string;
  postAsEmbed?: boolean;
  includeSummary?: boolean;
  footerText?: string;
  imageUrl?: string;
  maxItemsPerCheck?: number;
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
const PROVIDERS = [
  { key: "rss", label: "RSS", hint: "General site or blog feeds" },
  { key: "podcast", label: "Podcast", hint: "Audio show RSS with episode drops" },
  { key: "youtube", label: "YouTube", hint: "Channel or creator feed URL" },
  { key: "twitch", label: "Twitch", hint: "Creator stream feed mirror" },
  { key: "reddit", label: "Reddit", hint: "Subreddit feed or filtered topic" },
  { key: "bluesky", label: "Bluesky", hint: "Feed mirror or external RSS wrapper" },
  { key: "x", label: "X", hint: "External feed mirror for posts" },
  { key: "instagram", label: "Instagram", hint: "Feed bridge or creator source" },
  { key: "tiktok", label: "TikTok", hint: "Feed bridge for creator uploads" },
  { key: "kick", label: "Kick", hint: "Feed bridge for live creator notices" },
] as const;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function createSource(): SignalSource {
  return {
    id: makeId("source"),
    enabled: true,
    label: "New Source",
    provider: "rss",
    channelId: "",
    feedUrl: "",
    color: "#4fd1c5",
    pingRoleId: "",
    postAsEmbed: true,
    includeSummary: true,
    footerText: "Signal Relay",
    imageUrl: "",
    maxItemsPerCheck: 1,
    pollMinutes: 15,
  };
}

function providerHint(key: string) {
  return PROVIDERS.find((provider) => provider.key === key)?.hint || "General feed source";
}

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

  const [selectedSourceIndex, setSelectedSourceIndex] = useState(0);
  const channelList = useMemo(() => channels as Channel[], [channels]);
  const roleList = useMemo(() => roles as Role[], [roles]);
  const textChannels = useMemo(
    () => channelList.filter((channel) => Number(channel?.type) === 0 || Number(channel?.type) === 5 || /text/i.test(String(channel?.type || ""))),
    [channelList]
  );
  const activeSourceIndex = cfg.sources.length ? Math.max(0, Math.min(selectedSourceIndex, cfg.sources.length - 1)) : -1;
  const activeSource = activeSourceIndex >= 0 ? cfg.sources[activeSourceIndex] : null;

  function updateSource(index: number, patch: Partial<SignalSource>) {
    setCfg((prev) => {
      const next = [...prev.sources];
      next[index] = { ...next[index], ...patch };
      return { ...prev, sources: next };
    });
  }

  function removeSource(index: number) {
    setCfg((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, sourceIndex) => sourceIndex !== index),
    }));
    setSelectedSourceIndex((prev) => Math.max(0, prev > index ? prev - 1 : prev === index ? index - 1 : prev));
  }

  function applyPreset(index: number, provider: string) {
    const source = cfg.sources[index] || createSource();
    const label = PROVIDERS.find((entry) => entry.key === provider)?.label || provider.toUpperCase();
    updateSource(index, {
      provider,
      label: source.label && source.label !== "New Source" ? source.label : `${label} Relay`,
      postAsEmbed: provider !== "podcast" && provider !== "rss" ? true : source.postAsEmbed,
      includeSummary: provider !== "twitch",
    });
  }

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

          <section id="defaults" style={card}>
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

          <section id="source-builder" style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Run Relay</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("checkNow")}>Run All Sources</button>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("resetSeen")}>Reset All Seen</button>
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Source Builder</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" style={button} onClick={() => { setCfg((prev) => ({ ...prev, sources: [...prev.sources, createSource()] })); setSelectedSourceIndex(cfg.sources.length); }}>Add Source</button>
                  <button type="button" style={button} disabled={saving || !activeSource?.id} onClick={() => activeSource?.id ? void runAction("checkNow", { sourceId: activeSource.id }) : undefined}>Run Selected</button>
                  <button type="button" style={button} disabled={saving || !activeSource?.id} onClick={() => activeSource?.id ? void runAction("resetSeen", { sourceId: activeSource.id }) : undefined}>Reset Selected</button>
                  <button type="button" style={button} disabled={!activeSource} onClick={() => activeSource ? removeSource(activeSourceIndex) : undefined}>Remove Selected</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, ...micro }}>
              Feed processing still runs through the same runtime. This screen only makes source editing visual instead of JSON-only.
            </div>
          </section>

          <section id="sources" style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Configured Sources</div>
            <div style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 14 }}>
              <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                {cfg.sources.length ? cfg.sources.map((entry, index) => (
                  <button key={entry.id || index} type="button" style={{ ...button, textAlign: "left", width: "100%", borderColor: index === activeSourceIndex ? "#ff6b6b" : "#7a0000" }} onClick={() => setSelectedSourceIndex(index)}>
                    <div style={{ fontWeight: 800 }}>{entry.label || entry.id || `Source ${index + 1}`}</div>
                    <div style={micro}>{String(entry.provider || "rss").toUpperCase()} | {labelForChannel(channelList, String(entry.channelId || ""))}</div>
                    <div style={micro}>{entry.postAsEmbed === false ? "text dispatch" : "embed dispatch"} | every {entry.pollMinutes || cfg.pollIntervalMinutes} min</div>
                  </button>
                )) : <div style={micro}>No signal sources configured yet.</div>}
              </div>
              {activeSource ? (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                    <div>
                      <div style={{ marginBottom: 6 }}>Label</div>
                      <input style={input} value={String(activeSource.label || "")} onChange={(e) => updateSource(activeSourceIndex, { label: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ marginBottom: 6 }}>Provider</div>
                      <select style={input} value={String(activeSource.provider || "rss")} onChange={(e) => updateSource(activeSourceIndex, { provider: e.target.value })}>
                        {PROVIDERS.map((provider) => <option key={provider.key} value={provider.key}>{provider.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ marginBottom: 6 }}>Target Channel</div>
                      <select style={input} value={String(activeSource.channelId || "")} onChange={(e) => updateSource(activeSourceIndex, { channelId: e.target.value })}>
                        <option value="">Select text channel</option>
                        {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ marginBottom: 6 }}>Ping Role</div>
                      <select style={input} value={String(activeSource.pingRoleId || "")} onChange={(e) => updateSource(activeSourceIndex, { pingRoleId: e.target.value })}>
                        <option value="">No role ping</option>
                        {roleList.map((role) => <option key={role.id} value={role.id}>@{role.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                    <label><input type="checkbox" checked={activeSource.enabled !== false} onChange={(e) => updateSource(activeSourceIndex, { enabled: e.target.checked })} /> Enabled</label>
                    <label><input type="checkbox" checked={activeSource.postAsEmbed !== false} onChange={(e) => updateSource(activeSourceIndex, { postAsEmbed: e.target.checked })} /> Post As Embed</label>
                    <label><input type="checkbox" checked={activeSource.includeSummary !== false} onChange={(e) => updateSource(activeSourceIndex, { includeSummary: e.target.checked })} /> Include Summary</label>
                  </div>
                  <div>
                    <div style={{ marginBottom: 6 }}>Feed URL</div>
                    <input style={input} value={String(activeSource.feedUrl || "")} onChange={(e) => updateSource(activeSourceIndex, { feedUrl: e.target.value })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
                    <div>
                      <div style={{ marginBottom: 6 }}>Color</div>
                      <input style={input} value={String(activeSource.color || cfg.sourceDefaults.color)} onChange={(e) => updateSource(activeSourceIndex, { color: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ marginBottom: 6 }}>Footer</div>
                      <input style={input} value={String(activeSource.footerText || cfg.sourceDefaults.footerText)} onChange={(e) => updateSource(activeSourceIndex, { footerText: e.target.value })} />
                    </div>
                    <div>
                      <div style={{ marginBottom: 6 }}>Poll Minutes</div>
                      <input style={input} type="number" min={1} max={720} value={Number(activeSource.pollMinutes || cfg.pollIntervalMinutes)} onChange={(e) => updateSource(activeSourceIndex, { pollMinutes: Number(e.target.value || cfg.pollIntervalMinutes) })} />
                    </div>
                    <div>
                      <div style={{ marginBottom: 6 }}>Max Items Per Check</div>
                      <input style={input} type="number" min={1} max={5} value={Number(activeSource.maxItemsPerCheck || 1)} onChange={(e) => updateSource(activeSourceIndex, { maxItemsPerCheck: Number(e.target.value || 1) })} />
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 6 }}>Fallback Image URL</div>
                    <input style={input} value={String(activeSource.imageUrl || "")} onChange={(e) => updateSource(activeSourceIndex, { imageUrl: e.target.value })} />
                  </div>
                  <div>
                    <div style={{ marginBottom: 8, fontWeight: 700 }}>Provider Presets</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
                      {PROVIDERS.map((provider) => (
                        <button key={provider.key} type="button" style={{ ...button, textAlign: "left", width: "100%" }} onClick={() => applyPreset(activeSourceIndex, provider.key)}>
                          <div style={{ fontWeight: 800 }}>{provider.label}</div>
                          <div style={micro}>{provider.hint}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ ...micro, marginTop: 8 }}>{providerHint(String(activeSource.provider || "rss"))}</div>
                  </div>
                </div>
              ) : (
                <div style={{ ...micro, alignSelf: "center" }}>Select a source to edit it, or add a new source.</div>
              )}
            </div>
          </section>

          <section style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" style={button} disabled={saving} onClick={() => void save(cfg)}>{saving ? "Saving..." : "Save Signal Relay"}</button>
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
