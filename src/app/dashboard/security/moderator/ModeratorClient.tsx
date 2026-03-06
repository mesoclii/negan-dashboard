"use client";



import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; position: number };
type Channel = { id: string; name: string; type: number };

type ModeratorConfig = {
  active: boolean;
  adminRoleIds: string[];
  immunityRoleIds: string[];
  logging: {
    logChannelId: string;
    memberMuted: boolean;
    memberUnmuted: boolean;
    moderationBan: boolean;
    moderationWarn: boolean;
    messageUpdated: boolean;
    messageDeleted: boolean;
    invitePosted: boolean;
    memberRoleChanged: boolean;
    memberJoined: boolean;
    memberLeft: boolean;
    channelCreated: boolean;
    channelUpdated: boolean;
    channelDeleted: boolean;
    serverUpdated: boolean;
    ignoreChannelIds: string[];
    dontLogBotActions: boolean;
    dontDisplayThumbnails: boolean;
  };
  automod: {
    enabled: boolean;
    badWordsAction: string;
    spamAction: string;
    capsAction: string;
    linksAction: string;
    mentionAction: string;
    zalgoAction: string;
    spamThreshold: number;
    capsThreshold: number;
    mentionThreshold: number;
    blockedWords: string[];
    restrictedChannelIds: string[];
    autoModerateIgnoresBots: boolean;
    sendWarningMessage: boolean;
    replyToDeletion: boolean;
  };
};

const ACTIONS = [
  "Disabled",
  "Delete Message",
  "Delete Message + Warn Member",
  "Warn Member",
  "Timeout",
  "Kick",
  "Ban"
];

const DEFAULT_CONFIG: ModeratorConfig = {
  active: true,
  adminRoleIds: [],
  immunityRoleIds: [],
  logging: {
    logChannelId: "",
    memberMuted: true,
    memberUnmuted: true,
    moderationBan: true,
    moderationWarn: true,
    messageUpdated: true,
    messageDeleted: true,
    invitePosted: true,
    memberRoleChanged: true,
    memberJoined: true,
    memberLeft: true,
    channelCreated: true,
    channelUpdated: true,
    channelDeleted: true,
    serverUpdated: true,
    ignoreChannelIds: [],
    dontLogBotActions: true,
    dontDisplayThumbnails: false
  },
  automod: {
    enabled: false,
    badWordsAction: "Delete Message + Warn Member",
    spamAction: "Delete Message",
    capsAction: "Delete Message",
    linksAction: "Disabled",
    mentionAction: "Delete Message",
    zalgoAction: "Disabled",
    spamThreshold: 5,
    capsThreshold: 70,
    mentionThreshold: 5,
    blockedWords: [],
    restrictedChannelIds: [],
    autoModerateIgnoresBots: true,
    sendWarningMessage: true,
    replyToDeletion: false
  }
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const url = new URLSearchParams(window.location.search).get("guildId") || "";
  const saved = localStorage.getItem("activeGuildId") || "";
  const gid = (url || saved).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function mergeConfig(input: any): ModeratorConfig {
  return {
    ...DEFAULT_CONFIG,
    ...input,
    logging: { ...DEFAULT_CONFIG.logging, ...(input?.logging || {}) },
    automod: { ...DEFAULT_CONFIG.automod, ...(input?.automod || {}) }
  };
}

const card: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  marginBottom: 14,
  background: "rgba(120,0,0,0.09)"
};

const input: React.CSSProperties = {
  width: "100%",
  background: "#0c0c0c",
  color: "#ffd6d6",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "9px 10px"
};

const btn: React.CSSProperties = {
  border: "1px solid #a30000",
  borderRadius: 10,
  background: "#1a0000",
  color: "#ffcccc",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700
};

export default function ModeratorPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<ModeratorConfig>(DEFAULT_CONFIG);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, guildRes] = await Promise.all([
          fetch(`/api/setup/moderator-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const guildJson = await guildRes.json().catch(() => ({}));

        setCfg(mergeConfig(cfgJson?.config || {}));

        const r = Array.isArray(guildJson?.roles) ? guildJson.roles : [];
        setRoles(
          r
            .map((x: any) => ({ id: String(x.id), name: String(x.name || x.id), position: Number(x.position || 0) }))
            .sort((a: Role, b: Role) => b.position - a.position)
        );

        const c = Array.isArray(guildJson?.channels) ? guildJson.channels : [];
        setChannels(
          c
            .filter((x: any) => Number(x.type) === 0)
            .map((x: any) => ({ id: String(x.id), name: String(x.name || x.id), type: Number(x.type || 0) }))
        );
      } catch (e: any) {
        setMsg(e?.message || "Failed to load moderator config");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const eventKeys = useMemo(
    () =>
      [
        "memberMuted",
        "memberUnmuted",
        "moderationBan",
        "moderationWarn",
        "messageUpdated",
        "messageDeleted",
        "invitePosted",
        "memberRoleChanged",
        "memberJoined",
        "memberLeft",
        "channelCreated",
        "channelUpdated",
        "channelDeleted",
        "serverUpdated"
      ] as const,
    []
  );

  function toggleInList(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/moderator-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Saved moderator config.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffb3b3", padding: 18, maxWidth: 1220 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h1 style={{ margin: 0, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ff3b3b" }}>
          Moderator Command Center
        </h1>
        <button style={btn} onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>
      <div style={{ marginBottom: 14, color: msg ? "#ffb3b3" : "#ff8080" }}>
        Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId} {msg ? `• ${msg}` : ""}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Core</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Active</label>
              <label><input type="checkbox" checked={cfg.logging.dontLogBotActions} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, dontLogBotActions: e.target.checked } })} /> Dont log bot actions</label>
              <label><input type="checkbox" checked={cfg.logging.dontDisplayThumbnails} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, dontDisplayThumbnails: e.target.checked } })} /> Dont display thumbnails</label>
            </div>
            <div style={{ marginTop: 10 }}>
              <label>Logging Channel</label>
              <select style={input} value={cfg.logging.logChannelId} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, logChannelId: e.target.value } })}>
                <option value="">Select a channel</option>
                {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Audit Logging Events</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 8 }}>
              {eventKeys.map((k) => (
                <label key={k} style={{ textTransform: "none" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(cfg.logging[k])}
                    onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, [k]: e.target.checked } })}
                  />{" "}
                  {k}
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Automod Matrix</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <label><input type="checkbox" checked={cfg.automod.enabled} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, enabled: e.target.checked } })} /> Enabled</label>
              <label><input type="checkbox" checked={cfg.automod.autoModerateIgnoresBots} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, autoModerateIgnoresBots: e.target.checked } })} /> Ignore bots</label>
              <label><input type="checkbox" checked={cfg.automod.sendWarningMessage} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, sendWarningMessage: e.target.checked } })} /> Send warning message</label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div><label>Bad words action</label><select style={input} value={cfg.automod.badWordsAction} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, badWordsAction: e.target.value } })}>{ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><label>Spam action</label><select style={input} value={cfg.automod.spamAction} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, spamAction: e.target.value } })}>{ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><label>Caps action</label><select style={input} value={cfg.automod.capsAction} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, capsAction: e.target.value } })}>{ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><label>Links action</label><select style={input} value={cfg.automod.linksAction} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, linksAction: e.target.value } })}>{ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><label>Mentions action</label><select style={input} value={cfg.automod.mentionAction} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, mentionAction: e.target.value } })}>{ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
              <div><label>Zalgo action</label><select style={input} value={cfg.automod.zalgoAction} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, zalgoAction: e.target.value } })}>{ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
              <div><label>Spam threshold (msg/min)</label><input style={input} type="number" value={cfg.automod.spamThreshold} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, spamThreshold: Number(e.target.value || 0) } })} /></div>
              <div><label>Caps threshold (%)</label><input style={input} type="number" value={cfg.automod.capsThreshold} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, capsThreshold: Number(e.target.value || 0) } })} /></div>
              <div><label>Mentions threshold</label><input style={input} type="number" value={cfg.automod.mentionThreshold} onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, mentionThreshold: Number(e.target.value || 0) } })} /></div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Blocked words (comma-separated)</label>
              <textarea
                style={{ ...input, minHeight: 68 }}
                value={cfg.automod.blockedWords.join(", ")}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    automod: {
                      ...cfg.automod,
                      blockedWords: e.target.value.split(",").map((x) => x.trim()).filter(Boolean)
                    }
                  })
                }
              />
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Immunity Roles</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 6, maxHeight: 240, overflowY: "auto" }}>
              {roles.map((r) => (
                <label key={r.id}>
                  <input
                    type="checkbox"
                    checked={cfg.immunityRoleIds.includes(r.id)}
                    onChange={() =>
                      setCfg({
                        ...cfg,
                        immunityRoleIds: toggleInList(cfg.immunityRoleIds, r.id)
                      })
                    }
                  />{" "}
                  {r.name}
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Ignored Channels</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 6, maxHeight: 220, overflowY: "auto" }}>
              {channels.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={cfg.logging.ignoreChannelIds.includes(c.id)}
                    onChange={() =>
                      setCfg({
                        ...cfg,
                        logging: { ...cfg.logging, ignoreChannelIds: toggleInList(cfg.logging.ignoreChannelIds, c.id) }
                      })
                    }
                  />{" "}
                  #{c.name}
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Restricted Channels (automod)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 6, maxHeight: 220, overflowY: "auto" }}>
              {channels.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={cfg.automod.restrictedChannelIds.includes(c.id)}
                    onChange={() =>
                      setCfg({
                        ...cfg,
                        automod: { ...cfg.automod, restrictedChannelIds: toggleInList(cfg.automod.restrictedChannelIds, c.id) }
                      })
                    }
                  />{" "}
                  #{c.name}
                </label>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={cfg.automod.replyToDeletion}
                  onChange={(e) => setCfg({ ...cfg, automod: { ...cfg.automod, replyToDeletion: e.target.checked } })}
                />{" "}
                Reply in channel on deletion
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
