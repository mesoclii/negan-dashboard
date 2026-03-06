"use client";



import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; position: number };
type Channel = { id: string; name: string; type: number };

type CommandRule = {
  enabled: boolean;
  requiredRoleIds: string[];
  cooldownSec: number;
  logUsage: boolean;
  replyOnDeny: boolean;
  denyMessage: string;
};

type Config = {
  active: boolean;
  slashEnabled: boolean;
  prefixEnabled: boolean;
  onlyAdminsByDefault: boolean;
  allowStaffOverride: boolean;
  restrictChannelIds: string[];
  notes: string;
  commands: Record<string, CommandRule>;
};

const COMMANDS: Array<{ key: string; label: string; desc: string }> = [
  { key: "ban", label: "Ban", desc: "Ban member from server" },
  { key: "kick", label: "Kick", desc: "Kick member from server" },
  { key: "mute", label: "Mute", desc: "Mute member" },
  { key: "unmute", label: "Unmute", desc: "Unmute member" },
  { key: "warn", label: "Warn", desc: "Warn member" },
  { key: "clear", label: "Clear", desc: "Delete recent messages" },
  { key: "lock", label: "Lock", desc: "Lock channel" },
  { key: "unlock", label: "Unlock", desc: "Unlock channel" },
  { key: "slowmode", label: "Slowmode", desc: "Set channel slowmode" },
  { key: "timeout", label: "Timeout", desc: "Timeout member" },
  { key: "untimeout", label: "Untimeout", desc: "Remove timeout" },
  { key: "nickname", label: "Nickname", desc: "Change nickname" },
  { key: "role_add", label: "Role Add", desc: "Add role to member" },
  { key: "role_remove", label: "Role Remove", desc: "Remove role from member" },
  { key: "audit", label: "Audit", desc: "Audit actions/reports" },
  { key: "purge_links", label: "Purge Links", desc: "Clean link spam" },
  { key: "purge_invites", label: "Purge Invites", desc: "Clean invite spam" },
  { key: "quarantine", label: "Quarantine", desc: "Quarantine member" },
  { key: "release", label: "Release", desc: "Release from quarantine" }
];

function makeRule(): CommandRule {
  return {
    enabled: true,
    requiredRoleIds: [],
    cooldownSec: 0,
    logUsage: true,
    replyOnDeny: true,
    denyMessage: "You do not have permission to use this command."
  };
}

const DEFAULT_CONFIG: Config = {
  active: true,
  slashEnabled: true,
  prefixEnabled: true,
  onlyAdminsByDefault: false,
  allowStaffOverride: true,
  restrictChannelIds: [],
  notes: "",
  commands: Object.fromEntries(COMMANDS.map((c) => [c.key, makeRule()]))
};

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

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function SecurityCommandsPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState("ban");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const selectedRule = useMemo(() => cfg.commands[selected] || makeRule(), [cfg.commands, selected]);

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const [cfgRes, guildRes] = await Promise.all([
          fetch(`/api/setup/security-command-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const guildJson = await guildRes.json().catch(() => ({}));

        const merged: Config = {
          ...DEFAULT_CONFIG,
          ...(cfgJson?.config || {}),
          commands: { ...DEFAULT_CONFIG.commands, ...(cfgJson?.config?.commands || {}) }
        };
        setCfg(merged);

        const r = Array.isArray(guildJson?.roles) ? guildJson.roles : [];
        setRoles(
          r
            .map((x: any) => ({ id: String(x.id), name: String(x.name || x.id), position: Number(x.position || 0) }))
            .sort((a: Role, b: Role) => b.position - a.position)
        );

        const c = Array.isArray(guildJson?.channels) ? guildJson.channels : [];
        setChannels(
          c
            .filter((x: any) => Number(x.type) === 0 || Number(x.type) === 5)
            .map((x: any) => ({ id: String(x.id), name: String(x.name || x.id), type: Number(x.type || 0) }))
        );
      } catch (e: any) {
        setMsg(e?.message || "Failed to load command config");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  function patchRule(commandKey: string, patch: Partial<CommandRule>) {
    setCfg({
      ...cfg,
      commands: {
        ...cfg.commands,
        [commandKey]: { ...(cfg.commands[commandKey] || makeRule()), ...patch }
      }
    });
  }

  function applyPreset(mode: "mod_core_on" | "safe_readonly") {
    const next = { ...cfg, commands: { ...cfg.commands } };
    if (mode === "mod_core_on") {
      COMMANDS.forEach((c) => {
        next.commands[c.key] = { ...(next.commands[c.key] || makeRule()), enabled: true };
      });
    } else {
      ["ban", "kick", "quarantine", "release", "timeout", "untimeout", "role_add", "role_remove", "nickname"].forEach((k) => {
        next.commands[k] = { ...(next.commands[k] || makeRule()), enabled: false };
      });
      next.commands["warn"] = { ...(next.commands["warn"] || makeRule()), enabled: true };
      next.commands["clear"] = { ...(next.commands["clear"] || makeRule()), enabled: true };
      next.commands["audit"] = { ...(next.commands["audit"] || makeRule()), enabled: true };
    }
    setCfg(next);
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      let r = await fetch("/api/setup/security-command-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      let j = await r.json().catch(() => ({}));

      if (!r.ok || j?.success === false) {
        r = await fetch("/api/setup/security-command-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, config: cfg })
        });
        j = await r.json().catch(() => ({}));
      }

      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Saved command config.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffb3b3", padding: 18, maxWidth: 1280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h1 style={{ margin: 0, color: "#ff3b3b", letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Security Commands
        </h1>
        <button style={btn} onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId} {msg ? `• ${msg}` : ""}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Global</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 8, marginBottom: 8 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Active</label>
              <label><input type="checkbox" checked={cfg.slashEnabled} onChange={(e) => setCfg({ ...cfg, slashEnabled: e.target.checked })} /> Slash enabled</label>
              <label><input type="checkbox" checked={cfg.prefixEnabled} onChange={(e) => setCfg({ ...cfg, prefixEnabled: e.target.checked })} /> Prefix enabled</label>
              <label><input type="checkbox" checked={cfg.onlyAdminsByDefault} onChange={(e) => setCfg({ ...cfg, onlyAdminsByDefault: e.target.checked })} /> Admin only by default</label>
              <label><input type="checkbox" checked={cfg.allowStaffOverride} onChange={(e) => setCfg({ ...cfg, allowStaffOverride: e.target.checked })} /> Allow staff override</label>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button style={btn} onClick={() => applyPreset("mod_core_on")}>Preset: All Mod On</button>
              <button style={btn} onClick={() => applyPreset("safe_readonly")}>Preset: Safe Read-only</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 14 }}>
            <div style={card}>
              <h3 style={{ marginTop: 0, color: "#ff4444" }}>Command List</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {COMMANDS.map((c) => {
                  const enabled = cfg.commands[c.key]?.enabled ?? true;
                  const active = selected === c.key;
                  return (
                    <button
                      key={c.key}
                      style={{
                        ...btn,
                        textAlign: "left",
                        background: active ? "#2a0000" : "#140000",
                        borderColor: active ? "#ff3b3b" : "#7f0000"
                      }}
                      onClick={() => setSelected(c.key)}
                    >
                      {c.label} • {enabled ? "On" : "Off"}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={card}>
              <h3 style={{ marginTop: 0, color: "#ff4444" }}>
                Edit Command: {COMMANDS.find((c) => c.key === selected)?.label || selected}
              </h3>
              <div style={{ marginBottom: 10, color: "#ff9a9a" }}>
                {COMMANDS.find((c) => c.key === selected)?.desc || ""}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(180px,1fr))", gap: 8 }}>
                <label><input type="checkbox" checked={selectedRule.enabled} onChange={(e) => patchRule(selected, { enabled: e.target.checked })} /> Enabled</label>
                <label><input type="checkbox" checked={selectedRule.logUsage} onChange={(e) => patchRule(selected, { logUsage: e.target.checked })} /> Log usage</label>
                <label><input type="checkbox" checked={selectedRule.replyOnDeny} onChange={(e) => patchRule(selected, { replyOnDeny: e.target.checked })} /> Reply on deny</label>
                <div>
                  <label>Cooldown (sec)</label>
                  <input
                    style={input}
                    type="number"
                    value={selectedRule.cooldownSec}
                    onChange={(e) => patchRule(selected, { cooldownSec: Number(e.target.value || 0) })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <label>Deny message</label>
                <textarea
                  style={{ ...input, minHeight: 70 }}
                  value={selectedRule.denyMessage}
                  onChange={(e) => patchRule(selected, { denyMessage: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 6 }}>Required roles (empty = global/default)</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(200px,1fr))", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                  {roles.map((r) => (
                    <label key={r.id}>
                      <input
                        type="checkbox"
                        checked={selectedRule.requiredRoleIds.includes(r.id)}
                        onChange={() =>
                          patchRule(selected, { requiredRoleIds: toggleId(selectedRule.requiredRoleIds, r.id) })
                        }
                      />{" "}
                      {r.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Restricted Channels (commands blocked)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 6, maxHeight: 220, overflowY: "auto" }}>
              {channels.map((c) => (
                <label key={c.id}>
                  <input
                    type="checkbox"
                    checked={cfg.restrictChannelIds.includes(c.id)}
                    onChange={() => setCfg({ ...cfg, restrictChannelIds: toggleId(cfg.restrictChannelIds, c.id) })}
                  />{" "}
                  #{c.name}
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Notes</h3>
            <textarea style={{ ...input, minHeight: 80 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
          </div>

          <button style={btn} onClick={saveAll} disabled={saving}>
            {saving ? "Saving..." : "Save All"}
          </button>
        </>
      )}
    </div>
  );
}
