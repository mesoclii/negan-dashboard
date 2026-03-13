"use client";

import { useMemo, useState } from "react";
import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type CommunityStudioConfig = {
  active: boolean;
  styleName: string;
  bulletins: Array<{ id?: string; name?: string; channelId?: string; enabled?: boolean }>;
  polls: Array<{ id?: string; name?: string; question?: string; channelId?: string; enabled?: boolean; options?: unknown[] }>;
  reminders: Array<{ id?: string; name?: string; channelId?: string; enabled?: boolean; scheduleType?: string }>;
  lookup: { enabled: boolean; prefix: string };
  lookupEntries: Array<{ id?: string; key?: string; title?: string; enabled?: boolean }>;
  notes: string;
};

type Channel = { id: string; name: string; type?: number | string };

const DEFAULT_CONFIG: CommunityStudioConfig = {
  active: false,
  styleName: "Operator Canvas",
  bulletins: [],
  polls: [],
  reminders: [],
  lookup: {
    enabled: true,
    prefix: "?lookup",
  },
  lookupEntries: [],
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

export default function CommunityStudioClient() {
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
  } = useGuildEngineEditor<CommunityStudioConfig>("communityStudio", DEFAULT_CONFIG);

  const [selectedBulletinId, setSelectedBulletinId] = useState("");
  const [selectedPollId, setSelectedPollId] = useState("");
  const [selectedReminderId, setSelectedReminderId] = useState("");

  const channelList = useMemo(() => channels as Channel[], [channels]);

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Community Studio</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        This is our own community control surface for bulletin drops, pulse polls, reminder loops, and lookup cards. It intentionally avoids being a MEE6 lookalike.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading Community Studio...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} showDetails />

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, alignItems: "end" }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((prev) => ({ ...prev, active: e.target.checked }))} /> Community Studio Active</label>
              <label><input type="checkbox" checked={cfg.lookup.enabled} onChange={(e) => setCfg((prev) => ({ ...prev, lookup: { ...prev.lookup, enabled: e.target.checked } }))} /> Lookup Shelf Enabled</label>
              <div>
                <div style={{ marginBottom: 6 }}>Style Name</div>
                <input style={input} value={cfg.styleName} onChange={(e) => setCfg((prev) => ({ ...prev, styleName: e.target.value }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Lookup Prefix</div>
                <input style={input} value={cfg.lookup.prefix} onChange={(e) => setCfg((prev) => ({ ...prev, lookup: { ...prev.lookup, prefix: e.target.value } }))} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6 }}>Operator Notes</div>
              <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </section>

          <section style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Runtime Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Deploy Bulletin</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select style={input} value={selectedBulletinId} onChange={(e) => setSelectedBulletinId(e.target.value)}>
                    <option value="">Choose bulletin</option>
                    {cfg.bulletins.map((entry, index) => (
                      <option key={entry.id || index} value={entry.id || ""}>{entry.name || entry.id || `Bulletin ${index + 1}`}</option>
                    ))}
                  </select>
                  <button type="button" style={button} disabled={saving || !selectedBulletinId} onClick={() => void runAction("deployBulletin", { bulletinId: selectedBulletinId })}>Deploy</button>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Deploy Poll</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select style={input} value={selectedPollId} onChange={(e) => setSelectedPollId(e.target.value)}>
                    <option value="">Choose poll</option>
                    {cfg.polls.map((entry, index) => (
                      <option key={entry.id || index} value={entry.id || ""}>{entry.name || entry.question || entry.id || `Poll ${index + 1}`}</option>
                    ))}
                  </select>
                  <button type="button" style={button} disabled={saving || !selectedPollId} onClick={() => void runAction("deployPoll", { pollId: selectedPollId })}>Deploy</button>
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Send Reminder Now</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select style={input} value={selectedReminderId} onChange={(e) => setSelectedReminderId(e.target.value)}>
                    <option value="">Choose reminder</option>
                    {cfg.reminders.map((entry, index) => (
                      <option key={entry.id || index} value={entry.id || ""}>{entry.name || entry.id || `Reminder ${index + 1}`}</option>
                    ))}
                  </select>
                  <button type="button" style={button} disabled={saving || !selectedReminderId} onClick={() => void runAction("sendReminderNow", { reminderId: selectedReminderId })}>Send</button>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={micro}>The arrays below are edited in the advanced config panel so we keep the runtime model stable while still giving you live controls here.</div>
              <button type="button" style={button} disabled={saving} onClick={() => void runAction("clearReminderHistory")}>Clear Reminder History</button>
            </div>
          </section>

          <section style={card}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Configured Surfaces</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Bulletin Drops</div>
                <div style={micro}>{cfg.bulletins.length} configured</div>
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  {cfg.bulletins.length ? cfg.bulletins.slice(0, 6).map((entry, index) => (
                    <div key={entry.id || index} style={{ border: "1px solid #742222", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700 }}>{entry.name || entry.id || `Bulletin ${index + 1}`}</div>
                      <div style={micro}>{labelForChannel(channelList, String(entry.channelId || ""))} | {entry.enabled === false ? "disabled" : "enabled"}</div>
                    </div>
                  )) : <div style={micro}>No bulletins configured.</div>}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Pulse Polls</div>
                <div style={micro}>{cfg.polls.length} configured</div>
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  {cfg.polls.length ? cfg.polls.slice(0, 6).map((entry, index) => (
                    <div key={entry.id || index} style={{ border: "1px solid #742222", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700 }}>{entry.name || entry.question || entry.id || `Poll ${index + 1}`}</div>
                      <div style={micro}>{labelForChannel(channelList, String(entry.channelId || ""))} | options {Array.isArray(entry.options) ? entry.options.length : 0}</div>
                    </div>
                  )) : <div style={micro}>No pulse polls configured.</div>}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Reminder Loop + Lookup Shelf</div>
                <div style={micro}>{cfg.reminders.length} reminders and {cfg.lookupEntries.length} lookup entries</div>
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  {cfg.reminders.slice(0, 3).map((entry, index) => (
                    <div key={entry.id || index} style={{ border: "1px solid #742222", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700 }}>{entry.name || entry.id || `Reminder ${index + 1}`}</div>
                      <div style={micro}>{String(entry.scheduleType || "daily")} | {labelForChannel(channelList, String(entry.channelId || ""))}</div>
                    </div>
                  ))}
                  {cfg.lookupEntries.slice(0, 3).map((entry, index) => (
                    <div key={entry.id || index} style={{ border: "1px solid #742222", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontWeight: 700 }}>{entry.key || entry.title || entry.id || `Lookup ${index + 1}`}</div>
                      <div style={micro}>{entry.enabled === false ? "disabled" : "enabled"} | prefix {cfg.lookup.prefix}</div>
                    </div>
                  ))}
                  {!cfg.reminders.length && !cfg.lookupEntries.length ? <div style={micro}>No reminder or lookup entries configured.</div> : null}
                </div>
              </div>
            </div>
          </section>

          <section style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button type="button" style={button} disabled={saving} onClick={() => void save()}>{saving ? "Saving..." : "Save Community Studio"}</button>
          </section>

          <ConfigJsonEditor
            title="Advanced Community Studio Config"
            value={cfg}
            disabled={saving}
            onApply={(next) => setCfg({ ...DEFAULT_CONFIG, ...(next as CommunityStudioConfig) })}
          />
        </>
      )}
    </div>
  );
}
