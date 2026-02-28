"use client";

import { useEffect, useMemo, useState } from "react";

type GuildRole = { id: string; name: string; position?: number };
type GuildChannel = { id: string; name: string; type?: number | string };

type CustomCommand = {
  id: string;
  guildId: string;
  name: string;
  description?: string | null;
  enabled: boolean;
  hideFromHelp: boolean;
  staffOnly: boolean;
  roleRequired?: string | null;
  cooldownSec: number;
  costCoins: number;
  actions: any[];
};

type ActionType =
  | "SEND_MESSAGE"
  | "REPLY"
  | "DM"
  | "ADD_ROLE"
  | "REMOVE_ROLE"
  | "REACT"
  | "DELAY"
  | "CREATE_THREAD"
  | "RAW";

type ActionDraft = {
  id: string;
  type: ActionType;
  channelId: string;
  content: string;
  roleId: string;
  emoji: string;
  delayMs: string;
  threadName: string;
  threadArchiveMin: string;
  ephemeral: boolean;
  rawAction?: any;
};

type CommandDraft = {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
  hideFromHelp: boolean;
  staffOnly: boolean;
  roleRequired: string;
  cooldownSec: string;
  costCoins: string;
  actions: ActionDraft[];
};

const ACTION_LIBRARY: Array<{ type: ActionType; title: string; desc: string }> = [
  { type: "SEND_MESSAGE", title: "Send Message to Channel", desc: "Post in a selected channel" },
  { type: "REPLY", title: "Reply in Current Channel", desc: "Reply where command was used" },
  { type: "DM", title: "Send Direct Message", desc: "DM the user who ran command" },
  { type: "ADD_ROLE", title: "Give Role", desc: "Grant role to user" },
  { type: "REMOVE_ROLE", title: "Remove Role", desc: "Take role from user" },
  { type: "REACT", title: "React with Emoji", desc: "Add emoji reaction" },
  { type: "DELAY", title: "Delay Step", desc: "Wait before next step" },
  { type: "CREATE_THREAD", title: "Create Thread", desc: "Create thread from message context" }
];

function makeId() {
  return `${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const p = new URLSearchParams(window.location.search);
  const fromUrl = String(p.get("guildId") || "").trim();
  const fromStore = String(localStorage.getItem("activeGuildId") || "").trim();
  const guildId = fromUrl || fromStore || "";
  if (guildId) {
    localStorage.setItem("activeGuildId", guildId);
    if (!fromUrl) {
      p.set("guildId", guildId);
      window.history.replaceState({}, "", `${window.location.pathname}?${p.toString()}`);
    }
  }
  return guildId;
}

function emptyAction(type: ActionType): ActionDraft {
  return {
    id: makeId(),
    type,
    channelId: "",
    content: "",
    roleId: "",
    emoji: "",
    delayMs: "1000",
    threadName: "Thread",
    threadArchiveMin: "60",
    ephemeral: false
  };
}

function emptyDraft(): CommandDraft {
  return {
    name: "",
    description: "",
    enabled: true,
    hideFromHelp: false,
    staffOnly: false,
    roleRequired: "",
    cooldownSec: "0",
    costCoins: "0",
    actions: []
  };
}

function apiActionToDraft(a: any): ActionDraft {
  const type = String(a?.type || "").toUpperCase();
  const c = a?.config || {};

  if (type === "SEND_MESSAGE") return { ...emptyAction("SEND_MESSAGE"), channelId: String(c.channelId || ""), content: String(c.content || "") };
  if (type === "REPLY") return { ...emptyAction("REPLY"), content: String(c.content || ""), ephemeral: !!c.ephemeral };
  if (type === "DM") return { ...emptyAction("DM"), content: String(c.content || "") };
  if (type === "ADD_ROLE") return { ...emptyAction("ADD_ROLE"), roleId: String(c.roleId || "") };
  if (type === "REMOVE_ROLE") return { ...emptyAction("REMOVE_ROLE"), roleId: String(c.roleId || "") };
  if (type === "REACT") return { ...emptyAction("REACT"), emoji: String(c.emoji || "") };
  if (type === "DELAY") return { ...emptyAction("DELAY"), delayMs: String(c.ms ?? 1000) };
  if (type === "CREATE_THREAD")
    return {
      ...emptyAction("CREATE_THREAD"),
      threadName: String(c.name || "Thread"),
      threadArchiveMin: String(c.autoArchiveDuration ?? 60)
    };

  return { ...emptyAction("RAW"), rawAction: a };
}

function draftToApiAction(a: ActionDraft): any {
  if (a.type === "RAW" && a.rawAction) return a.rawAction;
  if (a.type === "SEND_MESSAGE") return { type: "SEND_MESSAGE", config: { channelId: a.channelId, content: a.content } };
  if (a.type === "REPLY") return { type: "REPLY", config: { content: a.content, ephemeral: a.ephemeral } };
  if (a.type === "DM") return { type: "DM", config: { content: a.content } };
  if (a.type === "ADD_ROLE") return { type: "ADD_ROLE", config: { roleId: a.roleId } };
  if (a.type === "REMOVE_ROLE") return { type: "REMOVE_ROLE", config: { roleId: a.roleId } };
  if (a.type === "REACT") return { type: "REACT", config: { emoji: a.emoji } };
  if (a.type === "DELAY") return { type: "DELAY", config: { ms: Number(a.delayMs || 0) } };
  if (a.type === "CREATE_THREAD")
    return { type: "CREATE_THREAD", config: { name: a.threadName || "Thread", autoArchiveDuration: Number(a.threadArchiveMin || 60) } };
  return { type: "REPLY", config: { content: "No action configured." } };
}

export default function CustomCommandsPage() {
  const [guildId, setGuildId] = useState("");
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("new");
  const [draft, setDraft] = useState<CommandDraft>(emptyDraft());

  const filteredCommands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.name.toLowerCase().includes(q));
  }, [commands, search]);

  async function loadGuildData(targetGuildId: string) {
    const r = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(targetGuildId)}`);
    const j = await r.json();
    setRoles(Array.isArray(j?.roles) ? j.roles : []);
    setChannels(Array.isArray(j?.channels) ? j.channels : []);
  }

  async function loadCommands(targetGuildId: string) {
    const r = await fetch(`/api/bot/commands?guildId=${encodeURIComponent(targetGuildId)}`);
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || "Failed to load commands");
    setCommands(Array.isArray(j) ? j : []);
  }

  async function loadAll(targetGuildId: string) {
    setLoading(true);
    setMsg("");
    try {
      await Promise.all([loadGuildData(targetGuildId), loadCommands(targetGuildId)]);
    } catch (e: any) {
      setMsg(e?.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const gid = getGuildId();
    setGuildId(gid);
    if (gid) loadAll(gid);
    else setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedId === "new") {
      setDraft(emptyDraft());
      return;
    }
    const cmd = commands.find((c) => c.id === selectedId);
    if (!cmd) return;

    setDraft({
      id: cmd.id,
      name: cmd.name || "",
      description: String(cmd.description || ""),
      enabled: !!cmd.enabled,
      hideFromHelp: !!cmd.hideFromHelp,
      staffOnly: !!cmd.staffOnly,
      roleRequired: String(cmd.roleRequired || ""),
      cooldownSec: String(cmd.cooldownSec ?? 0),
      costCoins: String(cmd.costCoins ?? 0),
      actions: Array.isArray(cmd.actions) ? cmd.actions.map(apiActionToDraft) : []
    });
  }, [selectedId, commands]);

  function updateDraft<K extends keyof CommandDraft>(key: K, value: CommandDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function addAction(type: ActionType) {
    setDraft((prev) => ({ ...prev, actions: [...prev.actions, emptyAction(type)] }));
  }

  function updateAction(id: string, patch: Partial<ActionDraft>) {
    setDraft((prev) => ({
      ...prev,
      actions: prev.actions.map((a) => (a.id === id ? { ...a, ...patch } : a))
    }));
  }

  function removeAction(id: string) {
    setDraft((prev) => ({ ...prev, actions: prev.actions.filter((a) => a.id !== id) }));
  }

  function moveAction(id: string, dir: -1 | 1) {
    setDraft((prev) => {
      const idx = prev.actions.findIndex((a) => a.id === id);
      if (idx < 0) return prev;
      const next = idx + dir;
      if (next < 0 || next >= prev.actions.length) return prev;
      const arr = [...prev.actions];
      const tmp = arr[idx];
      arr[idx] = arr[next];
      arr[next] = tmp;
      return { ...prev, actions: arr };
    });
  }

  async function saveCommand() {
    if (!guildId) return;
    const cleanName = draft.name.replace(/^!+/, "").trim().toLowerCase();
    if (!cleanName) {
      setMsg("Command name is required.");
      return;
    }
    if (!draft.actions.length) {
      setMsg("Add at least one action.");
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      const payload = {
        guildId,
        name: cleanName,
        description: draft.description || null,
        enabled: draft.enabled,
        hideFromHelp: draft.hideFromHelp,
        staffOnly: draft.staffOnly,
        roleRequired: draft.roleRequired || null,
        cooldownSec: Number(draft.cooldownSec || 0),
        costCoins: Number(draft.costCoins || 0),
        actions: draft.actions.map(draftToApiAction),
        createdBy: "dashboard"
      };

      if (!draft.id) {
        const r = await fetch("/api/bot/commands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Create failed");
      } else {
        const r = await fetch(`/api/bot/command/${encodeURIComponent(draft.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j?.error || "Update failed");
      }

      await loadCommands(guildId);
      setMsg(draft.id ? "Command updated." : "Command created.");
      if (!draft.id) setSelectedId("new");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function quickToggle(cmd: CustomCommand) {
    try {
      const r = await fetch(`/api/bot/command/${encodeURIComponent(cmd.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !cmd.enabled })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Toggle failed");
      await loadCommands(guildId);
    } catch (e: any) {
      setMsg(e?.message || "Toggle failed");
    }
  }

  async function quickDelete(cmd: CustomCommand) {
    try {
      const r = await fetch(`/api/bot/command/${encodeURIComponent(cmd.id)}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Delete failed");
      await loadCommands(guildId);
      if (selectedId === cmd.id) setSelectedId("new");
    } catch (e: any) {
      setMsg(e?.message || "Delete failed");
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ff6b6b", maxWidth: 1400 }}>
      <h1 style={h1Style}>Command Studio</h1>
      <p style={{ marginTop: 0 }}>Guild: {guildId}</p>
      {msg ? <p style={{ color: "#ffb3b3" }}>{msg}</p> : null}
      {loading ? <p>Loading...</p> : null}

      {!loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14 }}>
          <div style={panelStyle}>
            <button onClick={() => setSelectedId("new")} style={btnPrimary}>
              + New Command
            </button>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands"
              style={{ ...inputStyle, marginTop: 10 }}
            />

            <div style={{ marginTop: 10, display: "grid", gap: 8, maxHeight: 720, overflowY: "auto" }}>
              {filteredCommands.map((cmd) => (
                <div
                  key={cmd.id}
                  style={{
                    ...listRow,
                    borderColor: selectedId === cmd.id ? "#aa0000" : "#5f0000"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <button onClick={() => setSelectedId(cmd.id)} style={listBtn}>
                      !{cmd.name}
                    </button>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => quickToggle(cmd)} style={btnGhostMini}>
                        {cmd.enabled ? "On" : "Off"}
                      </button>
                      <button onClick={() => quickDelete(cmd)} style={btnDangerMini}>
                        X
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#ff9d9d" }}>
                    {cmd.enabled ? "Enabled" : "Disabled"} • cooldown {cmd.cooldownSec || 0}s
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <h3 style={sectionTitle}>{draft.id ? `Edit !${draft.name}` : "Create Command"}</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
              <input
                value={draft.name}
                onChange={(e) => updateDraft("name", e.target.value)}
                placeholder="Command name (no ! needed)"
                style={inputStyle}
              />

              <textarea
                value={draft.description}
                onChange={(e) => updateDraft("description", e.target.value)}
                rows={2}
                placeholder="Description"
                style={{ ...inputStyle, fontFamily: "inherit" }}
              />
            </div>

            <details style={{ marginTop: 12 }}>
              <summary style={summaryStyle}>Advanced options and permissions</summary>
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select value={draft.roleRequired} onChange={(e) => updateDraft("roleRequired", e.target.value)} style={inputStyle}>
                  <option value="">No required role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={draft.cooldownSec} onChange={(e) => updateDraft("cooldownSec", e.target.value)} placeholder="Cooldown sec" style={inputStyle} />
                  <input value={draft.costCoins} onChange={(e) => updateDraft("costCoins", e.target.value)} placeholder="Coin cost" style={inputStyle} />
                </div>

                <label><input type="checkbox" checked={draft.enabled} onChange={(e) => updateDraft("enabled", e.target.checked)} /> enabled</label>
                <label><input type="checkbox" checked={draft.staffOnly} onChange={(e) => updateDraft("staffOnly", e.target.checked)} /> staff only</label>
                <label><input type="checkbox" checked={draft.hideFromHelp} onChange={(e) => updateDraft("hideFromHelp", e.target.checked)} /> hide from help</label>
              </div>
            </details>

            <div style={{ marginTop: 16 }}>
              <h4 style={subTitle}>Action Library</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(220px, 1fr))", gap: 8 }}>
                {ACTION_LIBRARY.map((a) => (
                  <button key={a.type} onClick={() => addAction(a.type)} style={actionLibraryCard}>
                    <div style={{ fontWeight: 800 }}>{a.title}</div>
                    <div style={{ fontSize: 12, color: "#ff9d9d" }}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              {draft.actions.map((a, idx) => (
                <div key={a.id} style={actionCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <strong style={{ color: "#ffdede" }}>Action #{idx + 1}: {a.type}</strong>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => moveAction(a.id, -1)} style={btnGhostMini}>↑</button>
                      <button onClick={() => moveAction(a.id, 1)} style={btnGhostMini}>↓</button>
                      <button onClick={() => removeAction(a.id)} style={btnDangerMini}>Remove</button>
                    </div>
                  </div>

                  {(a.type === "SEND_MESSAGE") && (
                    <div style={twoCol}>
                      <select value={a.channelId} onChange={(e) => updateAction(a.id, { channelId: e.target.value })} style={inputStyle}>
                        <option value="">Select channel</option>
                        {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                      </select>
                      <textarea rows={3} value={a.content} onChange={(e) => updateAction(a.id, { content: e.target.value })} placeholder="Message to send" style={{ ...inputStyle, fontFamily: "inherit" }} />
                    </div>
                  )}

                  {(a.type === "REPLY") && (
                    <div style={twoCol}>
                      <textarea rows={3} value={a.content} onChange={(e) => updateAction(a.id, { content: e.target.value })} placeholder="Reply text" style={{ ...inputStyle, fontFamily: "inherit" }} />
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={a.ephemeral} onChange={(e) => updateAction(a.id, { ephemeral: e.target.checked })} />
                        ephemeral (slash context)
                      </label>
                    </div>
                  )}

                  {(a.type === "DM") && (
                    <textarea rows={3} value={a.content} onChange={(e) => updateAction(a.id, { content: e.target.value })} placeholder="DM text" style={{ ...inputStyle, fontFamily: "inherit" }} />
                  )}

                  {(a.type === "ADD_ROLE" || a.type === "REMOVE_ROLE") && (
                    <select value={a.roleId} onChange={(e) => updateAction(a.id, { roleId: e.target.value })} style={inputStyle}>
                      <option value="">Select role</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}

                  {(a.type === "REACT") && (
                    <input value={a.emoji} onChange={(e) => updateAction(a.id, { emoji: e.target.value })} placeholder="Emoji (😀, 🔥, <:custom:123>)" style={inputStyle} />
                  )}

                  {(a.type === "DELAY") && (
                    <input value={a.delayMs} onChange={(e) => updateAction(a.id, { delayMs: e.target.value })} placeholder="Delay in ms (1000)" style={inputStyle} />
                  )}

                  {(a.type === "CREATE_THREAD") && (
                    <div style={twoCol}>
                      <input value={a.threadName} onChange={(e) => updateAction(a.id, { threadName: e.target.value })} placeholder="Thread name" style={inputStyle} />
                      <input value={a.threadArchiveMin} onChange={(e) => updateAction(a.id, { threadArchiveMin: e.target.value })} placeholder="Auto archive min (60)" style={inputStyle} />
                    </div>
                  )}

                  {(a.type === "RAW") && (
                    <div style={{ fontSize: 12, color: "#ffb0b0" }}>
                      Unsupported legacy action kept safely. It will be preserved on save.
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button onClick={saveCommand} disabled={saving} style={btnPrimary}>
                {saving ? "Saving..." : draft.id ? "Save Command" : "Create Command"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const h1Style: React.CSSProperties = {
  color: "#ff3131",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: 6
};

const panelStyle: React.CSSProperties = {
  border: "1px solid #6f0000",
  borderRadius: 12,
  padding: 12,
  background: "rgba(100,0,0,0.08)"
};

const listRow: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 10,
  padding: 8,
  background: "rgba(255,0,0,0.05)"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  background: "#0d0d0d",
  border: "1px solid #7a0000",
  color: "#ffd2d2",
  borderRadius: 8
};

const btnPrimary: React.CSSProperties = {
  border: "1px solid #9a0000",
  background: "rgba(255,0,0,0.15)",
  color: "#ffd6d6",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer"
};

const btnGhostMini: React.CSSProperties = {
  border: "1px solid #8a0000",
  background: "transparent",
  color: "#ffd6d6",
  padding: "4px 8px",
  borderRadius: 8,
  cursor: "pointer"
};

const btnDangerMini: React.CSSProperties = {
  border: "1px solid #9a0000",
  background: "transparent",
  color: "#ffb0b0",
  padding: "4px 8px",
  borderRadius: 8,
  cursor: "pointer"
};

const listBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#ffdede",
  cursor: "pointer",
  fontWeight: 800,
  padding: 0,
  textAlign: "left"
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#ffdada",
  letterSpacing: "0.08em",
  textTransform: "uppercase"
};

const subTitle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#ffdada",
  letterSpacing: "0.06em",
  textTransform: "uppercase"
};

const summaryStyle: React.CSSProperties = {
  cursor: "pointer",
  color: "#ffbdbd",
  letterSpacing: "0.04em"
};

const actionLibraryCard: React.CSSProperties = {
  border: "1px solid #7a0000",
  background: "rgba(255,0,0,0.06)",
  color: "#ffd6d6",
  borderRadius: 10,
  padding: "10px 12px",
  textAlign: "left",
  cursor: "pointer"
};

const actionCard: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 10,
  padding: 10,
  background: "rgba(255,0,0,0.04)"
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginTop: 8
};
