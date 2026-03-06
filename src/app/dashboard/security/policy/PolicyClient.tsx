"use client";



import { useEffect, useState } from "react";

type Role = { id: string; name: string };
type Channel = { id: string; name: string };

type CommandRule = {
  command: string;
  enabled: boolean;
  allowedRoleIds: string[];
  deniedRoleIds: string[];
  allowedChannelIds: string[];
  deniedChannelIds: string[];
  cooldownSec: number;
};

type Config = {
  active: boolean;
  immunityRoleIds: string[];
  commandPolicy: {
    defaultAccess: "allow" | "deny";
    staffBypass: boolean;
    allowedRoleIds: string[];
    deniedRoleIds: string[];
    commandRules: CommandRule[];
  };
  channelRestrictions: {
    restrictedChannelIds: string[];
    readOnlyChannelIds: string[];
    mediaOnlyChannelIds: string[];
    blockedCommandChannelIds: string[];
    ignoredChannelIds: string[];
    allowBotsInRestricted: boolean;
  };
  escalation: {
    enabled: boolean;
    resetWindowMinutes: number;
    warnThreshold: number;
    muteThreshold: number;
    timeoutThreshold: number;
    timeoutMinutes: number;
    kickThreshold: number;
    banThreshold: number;
    notifyChannelId: string;
  };
  lockdownPolicy: {
    autoLockdownEnabled: boolean;
    raidModeEnabled: boolean;
    exemptRoleIds: string[];
    exemptChannelIds: string[];
    lockDurationMinutes: number;
  };
  logging: {
    enabled: boolean;
    logChannelId: string;
    includeCommandDenials: boolean;
    includeChannelViolations: boolean;
    includeEscalationActions: boolean;
    includeLockdownEvents: boolean;
  };
  notes: string;
};

const DEFAULT_CONFIG: Config = {
  active: true,
  immunityRoleIds: [],
  commandPolicy: {
    defaultAccess: "allow",
    staffBypass: true,
    allowedRoleIds: [],
    deniedRoleIds: [],
    commandRules: [
      {
        command: "tts",
        enabled: true,
        allowedRoleIds: [],
        deniedRoleIds: [],
        allowedChannelIds: [],
        deniedChannelIds: [],
        cooldownSec: 0
      }
    ]
  },
  channelRestrictions: {
    restrictedChannelIds: [],
    readOnlyChannelIds: [],
    mediaOnlyChannelIds: [],
    blockedCommandChannelIds: [],
    ignoredChannelIds: [],
    allowBotsInRestricted: false
  },
  escalation: {
    enabled: true,
    resetWindowMinutes: 15,
    warnThreshold: 3,
    muteThreshold: 5,
    timeoutThreshold: 7,
    timeoutMinutes: 10,
    kickThreshold: 10,
    banThreshold: 14,
    notifyChannelId: ""
  },
  lockdownPolicy: {
    autoLockdownEnabled: false,
    raidModeEnabled: false,
    exemptRoleIds: [],
    exemptChannelIds: [],
    lockDurationMinutes: 15
  },
  logging: {
    enabled: true,
    logChannelId: "",
    includeCommandDenials: true,
    includeChannelViolations: true,
    includeEscalationActions: true,
    includeLockdownEvents: true
  },
  notes: ""
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function fromCsv(v: string): string[] {
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

function toCsv(v: string[]): string {
  return (v || []).join(", ");
}

function mergeConfig(raw: any): Config {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  if (!raw || typeof raw !== "object") return base;
  return {
    ...base,
    ...raw,
    commandPolicy: {
      ...base.commandPolicy,
      ...(raw.commandPolicy || {}),
      commandRules: Array.isArray(raw?.commandPolicy?.commandRules) ? raw.commandPolicy.commandRules : base.commandPolicy.commandRules
    },
    channelRestrictions: { ...base.channelRestrictions, ...(raw.channelRestrictions || {}) },
    escalation: { ...base.escalation, ...(raw.escalation || {}) },
    lockdownPolicy: { ...base.lockdownPolicy, ...(raw.lockdownPolicy || {}) },
    logging: { ...base.logging, ...(raw.logging || {}) }
  };
}

const box = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.07)", marginBottom: 14 };
const input = { width: "100%", padding: 10, background: "#0a0a0a", border: "1px solid #6f0000", color: "#ffd7d7", borderRadius: 8 } as const;

export default function SecurityPolicyPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
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
      try {
        setLoading(true);
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/security-policy-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const cfgJson = await cfgRes.json();
        const gd = await gdRes.json();

        setCfg(mergeConfig(cfgJson?.config));
        setRoles(Array.isArray(gd?.roles) ? gd.roles.map((r: any) => ({ id: String(r.id), name: String(r.name) })) : []);
        setChannels(Array.isArray(gd?.channels) ? gd.channels.map((c: any) => ({ id: String(c.id), name: String(c.name) })) : []);
      } catch {
        setMsg("Failed to load security policy config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function save() {
    if (!guildId) return;
    try {
      setSaving(true);
      setMsg("");
      const res = await fetch("/api/setup/security-policy-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      const j = await res.json();
      if (!res.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Security policy saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function addRule() {
    setCfg((prev) => ({
      ...prev,
      commandPolicy: {
        ...prev.commandPolicy,
        commandRules: [
          ...prev.commandPolicy.commandRules,
          {
            command: "",
            enabled: true,
            allowedRoleIds: [],
            deniedRoleIds: [],
            allowedChannelIds: [],
            deniedChannelIds: [],
            cooldownSec: 0
          }
        ]
      }
    }));
  }

  function updateRule(i: number, patch: Partial<CommandRule>) {
    setCfg((prev) => {
      const rules = [...prev.commandPolicy.commandRules];
      rules[i] = { ...rules[i], ...patch };
      return { ...prev, commandPolicy: { ...prev.commandPolicy, commandRules: rules } };
    });
  }

  function removeRule(i: number) {
    setCfg((prev) => ({
      ...prev,
      commandPolicy: { ...prev.commandPolicy, commandRules: prev.commandPolicy.commandRules.filter((_, idx) => idx !== i) }
    }));
  }

  if (!guildId) return <div style={{ color: "#ff7777", padding: 20 }}>Missing guildId.</div>;

  return (
    <div style={{ color: "#ff4d4d", padding: 20, maxWidth: 1240 }}>
      <h1 style={{ marginTop: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Security - Policy</h1>
      <p>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={box}>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Policy engine active</label>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Immunity + Global Command Policy</h3>
            <div style={{ marginBottom: 8 }}>
              <label>Immunity role IDs (csv)</label>
              <input style={input} value={toCsv(cfg.immunityRoleIds)} onChange={(e) => setCfg({ ...cfg, immunityRoleIds: fromCsv(e.target.value) })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Default access</label>
                <select style={input} value={cfg.commandPolicy.defaultAccess} onChange={(e) => setCfg({ ...cfg, commandPolicy: { ...cfg.commandPolicy, defaultAccess: e.target.value as "allow" | "deny" } })}>
                  <option value="allow">allow</option>
                  <option value="deny">deny</option>
                </select>
              </div>
              <div>
                <label><input type="checkbox" checked={cfg.commandPolicy.staffBypass} onChange={(e) => setCfg({ ...cfg, commandPolicy: { ...cfg.commandPolicy, staffBypass: e.target.checked } })} /> Staff bypass</label>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <input style={input} placeholder="Allowed role IDs (csv)" value={toCsv(cfg.commandPolicy.allowedRoleIds)} onChange={(e) => setCfg({ ...cfg, commandPolicy: { ...cfg.commandPolicy, allowedRoleIds: fromCsv(e.target.value) } })} />
              <input style={input} placeholder="Denied role IDs (csv)" value={toCsv(cfg.commandPolicy.deniedRoleIds)} onChange={(e) => setCfg({ ...cfg, commandPolicy: { ...cfg.commandPolicy, deniedRoleIds: fromCsv(e.target.value) } })} />
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Per-command Rules</h3>
            {cfg.commandPolicy.commandRules.map((r, i) => (
              <div key={i} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px auto", gap: 8, alignItems: "center" }}>
                  <input style={input} placeholder="Command (ex: tts)" value={r.command} onChange={(e) => updateRule(i, { command: e.target.value })} />
                  <input style={input} type="number" placeholder="Cooldown" value={r.cooldownSec} onChange={(e) => updateRule(i, { cooldownSec: Number(e.target.value || 0) })} />
                  <label><input type="checkbox" checked={r.enabled} onChange={(e) => updateRule(i, { enabled: e.target.checked })} /> enabled</label>
                  <button style={{ ...input, width: "auto", cursor: "pointer" }} onClick={() => removeRule(i)}>Remove</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <input style={input} placeholder="Allowed role IDs (csv)" value={toCsv(r.allowedRoleIds)} onChange={(e) => updateRule(i, { allowedRoleIds: fromCsv(e.target.value) })} />
                  <input style={input} placeholder="Denied role IDs (csv)" value={toCsv(r.deniedRoleIds)} onChange={(e) => updateRule(i, { deniedRoleIds: fromCsv(e.target.value) })} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <input style={input} placeholder="Allowed channel IDs (csv)" value={toCsv(r.allowedChannelIds)} onChange={(e) => updateRule(i, { allowedChannelIds: fromCsv(e.target.value) })} />
                  <input style={input} placeholder="Denied channel IDs (csv)" value={toCsv(r.deniedChannelIds)} onChange={(e) => updateRule(i, { deniedChannelIds: fromCsv(e.target.value) })} />
                </div>
              </div>
            ))}
            <button style={{ ...input, width: "auto", cursor: "pointer" }} onClick={addRule}>+ Add Command Rule</button>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Channel Restrictions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input style={input} placeholder="Restricted channels (csv IDs)" value={toCsv(cfg.channelRestrictions.restrictedChannelIds)} onChange={(e) => setCfg({ ...cfg, channelRestrictions: { ...cfg.channelRestrictions, restrictedChannelIds: fromCsv(e.target.value) } })} />
              <input style={input} placeholder="Read-only channels (csv IDs)" value={toCsv(cfg.channelRestrictions.readOnlyChannelIds)} onChange={(e) => setCfg({ ...cfg, channelRestrictions: { ...cfg.channelRestrictions, readOnlyChannelIds: fromCsv(e.target.value) } })} />
              <input style={input} placeholder="Media-only channels (csv IDs)" value={toCsv(cfg.channelRestrictions.mediaOnlyChannelIds)} onChange={(e) => setCfg({ ...cfg, channelRestrictions: { ...cfg.channelRestrictions, mediaOnlyChannelIds: fromCsv(e.target.value) } })} />
              <input style={input} placeholder="Blocked command channels (csv IDs)" value={toCsv(cfg.channelRestrictions.blockedCommandChannelIds)} onChange={(e) => setCfg({ ...cfg, channelRestrictions: { ...cfg.channelRestrictions, blockedCommandChannelIds: fromCsv(e.target.value) } })} />
            </div>
            <div style={{ marginTop: 8 }}>
              <input style={input} placeholder="Ignored channels (csv IDs)" value={toCsv(cfg.channelRestrictions.ignoredChannelIds)} onChange={(e) => setCfg({ ...cfg, channelRestrictions: { ...cfg.channelRestrictions, ignoredChannelIds: fromCsv(e.target.value) } })} />
            </div>
            <div style={{ marginTop: 8 }}>
              <label><input type="checkbox" checked={cfg.channelRestrictions.allowBotsInRestricted} onChange={(e) => setCfg({ ...cfg, channelRestrictions: { ...cfg.channelRestrictions, allowBotsInRestricted: e.target.checked } })} /> Allow bots in restricted channels</label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Escalation + Lockdown</h3>
            <div style={{ marginBottom: 8 }}>
              <label><input type="checkbox" checked={cfg.escalation.enabled} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, enabled: e.target.checked } })} /> Escalation enabled</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              <input style={input} type="number" value={cfg.escalation.warnThreshold} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, warnThreshold: Number(e.target.value || 0) } })} />
              <input style={input} type="number" value={cfg.escalation.muteThreshold} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, muteThreshold: Number(e.target.value || 0) } })} />
              <input style={input} type="number" value={cfg.escalation.timeoutThreshold} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, timeoutThreshold: Number(e.target.value || 0) } })} />
              <input style={input} type="number" value={cfg.escalation.timeoutMinutes} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, timeoutMinutes: Number(e.target.value || 0) } })} />
              <input style={input} type="number" value={cfg.escalation.kickThreshold} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, kickThreshold: Number(e.target.value || 0) } })} />
              <input style={input} type="number" value={cfg.escalation.banThreshold} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, banThreshold: Number(e.target.value || 0) } })} />
              <input style={input} type="number" value={cfg.escalation.resetWindowMinutes} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, resetWindowMinutes: Number(e.target.value || 0) } })} />
              <select style={input} value={cfg.escalation.notifyChannelId} onChange={(e) => setCfg({ ...cfg, escalation: { ...cfg.escalation, notifyChannelId: e.target.value } })}>
                <option value="">Notify channel</option>
                {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <hr style={{ borderColor: "#440000", margin: "12px 0" }} />

            <label><input type="checkbox" checked={cfg.lockdownPolicy.autoLockdownEnabled} onChange={(e) => setCfg({ ...cfg, lockdownPolicy: { ...cfg.lockdownPolicy, autoLockdownEnabled: e.target.checked } })} /> Auto lockdown</label>
            <label style={{ marginLeft: 12 }}><input type="checkbox" checked={cfg.lockdownPolicy.raidModeEnabled} onChange={(e) => setCfg({ ...cfg, lockdownPolicy: { ...cfg.lockdownPolicy, raidModeEnabled: e.target.checked } })} /> Raid mode</label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 180px", gap: 8, marginTop: 8 }}>
              <input style={input} placeholder="Exempt role IDs (csv)" value={toCsv(cfg.lockdownPolicy.exemptRoleIds)} onChange={(e) => setCfg({ ...cfg, lockdownPolicy: { ...cfg.lockdownPolicy, exemptRoleIds: fromCsv(e.target.value) } })} />
              <input style={input} placeholder="Exempt channel IDs (csv)" value={toCsv(cfg.lockdownPolicy.exemptChannelIds)} onChange={(e) => setCfg({ ...cfg, lockdownPolicy: { ...cfg.lockdownPolicy, exemptChannelIds: fromCsv(e.target.value) } })} />
              <input style={input} type="number" value={cfg.lockdownPolicy.lockDurationMinutes} onChange={(e) => setCfg({ ...cfg, lockdownPolicy: { ...cfg.lockdownPolicy, lockDurationMinutes: Number(e.target.value || 0) } })} />
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Logging</h3>
            <div style={{ marginBottom: 8 }}>
              <label><input type="checkbox" checked={cfg.logging.enabled} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, enabled: e.target.checked } })} /> Logging enabled</label>
            </div>
            <select style={input} value={cfg.logging.logChannelId} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, logChannelId: e.target.value } })}>
              <option value="">Select log channel</option>
              {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
            <div style={{ marginTop: 8 }}>
              <label><input type="checkbox" checked={cfg.logging.includeCommandDenials} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, includeCommandDenials: e.target.checked } })} /> Command denials</label>
              <label style={{ marginLeft: 12 }}><input type="checkbox" checked={cfg.logging.includeChannelViolations} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, includeChannelViolations: e.target.checked } })} /> Channel violations</label>
              <label style={{ marginLeft: 12 }}><input type="checkbox" checked={cfg.logging.includeEscalationActions} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, includeEscalationActions: e.target.checked } })} /> Escalation actions</label>
              <label style={{ marginLeft: 12 }}><input type="checkbox" checked={cfg.logging.includeLockdownEvents} onChange={(e) => setCfg({ ...cfg, logging: { ...cfg.logging, includeLockdownEvents: e.target.checked } })} /> Lockdown events</label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Notes</h3>
            <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
          </div>

          <button style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 700 }} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Policy"}
          </button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
