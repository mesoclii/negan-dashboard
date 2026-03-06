"use client";



import { useEffect, useMemo, useState } from "react";

type TriggerType = "member_join" | "message_create" | "reaction_add" | "voice_join" | "role_add";
type ConditionType = "has_role" | "lacks_role" | "channel_is" | "account_age_days" | "message_contains" | "invite_code";
type ActionType = "send_message" | "dm_user" | "give_role" | "remove_role" | "timeout" | "kick" | "ban" | "log";

type RuleCondition = { id: string; type: ConditionType; value: string; negate: boolean };
type RuleAction = { id: string; type: ActionType; targetId: string; message: string; delaySec: number };

type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  trigger: { type: TriggerType; channels: string[]; keywords: string[]; cooldownSec: number };
  conditions: RuleCondition[];
  actions: RuleAction[];
  retry: { enabled: boolean; maxAttempts: number; delaySec: number };
  stopOnFail: boolean;
};

type AutomationStudioConfig = {
  active: boolean;
  dryRun: boolean;
  maxRunsPerMinute: number;
  logChannelId: string;
  rules: AutomationRule[];
  notes: string;
  updatedAt: string;
};

type GuildChannel = { id: string; name: string };
type GuildRole = { id: string; name: string };

const TRIGGERS: TriggerType[] = ["member_join", "message_create", "reaction_add", "voice_join", "role_add"];
const CONDITIONS: ConditionType[] = ["has_role", "lacks_role", "channel_is", "account_age_days", "message_contains", "invite_code"];
const ACTIONS: ActionType[] = ["send_message", "dm_user", "give_role", "remove_role", "timeout", "kick", "ban", "log"];

const DEFAULT_CFG: AutomationStudioConfig = {
  active: true,
  dryRun: false,
  maxRunsPerMinute: 120,
  logChannelId: "",
  rules: [],
  notes: "",
  updatedAt: "",
};

function gid() {
  return `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
function newCondition(): RuleCondition {
  return { id: `cond_${gid()}`, type: "message_contains", value: "", negate: false };
}
function newAction(): RuleAction {
  return { id: `act_${gid()}`, type: "send_message", targetId: "", message: "", delaySec: 0 };
}
function newRule(name = "New Rule"): AutomationRule {
  return {
    id: `rule_${gid()}`,
    name,
    enabled: true,
    priority: 50,
    trigger: { type: "message_create", channels: [], keywords: [], cooldownSec: 0 },
    conditions: [],
    actions: [newAction()],
    retry: { enabled: false, maxAttempts: 1, delaySec: 1 },
    stopOnFail: true,
  };
}
function csv(v: string[]) { return (v || []).join(", "); }
function list(v: string) { return v.split(",").map((x) => x.trim()).filter(Boolean); }

function getGuildId() {
  if (typeof window === "undefined") return "";
  const u = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (u || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

const shell: React.CSSProperties = { color: "#ff5959", maxWidth: 1350 };
const card: React.CSSProperties = { border: "1px solid #680000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(100,0,0,0.10)" };
const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const row3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", border: "1px solid #700000", color: "#ffd6d6", borderRadius: 8 };

export default function AutomationStudioPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<AutomationStudioConfig>(DEFAULT_CFG);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/security-automation-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
        ]);
        const cfgJson = await cfgRes.json();
        const gdJson = await gdRes.json();
        if (!cfgRes.ok || cfgJson?.success === false) throw new Error(cfgJson?.error || "Load failed");
        setCfg({ ...DEFAULT_CFG, ...(cfgJson?.config || {}) });
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
        setRoles(Array.isArray(gdJson?.roles) ? gdJson.roles : []);
        setDirty(false);
      } catch (e: any) {
        setMsg(e?.message || "Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const status = useMemo(() => (saving ? "SAVING" : dirty ? "DIRTY" : "READY"), [saving, dirty]);

  function mutate(next: AutomationStudioConfig) {
    setCfg(next);
    setDirty(true);
  }

  function updateRule(ruleId: string, patch: Partial<AutomationRule>) {
    mutate({
      ...cfg,
      rules: cfg.rules.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)),
    });
  }

  function removeRule(ruleId: string) {
    mutate({ ...cfg, rules: cfg.rules.filter((r) => r.id !== ruleId) });
  }

  function cloneRule(ruleId: string) {
    const rule = cfg.rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const clone: AutomationRule = { ...rule, id: `rule_${gid()}`, name: `${rule.name} Copy` };
    mutate({ ...cfg, rules: [...cfg.rules, clone] });
  }

  function addCondition(ruleId: string) {
    mutate({
      ...cfg,
      rules: cfg.rules.map((r) => (r.id === ruleId ? { ...r, conditions: [...r.conditions, newCondition()] } : r)),
    });
  }

  function updateCondition(ruleId: string, condId: string, patch: Partial<RuleCondition>) {
    mutate({
      ...cfg,
      rules: cfg.rules.map((r) => {
        if (r.id !== ruleId) return r;
        return { ...r, conditions: r.conditions.map((c) => (c.id === condId ? { ...c, ...patch } : c)) };
      }),
    });
  }

  function removeCondition(ruleId: string, condId: string) {
    mutate({
      ...cfg,
      rules: cfg.rules.map((r) => (r.id === ruleId ? { ...r, conditions: r.conditions.filter((c) => c.id !== condId) } : r)),
    });
  }

  function addAction(ruleId: string) {
    mutate({
      ...cfg,
      rules: cfg.rules.map((r) => (r.id === ruleId ? { ...r, actions: [...r.actions, newAction()] } : r)),
    });
  }

  function updateAction(ruleId: string, actionId: string, patch: Partial<RuleAction>) {
    mutate({
      ...cfg,
      rules: cfg.rules.map((r) => {
        if (r.id !== ruleId) return r;
        return { ...r, actions: r.actions.map((a) => (a.id === actionId ? { ...a, ...patch } : a)) };
      }),
    });
  }

  function removeAction(ruleId: string, actionId: string) {
    mutate({
      ...cfg,
      rules: cfg.rules.map((r) => (r.id === ruleId ? { ...r, actions: r.actions.filter((a) => a.id !== actionId) } : r)),
    });
  }

  function addPresetJoinGate() {
    const preset: AutomationRule = {
      ...newRule("Join Gate Welcome"),
      trigger: { type: "member_join", channels: [], keywords: [], cooldownSec: 0 },
      conditions: [],
      actions: [
        { ...newAction(), type: "send_message", message: "Welcome <@{{userId}}> to {{guildName}}." },
        { ...newAction(), type: "log", message: "Join gate triggered for {{userId}}" },
      ],
    };
    mutate({ ...cfg, rules: [...cfg.rules, preset] });
  }

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/setup/security-automation-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setCfg({ ...DEFAULT_CFG, ...(json?.config || {}) });
      setDirty(false);
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={shell}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>Security Rule Studio</h1>
      <p>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={card}>
            <div style={row3}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => mutate({ ...cfg, active: e.target.checked })} /> Studio Active</label>
              <label><input type="checkbox" checked={cfg.dryRun} onChange={(e) => mutate({ ...cfg, dryRun: e.target.checked })} /> Dry Run Mode</label>
              <input style={input} type="number" value={cfg.maxRunsPerMinute} onChange={(e) => mutate({ ...cfg, maxRunsPerMinute: Number(e.target.value || 0) })} placeholder="Max runs per minute" />
            </div>
            <div style={{ ...row2, marginTop: 10 }}>
              <select style={input} value={cfg.logChannelId} onChange={(e) => mutate({ ...cfg, logChannelId: e.target.value })}>
                <option value="">Log channel (none)</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
              </select>
              <input style={input} value={status} readOnly />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button style={{ ...input, width: 160, cursor: "pointer" }} onClick={() => mutate({ ...cfg, rules: [...cfg.rules, newRule()] })}>Add Rule</button>
              <button style={{ ...input, width: 180, cursor: "pointer" }} onClick={addPresetJoinGate}>Add Join Preset</button>
              <button style={{ ...input, width: 140, cursor: "pointer" }} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Studio"}</button>
            </div>
          </div>

          {cfg.rules.map((rule, idx) => (
            <div key={rule.id} style={card}>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <input style={{ ...input, flex: 1 }} value={rule.name} onChange={(e) => updateRule(rule.id, { name: e.target.value })} placeholder={`Rule ${idx + 1} name`} />
                <input style={{ ...input, width: 120 }} type="number" value={rule.priority} onChange={(e) => updateRule(rule.id, { priority: Number(e.target.value || 0) })} placeholder="Priority" />
                <label style={{ alignSelf: "center" }}><input type="checkbox" checked={rule.enabled} onChange={(e) => updateRule(rule.id, { enabled: e.target.checked })} /> Enabled</label>
                <button style={{ ...input, width: 90, cursor: "pointer" }} onClick={() => cloneRule(rule.id)}>Clone</button>
                <button style={{ ...input, width: 90, cursor: "pointer" }} onClick={() => removeRule(rule.id)}>Remove</button>
              </div>

              <div style={row3}>
                <select style={input} value={rule.trigger.type} onChange={(e) => updateRule(rule.id, { trigger: { ...rule.trigger, type: e.target.value as TriggerType } })}>
                  {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input style={input} value={csv(rule.trigger.channels)} onChange={(e) => updateRule(rule.id, { trigger: { ...rule.trigger, channels: list(e.target.value) } })} placeholder="Trigger channels (csv IDs)" />
                <input style={input} value={csv(rule.trigger.keywords)} onChange={(e) => updateRule(rule.id, { trigger: { ...rule.trigger, keywords: list(e.target.value) } })} placeholder="Trigger keywords (csv)" />
                <input style={input} type="number" value={rule.trigger.cooldownSec} onChange={(e) => updateRule(rule.id, { trigger: { ...rule.trigger, cooldownSec: Number(e.target.value || 0) } })} placeholder="Trigger cooldown sec" />
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Conditions</strong>
                {rule.conditions.map((c) => (
                  <div key={c.id} style={{ ...row3, marginTop: 8 }}>
                    <select style={input} value={c.type} onChange={(e) => updateCondition(rule.id, c.id, { type: e.target.value as ConditionType })}>
                      {CONDITIONS.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                    <input style={input} value={c.value} onChange={(e) => updateCondition(rule.id, c.id, { value: e.target.value })} placeholder="Condition value (role/channel/text/etc.)" />
                    <label style={{ alignSelf: "center" }}><input type="checkbox" checked={c.negate} onChange={(e) => updateCondition(rule.id, c.id, { negate: e.target.checked })} /> Negate</label>
                    <button style={{ ...input, width: 100, cursor: "pointer" }} onClick={() => removeCondition(rule.id, c.id)}>Remove</button>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <button style={{ ...input, width: 150, cursor: "pointer" }} onClick={() => addCondition(rule.id)}>Add Condition</button>
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <strong>Actions</strong>
                {rule.actions.map((a) => (
                  <div key={a.id} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, marginTop: 8 }}>
                    <div style={row3}>
                      <select style={input} value={a.type} onChange={(e) => updateAction(rule.id, a.id, { type: e.target.value as ActionType })}>
                        {ACTIONS.map((x) => <option key={x} value={x}>{x}</option>)}
                      </select>
                      <input style={input} value={a.targetId} onChange={(e) => updateAction(rule.id, a.id, { targetId: e.target.value })} placeholder="Target ID (role/channel/user)" />
                      <input style={input} type="number" value={a.delaySec} onChange={(e) => updateAction(rule.id, a.id, { delaySec: Number(e.target.value || 0) })} placeholder="Delay sec" />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <textarea style={{ ...input, minHeight: 80 }} value={a.message} onChange={(e) => updateAction(rule.id, a.id, { message: e.target.value })} placeholder="Action message/template (optional)" />
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <button style={{ ...input, width: 110, cursor: "pointer" }} onClick={() => removeAction(rule.id, a.id)}>Remove Action</button>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  <button style={{ ...input, width: 130, cursor: "pointer" }} onClick={() => addAction(rule.id)}>Add Action</button>
                </div>
              </div>

              <div style={{ ...row3, marginTop: 12 }}>
                <label><input type="checkbox" checked={rule.retry.enabled} onChange={(e) => updateRule(rule.id, { retry: { ...rule.retry, enabled: e.target.checked } })} /> Retry on failure</label>
                <input style={input} type="number" value={rule.retry.maxAttempts} onChange={(e) => updateRule(rule.id, { retry: { ...rule.retry, maxAttempts: Number(e.target.value || 1) } })} placeholder="Max attempts" />
                <input style={input} type="number" value={rule.retry.delaySec} onChange={(e) => updateRule(rule.id, { retry: { ...rule.retry, delaySec: Number(e.target.value || 0) } })} placeholder="Retry delay sec" />
                <label><input type="checkbox" checked={rule.stopOnFail} onChange={(e) => updateRule(rule.id, { stopOnFail: e.target.checked })} /> Stop rule on first action failure</label>
              </div>
            </div>
          ))}

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Notes</h3>
            <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => mutate({ ...cfg, notes: e.target.value })} placeholder="Internal notes for staff" />
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
              <button style={{ ...input, width: 140, cursor: "pointer" }} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Studio"}</button>
              {cfg.updatedAt ? <span>Last saved: {cfg.updatedAt}</span> : null}
            </div>
            {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
          </div>

          <details>
            <summary>Guild helpers</summary>
            <p>Channels: {channels.slice(0, 40).map((c) => `${c.name}:${c.id}`).join(" | ")}</p>
            <p>Roles: {roles.slice(0, 40).map((r) => `${r.name}:${r.id}`).join(" | ")}</p>
          </details>
        </>
      )}
    </div>
  );
}
