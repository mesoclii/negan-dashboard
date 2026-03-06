"use client";

import { useEffect, useState } from "react";

type EnforcerCfg = {
  active: boolean;
  commandPolicy: { defaultAccess: string; staffBypass: boolean };
  escalation: { enabled: boolean; warnThreshold: number; timeoutThreshold: number; banThreshold: number; notifyChannelId: string };
  lockdownPolicy: { autoLockdownEnabled: boolean; raidModeEnabled: boolean; lockDurationMinutes: number };
  logging: { enabled: boolean; logChannelId: string };
};

type Channel = { id: string; name: string; type?: number | string };

const EMPTY: EnforcerCfg = {
  active: true,
  commandPolicy: { defaultAccess: "allow", staffBypass: true },
  escalation: { enabled: true, warnThreshold: 3, timeoutThreshold: 7, banThreshold: 14, notifyChannelId: "" },
  lockdownPolicy: { autoLockdownEnabled: false, raidModeEnabled: false, lockDurationMinutes: 15 },
  logging: { enabled: true, logChannelId: "" },
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

const box: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)" };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

export default function SecurityEnforcerPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<EnforcerCfg>(EMPTY);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/security-policy-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const c = await cfgRes.json().catch(() => ({}));
        const g = await gdRes.json().catch(() => ({}));
        setCfg({ ...EMPTY, ...(c?.config || {}) });
        setChannels((Array.isArray(g?.channels) ? g.channels : []).filter((x: any) => Number(x?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load Security Enforcer config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/security-policy-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config || cfg) });
      setMsg("Security Enforcer config saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Security Enforcer Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={box}>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Active</label>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><div>Default Access</div><select style={input} value={cfg.commandPolicy.defaultAccess} onChange={(e) => setCfg((p) => ({ ...p, commandPolicy: { ...p.commandPolicy, defaultAccess: e.target.value } }))}><option value="allow">allow</option><option value="deny">deny</option></select></div>
              <div><label><input type="checkbox" checked={cfg.commandPolicy.staffBypass} onChange={(e) => setCfg((p) => ({ ...p, commandPolicy: { ...p.commandPolicy, staffBypass: e.target.checked } }))} /> Staff Bypass</label></div>
              <div><div>Warn Threshold</div><input style={input} type="number" value={cfg.escalation.warnThreshold} onChange={(e) => setCfg((p) => ({ ...p, escalation: { ...p.escalation, warnThreshold: Number(e.target.value || 0) } }))} /></div>
              <div><div>Timeout Threshold</div><input style={input} type="number" value={cfg.escalation.timeoutThreshold} onChange={(e) => setCfg((p) => ({ ...p, escalation: { ...p.escalation, timeoutThreshold: Number(e.target.value || 0) } }))} /></div>
              <div><div>Ban Threshold</div><input style={input} type="number" value={cfg.escalation.banThreshold} onChange={(e) => setCfg((p) => ({ ...p, escalation: { ...p.escalation, banThreshold: Number(e.target.value || 0) } }))} /></div>
              <div><div>Escalation Notify Channel</div><select style={input} value={cfg.escalation.notifyChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, escalation: { ...p.escalation, notifyChannelId: e.target.value } }))}><option value="">Select channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
              <div><label><input type="checkbox" checked={cfg.lockdownPolicy.autoLockdownEnabled} onChange={(e) => setCfg((p) => ({ ...p, lockdownPolicy: { ...p.lockdownPolicy, autoLockdownEnabled: e.target.checked } }))} /> Auto Lockdown</label></div>
              <div><label><input type="checkbox" checked={cfg.lockdownPolicy.raidModeEnabled} onChange={(e) => setCfg((p) => ({ ...p, lockdownPolicy: { ...p.lockdownPolicy, raidModeEnabled: e.target.checked } }))} /> Raid Mode</label></div>
              <div><div>Lock Duration (minutes)</div><input style={input} type="number" value={cfg.lockdownPolicy.lockDurationMinutes} onChange={(e) => setCfg((p) => ({ ...p, lockdownPolicy: { ...p.lockdownPolicy, lockDurationMinutes: Number(e.target.value || 0) } }))} /></div>
              <div><div>Log Channel</div><select style={input} value={cfg.logging.logChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, logging: { ...p.logging, logChannelId: e.target.value } }))}><option value="">Select channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
            </div>
          </section>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Security Enforcer"}
          </button>
        </div>
      )}
    </div>
  );
}
