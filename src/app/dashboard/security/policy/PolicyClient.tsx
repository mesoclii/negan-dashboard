"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { fetchGuildData, fetchRuntimeEngine, resolveGuildContext, saveRuntimeEngine } from "@/lib/liveRuntime";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number | string };

const box: CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.08)", marginBottom: 14 };
const input: CSSProperties = { width: "100%", padding: 10, background: "#0a0a0a", border: "1px solid #6f0000", color: "#ffd7d7", borderRadius: 8 };
const action: CSSProperties = { ...input, width: "auto", cursor: "pointer", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em" };

const automodActions = [
  "Disabled",
  "Delete Message",
  "Delete Message + Warn Member",
  "Delete Message + Timeout Member",
];

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((value) => value !== id) : [...list, id];
}

function RoleChips({ label, roles, selected, onToggle }: { label: string; roles: Role[]; selected: string[]; onToggle: (roleId: string) => void }) {
  return (
    <div>
      <div style={{ color: "#ffb5b5", fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {roles.map((role) => {
          const active = selected.includes(role.id);
          return (
            <button
              key={`${label}:${role.id}`}
              type="button"
              onClick={() => onToggle(role.id)}
              style={{
                borderRadius: 999,
                border: active ? "1px solid #ff5555" : "1px solid #553030",
                background: active ? "rgba(255,0,0,.24)" : "rgba(255,255,255,.03)",
                color: active ? "#fff" : "#ffb3b3",
                padding: "6px 10px",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              {role.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function PolicyClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [cfg, setCfg] = useState<Record<string, any>>({});
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const resolved = resolveGuildContext();
    setGuildId(resolved.guildId);
    setGuildName(resolved.guildName);
  }, []);

  useEffect(() => {
    async function loadAll(targetGuildId: string) {
      if (!targetGuildId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setMessage("");
        const [runtimeJson, guildJson] = await Promise.all([
          fetchRuntimeEngine(targetGuildId, "moderator"),
          fetchGuildData(targetGuildId),
        ]);
        setCfg(runtimeJson?.config || {});
        setRoles(Array.isArray(guildJson.roles) ? guildJson.roles : []);
        setChannels(Array.isArray(guildJson.channels) ? guildJson.channels : []);
      } catch (err: any) {
        setMessage(err?.message || "Failed to load moderation policy.");
      } finally {
        setLoading(false);
      }
    }
    void loadAll(guildId);
  }, [guildId]);

  async function save() {
    if (!guildId) return;
    try {
      setSaving(true);
      setMessage("");
      const json = await saveRuntimeEngine(guildId, "moderator", cfg);
      setCfg(json?.config || {});
      setMessage("Saved live moderation policy.");
    } catch (err: any) {
      setMessage(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const textChannels = useMemo(() => channels.filter((channel) => Number(channel.type) === 0 || Number(channel.type) === 5), [channels]);
  const logging = cfg.logging || {};
  const automod = cfg.automod || {};

  if (!guildId && !loading) return <div style={{ color: "#ff7777", padding: 20 }}>Missing guildId.</div>;

  return (
    <div style={{ color: "#ff4d4d", padding: 20, maxWidth: 1280 }}>
      <div style={box}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Security Policy</h1>
            <p style={{ margin: "6px 0 0" }}>Guild: {guildName || guildId}</p>
            <div style={{ color: "#ffb3b3", fontSize: 12 }}>
              This page edits the live `moderator` engine only. Per-command access stays in the native slash command master.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={`/dashboard/moderator?guildId=${encodeURIComponent(guildId)}`} style={{ ...action, textDecoration: "none" }}>Open Moderator</Link>
            <Link href={`/dashboard/slash-commands?guildId=${encodeURIComponent(guildId)}`} style={{ ...action, textDecoration: "none" }}>Slash Commands</Link>
          </div>
        </div>
        {message ? <div style={{ marginTop: 10, color: "#ffd27a" }}>{message}</div> : null}
      </div>

      {loading ? <div style={box}>Loading moderation policy...</div> : null}

      {!loading ? (
        <>
          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Core Controls</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(180px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(cfg.active)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, active: event.target.checked }))} /> Policy active</label>
              <label><input type="checkbox" checked={Boolean(automod.enabled)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), enabled: event.target.checked } }))} /> Automod enabled</label>
              <label><input type="checkbox" checked={Boolean(logging.dontLogBotActions)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, logging: { ...(prev.logging || {}), dontLogBotActions: event.target.checked } }))} /> Ignore bot actions</label>
              <label><input type="checkbox" checked={Boolean(logging.dontDisplayThumbnails)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, logging: { ...(prev.logging || {}), dontDisplayThumbnails: event.target.checked } }))} /> Hide thumbnails</label>
              <label><input type="checkbox" checked={Boolean(automod.autoModerateIgnoresBots)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), autoModerateIgnoresBots: event.target.checked } }))} /> Ignore bots in automod</label>
              <label><input type="checkbox" checked={Boolean(automod.replyToDeletion)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), replyToDeletion: event.target.checked } }))} /> Reply on deletion</label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Roles + Audit Routing</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <RoleChips label="Admin roles" roles={roles} selected={Array.isArray(cfg.adminRoleIds) ? cfg.adminRoleIds : []} onToggle={(roleId) => setCfg((prev: Record<string, any>) => ({ ...prev, adminRoleIds: toggleId(Array.isArray(prev.adminRoleIds) ? prev.adminRoleIds : [], roleId) }))} />
              <RoleChips label="Immunity roles" roles={roles} selected={Array.isArray(cfg.immunityRoleIds) ? cfg.immunityRoleIds : []} onToggle={(roleId) => setCfg((prev: Record<string, any>) => ({ ...prev, immunityRoleIds: toggleId(Array.isArray(prev.immunityRoleIds) ? prev.immunityRoleIds : [], roleId) }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label>Log channel</label>
                <select style={input} value={String(logging.logChannelId || "")} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, logging: { ...(prev.logging || {}), logChannelId: event.target.value } }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <label>Ignored channels</label>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #4f0000", borderRadius: 10, padding: 10, background: "#110000" }}>
                  {textChannels.map((channel) => (
                    <label key={`ignore_${channel.id}`} style={{ display: "block", marginBottom: 6 }}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(logging.ignoreChannelIds) && logging.ignoreChannelIds.includes(channel.id)}
                        onChange={() => setCfg((prev: Record<string, any>) => ({
                          ...prev,
                          logging: {
                            ...(prev.logging || {}),
                            ignoreChannelIds: toggleId(Array.isArray(prev.logging?.ignoreChannelIds) ? prev.logging.ignoreChannelIds : [], channel.id),
                          },
                        }))}
                      />{" "}
                      #{channel.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Automod Policy Matrix</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              {[
                ["badWordsAction", "Bad words"],
                ["repeatedTextAction", "Repeated text"],
                ["spamAction", "Spam"],
                ["capsAction", "Caps"],
                ["linksAction", "Links"],
                ["inviteAction", "Invites"],
                ["mentionAction", "Mentions"],
                ["zalgoAction", "Zalgo"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label>{label}</label>
                  <select style={input} value={String(automod[key] || "Disabled")} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), [key]: event.target.value } }))}>
                    {automodActions.map((option) => <option key={`${key}:${option}`} value={option}>{option}</option>)}
                  </select>
                </div>
              ))}
              <div>
                <label>Spam threshold</label>
                <input style={input} type="number" value={Number(automod.spamThreshold || 5)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), spamThreshold: Number(event.target.value || 0) } }))} />
              </div>
              <div>
                <label>Caps threshold</label>
                <input style={input} type="number" value={Number(automod.capsThreshold || 70)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), capsThreshold: Number(event.target.value || 0) } }))} />
              </div>
              <div>
                <label>Mention threshold</label>
                <input style={input} type="number" value={Number(automod.mentionThreshold || 5)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), mentionThreshold: Number(event.target.value || 0) } }))} />
              </div>
              <div>
                <label>Timeout minutes</label>
                <input style={input} type="number" value={Number(automod.timeoutDurationMinutes || 10)} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), timeoutDurationMinutes: Number(event.target.value || 0) } }))} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label>Blocked words</label>
                <textarea style={{ ...input, minHeight: 120 }} value={Array.isArray(automod.blockedWords) ? automod.blockedWords.join("\n") : ""} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), blockedWords: event.target.value.split(/\r?\n+/).map((value) => value.trim()).filter(Boolean) } }))} />
              </div>
              <div>
                <label>Warning message</label>
                <textarea style={{ ...input, minHeight: 120 }} value={String(automod.warningMessage || "")} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, automod: { ...(prev.automod || {}), warningMessage: event.target.value } }))} />
              </div>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Logging Events</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(180px,1fr))", gap: 10 }}>
              {[
                ["messageDeleted", "Message deleted"],
                ["messageUpdated", "Message updated"],
                ["memberJoined", "Member joined"],
                ["memberLeft", "Member left"],
                ["memberRoleChanged", "Member role changed"],
                ["moderationBan", "Moderation ban"],
                ["moderationWarn", "Moderation warn"],
                ["invitePosted", "Invite posted"],
                ["channelCreated", "Channel created"],
                ["channelUpdated", "Channel updated"],
                ["channelDeleted", "Channel deleted"],
                ["serverUpdated", "Server updated"],
              ].map(([key, label]) => (
                <label key={key}><input type="checkbox" checked={Boolean(logging[key])} onChange={(event) => setCfg((prev: Record<string, any>) => ({ ...prev, logging: { ...(prev.logging || {}), [key]: event.target.checked } }))} /> {label}</label>
              ))}
            </div>
          </div>

          <div style={box}>
            <button onClick={() => void save()} disabled={saving} style={action}>
              {saving ? "Saving..." : "Save Live Policy"}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
