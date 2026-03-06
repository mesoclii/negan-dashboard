"use client";



import { useEffect, useMemo, useState } from "react";
import { fromCsv, getGuildId, loadDashboardConfig, saveDashboardPatch, styles, toCsv, StatusPill } from "../_engineClient";

const DEFAULTS: any = {
  enabled: false,
  joinThresholdPerMinute: 10,
  mentionThresholdPerMinute: 20,
  autoEscalation: false,
  exemptRoleIds: [],
  exemptChannelIds: [],
};

export default function LockdownPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<any>(DEFAULTS);
  const [orig, setOrig] = useState<any>(DEFAULTS);
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
        const all = await loadDashboardConfig(guildId);
        const next = { ...DEFAULTS, ...(all?.security?.lockdown || {}) };
        setCfg(next);
        setOrig(next);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load lockdown settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(orig), [cfg, orig]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      await saveDashboardPatch(guildId, { security: { lockdown: cfg } });
      setOrig(cfg);
      setMsg("Saved lockdown.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading lockdown...</div>;

  return (
    <div style={styles.page}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Lockdown
        <StatusPill on={!!cfg.enabled} />
      </h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      <div style={styles.card}>
        <label><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine enabled</label><br />
        <label><input type="checkbox" checked={!!cfg.autoEscalation} onChange={(e) => setCfg({ ...cfg, autoEscalation: e.target.checked })} /> Auto escalation</label>
      </div>

      <div style={styles.card}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label>Join threshold / minute</label><input style={styles.input} type="number" value={cfg.joinThresholdPerMinute || 0} onChange={(e) => setCfg({ ...cfg, joinThresholdPerMinute: Number(e.target.value || 0) })} /></div>
          <div><label>Mention threshold / minute</label><input style={styles.input} type="number" value={cfg.mentionThresholdPerMinute || 0} onChange={(e) => setCfg({ ...cfg, mentionThresholdPerMinute: Number(e.target.value || 0) })} /></div>
          <div><label>Exempt role IDs (csv)</label><input style={styles.input} value={toCsv(cfg.exemptRoleIds)} onChange={(e) => setCfg({ ...cfg, exemptRoleIds: fromCsv(e.target.value) })} /></div>
          <div><label>Exempt channel IDs (csv)</label><input style={styles.input} value={toCsv(cfg.exemptChannelIds)} onChange={(e) => setCfg({ ...cfg, exemptChannelIds: fromCsv(e.target.value) })} /></div>
        </div>
      </div>

      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div style={styles.saveDock}>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{dirty ? "DIRTY" : "READY"}</span>
        <button onClick={save} disabled={saving || !dirty} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>
          {saving ? "Saving..." : "Save Lockdown"}
        </button>
      </div>
    </div>
  );
}
