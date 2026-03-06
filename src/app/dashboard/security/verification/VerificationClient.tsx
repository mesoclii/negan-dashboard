"use client";



import { useEffect, useMemo, useState } from "react";
import { getGuildId, loadDashboardConfig, saveDashboardPatch, styles, StatusPill } from "../_engineClient";

const DEFAULTS: any = {
  enabled: true,
  autoKickOnDecline: true,
  autoKickOnTimeout: true,
  declineKickReason: "Declined ID verification",
  timeoutKickReason: "ID submission timeout",
  declineReplyTemplate: "You declined ID verification.",
};

export default function VerificationPage() {
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
        const next = { ...DEFAULTS, ...(all?.security?.verification || {}) };
        setCfg(next);
        setOrig(next);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load verification settings.");
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
      await saveDashboardPatch(guildId, { security: { verification: cfg } });
      setOrig(cfg);
      setMsg("Saved verification.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading verification...</div>;

  return (
    <div style={styles.page}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Verification
        <StatusPill on={!!cfg.enabled} />
      </h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      <div style={styles.card}>
        <label><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine enabled</label><br />
        <label><input type="checkbox" checked={!!cfg.autoKickOnDecline} onChange={(e) => setCfg({ ...cfg, autoKickOnDecline: e.target.checked })} /> Auto-kick on decline</label><br />
        <label><input type="checkbox" checked={!!cfg.autoKickOnTimeout} onChange={(e) => setCfg({ ...cfg, autoKickOnTimeout: e.target.checked })} /> Auto-kick on timeout</label>
      </div>

      <div style={styles.card}>
        <div style={{ marginBottom: 10 }}>
          <label>Decline kick reason</label>
          <input style={styles.input} value={cfg.declineKickReason || ""} onChange={(e) => setCfg({ ...cfg, declineKickReason: e.target.value })} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Timeout kick reason</label>
          <input style={styles.input} value={cfg.timeoutKickReason || ""} onChange={(e) => setCfg({ ...cfg, timeoutKickReason: e.target.value })} />
        </div>
        <div>
          <label>Decline reply template</label>
          <textarea style={styles.area} value={cfg.declineReplyTemplate || ""} onChange={(e) => setCfg({ ...cfg, declineReplyTemplate: e.target.value })} />
        </div>
      </div>

      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div style={styles.saveDock}>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{dirty ? "DIRTY" : "READY"}</span>
        <button onClick={save} disabled={saving || !dirty} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>
          {saving ? "Saving..." : "Save Verification"}
        </button>
      </div>
    </div>
  );
}
