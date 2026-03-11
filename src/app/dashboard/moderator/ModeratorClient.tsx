"use client";

import Link from "next/link";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { buildDashboardHref, readDashboardGuildId } from "@/lib/dashboardContext";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number | string };

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
    userUpdated: boolean;
    roleCreated: boolean;
    roleUpdated: boolean;
    roleDeleted: boolean;
    channelCreated: boolean;
    channelUpdated: boolean;
    channelDeleted: boolean;
    voiceJoined: boolean;
    voiceMoved: boolean;
    voiceLeft: boolean;
    serverUpdated: boolean;
    ignoreChannelIds: string[];
    dontLogBotActions: boolean;
    dontDisplayThumbnails: boolean;
  };
  automod: {
    enabled: boolean;
    badWordsAction: string;
    repeatedTextAction: string;
    spamAction: string;
    capsAction: string;
    linksAction: string;
    inviteAction: string;
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
    warningMessage: string;
    timeoutDurationMinutes: number;
  };
  notes: string;
};

type NativeRule = {
  enabled: boolean;
  requiredLevel: string;
};

type NativeEntry = {
  key: string;
  kind: string;
  title: string;
  description: string;
  commandName: string;
  defaultRequiredLevelName: string;
};

type NativeConfig = {
  active: boolean;
  slashEnabled: boolean;
  notes: string;
  rules: Record<string, any>;
};

type TabKey = "automod" | "admin" | "audit" | "commands";

const ACTIONS = [
  "Disabled",
  "Delete Message",
  "Delete Message + Warn Member",
  "Warn Member",
  "Timeout",
  "Kick",
  "Ban",
];

const LEVELS = [
  "PUBLIC",
  "VERIFIED",
  "SUPPORTER",
  "VIP",
  "SUPPORT_STAFF",
  "ADMIN",
  "FOUNDER",
  "CO_OWNER",
  "OWNER",
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
    userUpdated: true,
    roleCreated: false,
    roleUpdated: false,
    roleDeleted: false,
    channelCreated: true,
    channelUpdated: true,
    channelDeleted: true,
    voiceJoined: false,
    voiceMoved: false,
    voiceLeft: false,
    serverUpdated: true,
    ignoreChannelIds: [],
    dontLogBotActions: true,
    dontDisplayThumbnails: false,
  },
  automod: {
    enabled: false,
    badWordsAction: "Delete Message + Warn Member",
    repeatedTextAction: "Delete Message",
    spamAction: "Delete Message",
    capsAction: "Delete Message",
    linksAction: "Disabled",
    inviteAction: "Delete Message",
    mentionAction: "Delete Message",
    zalgoAction: "Disabled",
    spamThreshold: 5,
    capsThreshold: 70,
    mentionThreshold: 5,
    blockedWords: [],
    restrictedChannelIds: [],
    autoModerateIgnoresBots: true,
    sendWarningMessage: true,
    replyToDeletion: false,
    warningMessage: "Your message was removed by server moderation.",
    timeoutDurationMinutes: 10,
  },
  notes: "",
};

const frame: CSSProperties = {
  color: "#ffd0d0",
  maxWidth: 1480,
};

const card: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.08)",
};

const input: CSSProperties = {
  width: "100%",
  background: "#0c0c0c",
  color: "#ffd6d6",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "9px 10px",
};

const button: CSSProperties = {
  border: "1px solid #a30000",
  borderRadius: 10,
  background: "#1a0000",
  color: "#ffcccc",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

function normalizeModerator(raw: any): ModeratorConfig {
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    logging: { ...DEFAULT_CONFIG.logging, ...(raw?.logging || {}) },
    automod: { ...DEFAULT_CONFIG.automod, ...(raw?.automod || {}) },
  };
}

function moderatorCommandRule(entry: NativeEntry, config: NativeConfig): NativeRule {
  const rule = config.rules?.[entry.key] || {};
  return {
    enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
    requiredLevel: String(rule.requiredLevel || entry.defaultRequiredLevelName || "SUPPORT_STAFF"),
  };
}

export default function ModeratorClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [cfg, setCfg] = useState<ModeratorConfig>(DEFAULT_CONFIG);
  const [nativeConfig, setNativeConfig] = useState<NativeConfig>({ active: true, slashEnabled: true, notes: "", rules: {} });
  const [nativeEntries, setNativeEntries] = useState<NativeEntry[]>([]);
  const [tab, setTab] = useState<TabKey>("automod");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nextGuildId = readDashboardGuildId();
    setGuildId(nextGuildId);
    if (typeof window !== "undefined") {
      setGuildName(localStorage.getItem("activeGuildName") || "");
    }
  }, []);

  async function loadAll(targetGuildId: string) {
    if (!targetGuildId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const [cfgRes, guildRes, nativeRes] = await Promise.all([
        fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(targetGuildId)}&engine=moderator`, { cache: "no-store" }),
        fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(targetGuildId)}`, { cache: "no-store" }),
        fetch(`/api/bot/native-commands?guildId=${encodeURIComponent(targetGuildId)}`, { cache: "no-store" }),
      ]);

      const cfgJson = await cfgRes.json().catch(() => ({}));
      const guildJson = await guildRes.json().catch(() => ({}));
      const nativeJson = await nativeRes.json().catch(() => ({}));

      if (!cfgRes.ok || cfgJson?.success === false) {
        throw new Error(cfgJson?.error || "Failed to load moderator config.");
      }

      setCfg(normalizeModerator(cfgJson?.config || {}));
      setNativeConfig({
        active: nativeJson?.config?.active !== false,
        slashEnabled: nativeJson?.config?.slashEnabled !== false,
        notes: String(nativeJson?.config?.notes || ""),
        rules: nativeJson?.config?.rules && typeof nativeJson.config.rules === "object" ? nativeJson.config.rules : {},
      });

      const nextNativeEntries = Array.isArray(nativeJson?.registry?.entries)
        ? nativeJson.registry.entries.filter((entry: NativeEntry) => entry.commandName === "moderator" && entry.kind === "subcommand")
        : [];
      setNativeEntries(nextNativeEntries);

      const nextRoles = Array.isArray(guildJson?.roles) ? guildJson.roles : [];
      nextRoles.sort((a: Role, b: Role) => (Number(b.position || 0) - Number(a.position || 0)) || a.name.localeCompare(b.name));
      setRoles(nextRoles);

      const nextChannels = Array.isArray(guildJson?.channels) ? guildJson.channels : [];
      setChannels(nextChannels.filter((channel: Channel) => [0, 2, 4, 5].includes(Number(channel.type || 0))));

      const nextGuildName = String(guildJson?.guild?.name || "").trim();
      if (nextGuildName) {
        setGuildName(nextGuildName);
        localStorage.setItem("activeGuildName", nextGuildName);
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to load moderator.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll(guildId);
  }, [guildId]);

  const auditEvents = useMemo(() => ([
    ["memberMuted", "Member muted"],
    ["memberUnmuted", "Member unmuted"],
    ["moderationBan", "Manual kick / ban logs"],
    ["moderationWarn", "Warnings"],
    ["messageUpdated", "Message edited"],
    ["messageDeleted", "Message deleted"],
    ["invitePosted", "Invite posted"],
    ["memberRoleChanged", "Member roles changed"],
    ["memberJoined", "Member joined"],
    ["memberLeft", "Member left"],
    ["userUpdated", "User profile updated"],
    ["channelCreated", "Channel created"],
    ["channelUpdated", "Channel updated"],
    ["channelDeleted", "Channel deleted"],
    ["voiceJoined", "Voice joined"],
    ["voiceMoved", "Voice moved"],
    ["voiceLeft", "Voice left"],
    ["serverUpdated", "Server updated"],
  ]), []);

  function patchModeratorCommand(entry: NativeEntry, patch: Partial<any>) {
    setNativeConfig((prev) => ({
      ...prev,
      rules: {
        ...prev.rules,
        [entry.key]: {
          enabled: true,
          requiredLevel: entry.defaultRequiredLevelName || "SUPPORT_STAFF",
          ...(prev.rules?.[entry.key] || {}),
          ...patch,
        },
      },
    }));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMessage("");
    try {
      const moderatorRes = await fetch("/api/bot/engine-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, engine: "moderator", patch: cfg }),
      });
      const moderatorJson = await moderatorRes.json().catch(() => ({}));
      if (!moderatorRes.ok || moderatorJson?.success === false) {
        throw new Error(moderatorJson?.error || "Failed to save moderator config.");
      }

      const nativeRes = await fetch("/api/bot/engine-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, engine: "nativeCommands", patch: nativeConfig }),
      });
      const nativeJson = await nativeRes.json().catch(() => ({}));
      if (!nativeRes.ok || nativeJson?.success === false) {
        throw new Error(nativeJson?.error || "Failed to save moderator commands.");
      }

      setCfg(normalizeModerator(moderatorJson?.config || cfg));
      setNativeConfig({
        active: nativeJson?.config?.active !== false,
        slashEnabled: nativeJson?.config?.slashEnabled !== false,
        notes: String(nativeJson?.config?.notes || ""),
        rules: nativeJson?.config?.rules && typeof nativeJson.config.rules === "object" ? nativeJson.config.rules : {},
      });
      if (nativeJson?.sync?.ok) {
        setMessage(`Saved moderator module. Synced ${Number(nativeJson.sync.count || 0)} slash commands to Discord.`);
      } else if (nativeJson?.sync?.error) {
        setMessage(`Saved moderator module, but slash sync failed: ${nativeJson.sync.error}`);
      } else {
        setMessage("Saved moderator module.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to save moderator module.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from `/guilds` first.</div>;
  }

  return (
    <div style={frame}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Separate Moderator Module</div>
          <h1 style={{ margin: "8px 0 0", color: "#ff4d4d", letterSpacing: "0.10em", textTransform: "uppercase" }}>Moderator</h1>
          <div style={{ color: "#ff9a9a", marginTop: 8 }}>Guild: {guildName || guildId}</div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((prev) => ({ ...prev, active: e.target.checked }))} />
            Active
          </label>
          <Link href={buildDashboardHref("/dashboard/slash-commands")} style={{ ...button, textDecoration: "none" }}>
            Open Slash Master
          </Link>
          <button style={button} onClick={saveAll} disabled={saving}>
            {saving ? "Saving..." : "Save Moderator"}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, color: "#ffbcbc", maxWidth: 1120, lineHeight: 1.7 }}>
        This is a separate moderation surface. It is not the security stack and it does not touch your `!custom` command studio.
        Automod, audit logging, immunity/admin roles, and `/moderator` slash-command controls live here.
      </div>

      {message ? (
        <div style={{ ...card, marginTop: 14, color: "#ffd27a" }}>{message}</div>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        {([
          ["automod", "Automod"],
          ["admin", "Admin"],
          ["audit", "Audit Logging"],
          ["commands", "Commands"],
        ] as Array<[TabKey, string]>).map(([value, label]) => (
          <button
            key={value}
            style={{
              ...button,
              background: tab === value ? "#2a0000" : "#160000",
              borderColor: tab === value ? "#ff4d4d" : "#6f0000",
            }}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ ...card, marginTop: 14 }}>Loading moderator...</div>
      ) : null}

      {!loading && tab === "automod" ? (
        <section style={{ ...card, marginTop: 14 }}>
          <h2 style={{ marginTop: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Automod</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <label><input type="checkbox" checked={cfg.automod.enabled} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, enabled: e.target.checked } }))} /> Enabled</label>
            <label><input type="checkbox" checked={cfg.automod.autoModerateIgnoresBots} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, autoModerateIgnoresBots: e.target.checked } }))} /> Ignore bots</label>
            <label><input type="checkbox" checked={cfg.automod.sendWarningMessage} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, sendWarningMessage: e.target.checked } }))} /> DM warning</label>
            <label><input type="checkbox" checked={cfg.automod.replyToDeletion} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, replyToDeletion: e.target.checked } }))} /> Reply in channel</label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
            {([
              ["badWordsAction", "Blocked words"],
              ["repeatedTextAction", "Repeated text"],
              ["spamAction", "Spam burst"],
              ["capsAction", "Caps"],
              ["linksAction", "External links"],
              ["inviteAction", "Discord invites"],
              ["mentionAction", "Mention burst"],
              ["zalgoAction", "Zalgo"],
            ] as Array<[keyof ModeratorConfig["automod"], string]>).map(([key, label]) => (
              <div key={String(key)}>
                <label>{label}</label>
                <select
                  style={input}
                  value={String(cfg.automod[key])}
                  onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, [key]: e.target.value } }))}
                >
                  {ACTIONS.map((action) => <option key={action} value={action}>{action}</option>)}
                </select>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 12, marginTop: 14 }}>
            <div>
              <label>Spam threshold</label>
              <input style={input} type="number" value={cfg.automod.spamThreshold} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, spamThreshold: Number(e.target.value || 0) } }))} />
            </div>
            <div>
              <label>Caps threshold %</label>
              <input style={input} type="number" value={cfg.automod.capsThreshold} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, capsThreshold: Number(e.target.value || 0) } }))} />
            </div>
            <div>
              <label>Mention threshold</label>
              <input style={input} type="number" value={cfg.automod.mentionThreshold} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, mentionThreshold: Number(e.target.value || 0) } }))} />
            </div>
            <div>
              <label>Timeout minutes</label>
              <input style={input} type="number" value={cfg.automod.timeoutDurationMinutes} onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, timeoutDurationMinutes: Number(e.target.value || 0) } }))} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label>Blocked words (comma separated)</label>
            <textarea
              style={{ ...input, minHeight: 90 }}
              value={cfg.automod.blockedWords.join(", ")}
              onChange={(e) => setCfg((prev) => ({
                ...prev,
                automod: {
                  ...prev.automod,
                  blockedWords: e.target.value.split(",").map((value) => value.trim()).filter(Boolean),
                },
              }))}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <label>Warning message</label>
            <textarea
              style={{ ...input, minHeight: 80 }}
              value={cfg.automod.warningMessage}
              onChange={(e) => setCfg((prev) => ({ ...prev, automod: { ...prev.automod, warningMessage: e.target.value } }))}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ color: "#ff5f5f", marginTop: 0 }}>Restricted Channels</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 6, maxHeight: 260, overflowY: "auto" }}>
              {channels.map((channel) => (
                <label key={channel.id}>
                  <input
                    type="checkbox"
                    checked={cfg.automod.restrictedChannelIds.includes(channel.id)}
                    onChange={() => setCfg((prev) => ({
                      ...prev,
                      automod: { ...prev.automod, restrictedChannelIds: toggleId(prev.automod.restrictedChannelIds, channel.id) },
                    }))}
                  />{" "}
                  #{channel.name}
                </label>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!loading && tab === "admin" ? (
        <section style={{ ...card, marginTop: 14 }}>
          <h2 style={{ marginTop: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Admin</h2>
          <div style={{ color: "#ffbcbc", marginBottom: 12 }}>
            Admin roles can operate the moderator slash tools here. Immunity roles bypass automod and moderator command targeting.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <h3 style={{ color: "#ff5f5f", marginTop: 0 }}>Admin Roles</h3>
              <div style={{ display: "grid", gap: 6, maxHeight: 360, overflowY: "auto" }}>
                {roles.map((role) => (
                  <label key={role.id}>
                    <input
                      type="checkbox"
                      checked={cfg.adminRoleIds.includes(role.id)}
                      onChange={() => setCfg((prev) => ({ ...prev, adminRoleIds: toggleId(prev.adminRoleIds, role.id) }))}
                    />{" "}
                    {role.name}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ color: "#ff5f5f", marginTop: 0 }}>Immunity Roles</h3>
              <div style={{ display: "grid", gap: 6, maxHeight: 360, overflowY: "auto" }}>
                {roles.map((role) => (
                  <label key={role.id}>
                    <input
                      type="checkbox"
                      checked={cfg.immunityRoleIds.includes(role.id)}
                      onChange={() => setCfg((prev) => ({ ...prev, immunityRoleIds: toggleId(prev.immunityRoleIds, role.id) }))}
                    />{" "}
                    {role.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label>Moderator Notes</label>
            <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg((prev) => ({ ...prev, notes: e.target.value }))} />
          </div>
        </section>
      ) : null}

      {!loading && tab === "audit" ? (
        <section style={{ ...card, marginTop: 14 }}>
          <h2 style={{ marginTop: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Audit Logging</h2>
          <div>
            <label>Log Channel</label>
            <select style={input} value={cfg.logging.logChannelId} onChange={(e) => setCfg((prev) => ({ ...prev, logging: { ...prev.logging, logChannelId: e.target.value } }))}>
              <option value="">Select a channel</option>
              {channels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 8, marginTop: 14 }}>
            {auditEvents.map(([key, label]) => (
              <label key={String(key)}>
                <input
                  type="checkbox"
                  checked={Boolean((cfg.logging as any)[key])}
                  onChange={(e) => setCfg((prev) => ({ ...prev, logging: { ...prev.logging, [key]: e.target.checked } }))}
                />{" "}
                {label}
              </label>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(240px,1fr))", gap: 12, marginTop: 14 }}>
            <label><input type="checkbox" checked={cfg.logging.dontLogBotActions} onChange={(e) => setCfg((prev) => ({ ...prev, logging: { ...prev.logging, dontLogBotActions: e.target.checked } }))} /> Ignore bot actions</label>
            <label><input type="checkbox" checked={cfg.logging.dontDisplayThumbnails} onChange={(e) => setCfg((prev) => ({ ...prev, logging: { ...prev.logging, dontDisplayThumbnails: e.target.checked } }))} /> Hide thumbnails</label>
          </div>

          <div style={{ marginTop: 14 }}>
            <h3 style={{ color: "#ff5f5f", marginTop: 0 }}>Ignored Channels</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 6, maxHeight: 260, overflowY: "auto" }}>
              {channels.map((channel) => (
                <label key={channel.id}>
                  <input
                    type="checkbox"
                    checked={cfg.logging.ignoreChannelIds.includes(channel.id)}
                    onChange={() => setCfg((prev) => ({
                      ...prev,
                      logging: { ...prev.logging, ignoreChannelIds: toggleId(prev.logging.ignoreChannelIds, channel.id) },
                    }))}
                  />{" "}
                  #{channel.name}
                </label>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!loading && tab === "commands" ? (
        <section style={{ ...card, marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Moderator Slash Commands</h2>
              <div style={{ color: "#ffbcbc", marginTop: 8 }}>
                These are the new `/moderator` native slash commands. The full native slash registry still lives in the separate Slash Command Master.
              </div>
            </div>
            <Link href={buildDashboardHref("/dashboard/slash-commands")} style={{ ...button, textDecoration: "none" }}>
              Open Full Slash Master
            </Link>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {nativeEntries.map((entry) => {
              const rule = moderatorCommandRule(entry, nativeConfig);
              return (
                <div key={entry.key} style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12, background: "#120000" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#ffdcdc", fontWeight: 800 }}>{entry.title}</div>
                      <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 4 }}>{entry.description}</div>
                    </div>
                    <label><input type="checkbox" checked={rule.enabled} onChange={(e) => patchModeratorCommand(entry, { enabled: e.target.checked })} /> Enabled</label>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, marginTop: 10, alignItems: "center" }}>
                    <div>
                      <label>Minimum Access Level</label>
                      <select style={input} value={rule.requiredLevel} onChange={(e) => patchModeratorCommand(entry, { requiredLevel: e.target.value })}>
                        {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                      </select>
                    </div>
                    <div style={{ color: "#ffbcbc", fontSize: 13 }}>
                      Key: <code>{entry.key}</code>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
