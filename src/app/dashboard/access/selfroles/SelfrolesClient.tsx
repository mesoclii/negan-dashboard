"use client";



import { useEffect, useMemo, useState } from "react";

type RoleOption = {
  roleId: string;
  label: string;
  emoji: string;
  description: string;
  style: "primary" | "secondary" | "success" | "danger";
};

type Panel = {
  id: string;
  enabled: boolean;
  channelId: string;
  messageTitle: string;
  messageBody: string;
  mode: "buttons" | "select";
  maxSelectable: number;
  allowRemove: boolean;
  options: RoleOption[];
};

type Config = {
  active: boolean;
  requireVerification: boolean;
  verificationRoleId: string;
  maxRolesPerUser: number;
  antiAbuseCooldownSec: number;
  logChannelId: string;
  panels: Panel[];
  notes: string;
  updatedAt: string;
};

const DEFAULTS: Config = {
  active: true,
  requireVerification: false,
  verificationRoleId: "",
  maxRolesPerUser: 10,
  antiAbuseCooldownSec: 3,
  logChannelId: "",
  panels: [],
  notes: "",
  updatedAt: "",
};

const box: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.10)",
  marginBottom: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #6f0000",
  background: "#0a0a0a",
  color: "#ffd7d7",
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const v = (q || s).trim();
  if (v) localStorage.setItem("activeGuildId", v);
  return v;
}

function newOption(): RoleOption {
  return { roleId: "", label: "New Role", emoji: "", description: "", style: "secondary" };
}

function newPanel(): Panel {
  return {
    id: `panel_${Date.now()}`,
    enabled: true,
    channelId: "",
    messageTitle: "Pick Your Roles",
    messageBody: "Choose roles below.",
    mode: "buttons",
    maxSelectable: 1,
    allowRemove: true,
    options: [newOption()],
  };
}

export default function SelfrolesPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [orig, setOrig] = useState<Config>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const r = await fetch(`/api/setup/selfroles-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" });
        const j = await r.json();
        const next = { ...DEFAULTS, ...(j?.config || {}) };
        setCfg(next);
        setOrig(next);
      } catch {
        setMsg("Failed to load selfroles.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(orig), [cfg, orig]);

  function addPanel() {
    setCfg({ ...cfg, panels: [...(cfg.panels || []), newPanel()] });
  }

  function removePanel(i: number) {
    setCfg({ ...cfg, panels: (cfg.panels || []).filter((_, idx) => idx !== i) });
  }

  function updatePanel(i: number, patch: Partial<Panel>) {
    const next = [...(cfg.panels || [])];
    next[i] = { ...next[i], ...patch };
    setCfg({ ...cfg, panels: next });
  }

  function addOption(pi: number) {
    const next = [...(cfg.panels || [])];
    next[pi] = { ...next[pi], options: [...(next[pi].options || []), newOption()] };
    setCfg({ ...cfg, panels: next });
  }

  function updateOption(pi: number, oi: number, patch: Partial<RoleOption>) {
    const next = [...(cfg.panels || [])];
    const opts = [...(next[pi].options || [])];
    opts[oi] = { ...opts[oi], ...patch };
    next[pi] = { ...next[pi], options: opts };
    setCfg({ ...cfg, panels: next });
  }

  function removeOption(pi: number, oi: number) {
    const next = [...(cfg.panels || [])];
    next[pi] = { ...next[pi], options: (next[pi].options || []).filter((_, idx) => idx !== oi) };
    setCfg({ ...cfg, panels: next });
  }

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/selfroles-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, ...cfg }),
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      const next = { ...DEFAULTS, ...(j?.config || {}) };
      setCfg(next);
      setOrig(next);
      setMsg("Saved selfroles config.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading selfroles...</div>;

  return (
    <div style={{ color: "#ffb3b3", padding: 14, maxWidth: 1300 }}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Selfroles Studio</h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      <div style={box}>
        <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Selfroles active</label><br />
        <label><input type="checkbox" checked={cfg.requireVerification} onChange={(e) => setCfg({ ...cfg, requireVerification: e.target.checked })} /> Require verification role first</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(180px, 1fr))", gap: 10, marginTop: 10 }}>
          <div><label>Verification role ID</label><input style={input} value={cfg.verificationRoleId} onChange={(e) => setCfg({ ...cfg, verificationRoleId: e.target.value })} /></div>
          <div><label>Max roles/user</label><input style={input} type="number" value={cfg.maxRolesPerUser} onChange={(e) => setCfg({ ...cfg, maxRolesPerUser: Number(e.target.value || 0) })} /></div>
          <div><label>Cooldown sec</label><input style={input} type="number" value={cfg.antiAbuseCooldownSec} onChange={(e) => setCfg({ ...cfg, antiAbuseCooldownSec: Number(e.target.value || 0) })} /></div>
          <div><label>Log channel ID</label><input style={input} value={cfg.logChannelId} onChange={(e) => setCfg({ ...cfg, logChannelId: e.target.value })} /></div>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Panels</h3>
        <button onClick={addPanel} style={{ marginBottom: 10, padding: "8px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#1a0000", color: "#ffd7d7" }}>+ Add Panel</button>

        {(cfg.panels || []).map((p, pi) => (
          <div key={p.id + pi} style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8, alignItems: "center" }}>
              <input style={input} value={p.messageTitle} onChange={(e) => updatePanel(pi, { messageTitle: e.target.value })} />
              <input style={input} value={p.channelId} onChange={(e) => updatePanel(pi, { channelId: e.target.value })} placeholder="channelId" />
              <select style={input} value={p.mode} onChange={(e) => updatePanel(pi, { mode: e.target.value as Panel["mode"] })}>
                <option value="buttons">buttons</option>
                <option value="select">select</option>
              </select>
              <input style={input} type="number" value={p.maxSelectable} onChange={(e) => updatePanel(pi, { maxSelectable: Number(e.target.value || 1) })} />
              <button onClick={() => removePanel(pi)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>Remove</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 200px 180px", gap: 8, marginTop: 8 }}>
              <textarea style={{ ...input, minHeight: 58 }} value={p.messageBody} onChange={(e) => updatePanel(pi, { messageBody: e.target.value })} />
              <label><input type="checkbox" checked={p.enabled} onChange={(e) => updatePanel(pi, { enabled: e.target.checked })} /> panel enabled</label>
              <label><input type="checkbox" checked={p.allowRemove} onChange={(e) => updatePanel(pi, { allowRemove: e.target.checked })} /> allow remove role</label>
            </div>

            <div style={{ marginTop: 10 }}>
              <button onClick={() => addOption(pi)} style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#1a0000", color: "#ffd7d7" }}>
                + Add Role Option
              </button>
              {(p.options || []).map((o, oi) => (
                <div key={oi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 140px 1fr auto", gap: 8, marginBottom: 6, alignItems: "center" }}>
                  <input style={input} placeholder="roleId" value={o.roleId} onChange={(e) => updateOption(pi, oi, { roleId: e.target.value })} />
                  <input style={input} placeholder="label" value={o.label} onChange={(e) => updateOption(pi, oi, { label: e.target.value })} />
                  <input style={input} placeholder="emoji" value={o.emoji} onChange={(e) => updateOption(pi, oi, { emoji: e.target.value })} />
                  <select style={input} value={o.style} onChange={(e) => updateOption(pi, oi, { style: e.target.value as RoleOption["style"] })}>
                    <option value="primary">primary</option>
                    <option value="secondary">secondary</option>
                    <option value="success">success</option>
                    <option value="danger">danger</option>
                  </select>
                  <input style={input} placeholder="description" value={o.description} onChange={(e) => updateOption(pi, oi, { description: e.target.value })} />
                  <button onClick={() => removeOption(pi, oi)} style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>X</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={box}>
        <label>Notes</label>
        <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
      </div>

      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div style={{
        position: "fixed", right: 18, bottom: 18, zIndex: 40, border: "1px solid #7a0000",
        borderRadius: 12, padding: 10, background: "rgba(20,0,0,0.95)", display: "flex", alignItems: "center", gap: 8
      }}>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{dirty ? "DIRTY" : "READY"}</span>
        <button onClick={save} disabled={saving || !dirty} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>
          {saving ? "Saving..." : "Save Selfroles"}
        </button>
      </div>
    </div>
  );
}
