"use client";



import Link from "next/link";
import { useEffect, useState } from "react";

function getGuildId() {
  if (typeof window === "undefined") return "";
  const url = new URLSearchParams(window.location.search).get("guildId") || "";
  const stored = localStorage.getItem("activeGuildId") || "";
  const gid = (url || stored).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

const box: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(130,0,0,0.10)",
  marginBottom: 12
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #7a0000",
  background: "#0c0c0c",
  color: "#ffd7d7"
};

export default function SystemHealthPage() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [msg, setMsg] = useState("");

  const [runtime, setRuntime] = useState<any>(null);
  const [auditCfg, setAuditCfg] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [logKind, setLogKind] = useState("dash-error");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);

  async function loadAll(gid: string) {
    if (!gid) return;
    const [r1, r2, r3, r4, r5, r6] = await Promise.all([
      fetch(`/api/setup/runtime-safety-config?guildId=${gid}`).then((r) => r.json()),
      fetch(`/api/setup/audit-trail-config?guildId=${gid}`).then((r) => r.json()),
      fetch(`/api/setup/audit-trail-events?guildId=${gid}&limit=200`).then((r) => r.json()),
      fetch(`/api/setup/audit-log-feed?kind=${encodeURIComponent(logKind)}&lines=200`).then((r) => r.json()),
      fetch(`/api/setup/snapshots`).then((r) => r.json()).catch(() => ({ snapshots: [] })),
      fetch(`/api/bot/guild-data?guildId=${gid}`).then((r) => r.json()).catch(() => ({}))
    ]);
    setRuntime(r1?.config || null);
    setAuditCfg(r2?.config || null);
    setAuditEvents(Array.isArray(r3?.events) ? r3.events : []);
    setLogLines(Array.isArray(r4?.lines) ? r4.lines : []);
    const snap = Array.isArray(r5?.snapshots) ? r5.snapshots : [];
    setSnapshots(snap);
    const nextGuildName = String(r6?.guild?.name || "").trim();
    setGuildName(nextGuildName);
    if (nextGuildName && typeof window !== "undefined") localStorage.setItem("activeGuildName", nextGuildName);
  }

  useEffect(() => {
    const gid = getGuildId();
    setGuildId(gid);
    loadAll(gid).catch(() => setMsg("Failed to load health data."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveRuntime() {
    if (!guildId || !runtime) return;
    const r = await fetch("/api/setup/runtime-safety-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch: runtime })
    });
    const j = await r.json();
    setMsg(j?.success ? "Runtime safety saved." : j?.error || "Save failed.");
  }

  async function saveAudit() {
    if (!guildId || !auditCfg) return;
    const r = await fetch("/api/setup/audit-trail-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch: auditCfg })
    });
    const j = await r.json();
    setMsg(j?.success ? "Audit config saved." : j?.error || "Save failed.");
  }

  async function refreshLogs() {
    const r = await fetch(`/api/setup/audit-log-feed?kind=${encodeURIComponent(logKind)}&lines=200`);
    const j = await r.json();
    setLogLines(Array.isArray(j?.lines) ? j.lines : []);
  }

  async function createSnapshot() {
    const r = await fetch("/api/setup/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, note: "manual-health-snapshot" })
    });
    const j = await r.json();
    setMsg(j?.success ? "Snapshot created." : j?.error || "Snapshot failed.");
    const r2 = await fetch(`/api/setup/snapshots`);
    const j2 = await r2.json();
    setSnapshots(Array.isArray(j2?.snapshots) ? j2.snapshots : []);
  }

  return (
    <div style={{ padding: 18, color: "#ffd7d7" }}>
      <h1 style={{ marginTop: 0, color: "#ff4d4d", letterSpacing: "0.06em" }}>System Health + Ops</h1>
      <p style={{ opacity: 0.9 }}>
        Guild: <b>{guildName || (typeof window !== "undefined" ? (localStorage.getItem("activeGuildName") || guildId) : guildId) || "(none)"}</b>
      </p>
      {msg && <div style={{ marginBottom: 10, color: "#ff8c8c" }}>{msg}</div>}

      <div style={box}>
        <b>Quick Links</b>
        <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={`/dashboard/ai/memory?guildId=${guildId}`}>AI Memory</Link>
          <Link href={`/dashboard/settings/event-routing?guildId=${guildId}`}>Event Routing</Link>
          <Link href={`/dashboard/economy/radio-birthday?guildId=${guildId}`}>Radio + Birthday</Link>
          <Link href={`/dashboard/achievements?guildId=${guildId}`}>Achievements + Prestige</Link>
        </div>
      </div>

      {runtime && (
        <div style={box}>
          <h3 style={{ marginTop: 0, color: "#ff4444" }}>Runtime Safety (Crash/Cooldown/Rate/Kill)</h3>
          <label><input type="checkbox" checked={!!runtime.active} onChange={(e) => setRuntime((p: any) => ({ ...p, active: e.target.checked }))} /> Active</label>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <input style={input} type="number" value={runtime.crashGuard.maxRestartsPerHour} onChange={(e) => setRuntime((p: any) => ({ ...p, crashGuard: { ...p.crashGuard, maxRestartsPerHour: Number(e.target.value || 0) } }))} placeholder="maxRestartsPerHour" />
            <input style={input} type="number" value={runtime.crashGuard.cooldownSeconds} onChange={(e) => setRuntime((p: any) => ({ ...p, crashGuard: { ...p.crashGuard, cooldownSeconds: Number(e.target.value || 0) } }))} placeholder="cooldownSeconds" />
            <input style={input} type="number" value={runtime.rateLimits.commandPerMinute} onChange={(e) => setRuntime((p: any) => ({ ...p, rateLimits: { ...p.rateLimits, commandPerMinute: Number(e.target.value || 0) } }))} placeholder="commandPerMinute" />
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <label><input type="checkbox" checked={!!runtime.emergency.globalReadOnly} onChange={(e) => setRuntime((p: any) => ({ ...p, emergency: { ...p.emergency, globalReadOnly: e.target.checked } }))} /> Global Read-Only</label>
            <label><input type="checkbox" checked={!!runtime.emergency.disableAi} onChange={(e) => setRuntime((p: any) => ({ ...p, emergency: { ...p.emergency, disableAi: e.target.checked } }))} /> Disable AI</label>
            <label><input type="checkbox" checked={!!runtime.emergency.disableTts} onChange={(e) => setRuntime((p: any) => ({ ...p, emergency: { ...p.emergency, disableTts: e.target.checked } }))} /> Disable TTS</label>
            <label><input type="checkbox" checked={!!runtime.emergency.disableGames} onChange={(e) => setRuntime((p: any) => ({ ...p, emergency: { ...p.emergency, disableGames: e.target.checked } }))} /> Disable Games</label>
            <label><input type="checkbox" checked={!!runtime.emergency.disableAutomation} onChange={(e) => setRuntime((p: any) => ({ ...p, emergency: { ...p.emergency, disableAutomation: e.target.checked } }))} /> Disable Automation</label>
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={saveRuntime}>Save Runtime Safety</button>
          </div>
        </div>
      )}

      {auditCfg && (
        <div style={box}>
          <h3 style={{ marginTop: 0, color: "#ff4444" }}>Audit Trail Config</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input style={input} type="number" value={auditCfg.retainDays} onChange={(e) => setAuditCfg((p: any) => ({ ...p, retainDays: Number(e.target.value || 0) }))} placeholder="retainDays" />
            <input style={input} value={auditCfg.exportChannelId || ""} onChange={(e) => setAuditCfg((p: any) => ({ ...p, exportChannelId: e.target.value }))} placeholder="exportChannelId" />
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <label><input type="checkbox" checked={!!auditCfg.include.featureToggles} onChange={(e) => setAuditCfg((p: any) => ({ ...p, include: { ...p.include, featureToggles: e.target.checked } }))} /> Feature Toggles</label>
            <label><input type="checkbox" checked={!!auditCfg.include.configSaves} onChange={(e) => setAuditCfg((p: any) => ({ ...p, include: { ...p.include, configSaves: e.target.checked } }))} /> Config Saves</label>
            <label><input type="checkbox" checked={!!auditCfg.include.moderation} onChange={(e) => setAuditCfg((p: any) => ({ ...p, include: { ...p.include, moderation: e.target.checked } }))} /> Moderation</label>
            <label><input type="checkbox" checked={!!auditCfg.include.economy} onChange={(e) => setAuditCfg((p: any) => ({ ...p, include: { ...p.include, economy: e.target.checked } }))} /> Economy</label>
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={saveAudit}>Save Audit Config</button>
          </div>
        </div>
      )}

      <div style={box}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Audit Trail (Config Change History)</h3>
        <button onClick={() => loadAll(guildId)}>Refresh</button>
        <div style={{ marginTop: 8, maxHeight: 240, overflow: "auto", fontSize: 12, background: "#111", padding: 8, borderRadius: 8 }}>
          {auditEvents.map((e: any, i: number) => (
            <div key={i} style={{ marginBottom: 6 }}>
              [{e.at}] {e.area} {e.action} {Array.isArray(e.keys) ? `(${e.keys.join(", ")})` : ""}
            </div>
          ))}
          {auditEvents.length === 0 && <div>No audit events yet.</div>}
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Live Logs Viewer</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select style={input} value={logKind} onChange={(e) => setLogKind(e.target.value)}>
            <option value="dash-error">dash-error</option>
            <option value="dash-out">dash-out</option>
            <option value="bot-error">bot-error</option>
            <option value="bot-out">bot-out</option>
          </select>
          <button onClick={refreshLogs}>Refresh Log</button>
        </div>
        <pre style={{ background: "#0b0b0b", color: "#ffc4c4", padding: 10, borderRadius: 8, maxHeight: 280, overflow: "auto", whiteSpace: "pre-wrap" }}>
{logLines.join("\n")}
        </pre>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Snapshots (Backup Surface)</h3>
        <button onClick={createSnapshot}>Create Snapshot</button>
        <div style={{ marginTop: 8, maxHeight: 220, overflow: "auto", background: "#111", padding: 8, borderRadius: 8 }}>
          {(snapshots || []).map((s: any, i: number) => (
            <div key={i} style={{ marginBottom: 6 }}>
              {typeof s === "string" ? s : JSON.stringify(s)}
            </div>
          ))}
          {(!snapshots || snapshots.length === 0) && <div>No snapshots returned.</div>}
        </div>
      </div>
    </div>
  );
}
