"use client";



import { useEffect, useMemo, useState } from "react";
import { getGuildId, loadDashboardConfig, saveDashboardPatch, styles, StatusPill } from "../_engineClient";

const DEFAULTS: any = {
  enabled: true,
  autoBanOnBlacklistRejoin: true,
  autoBanOnRefusalRole: true,
  refusalRoleId: "",
  enforcementChannelId: "",
  contactUser: "Support Team",
  banDmTemplate: "You were removed from the server.\n\nReason: **{{reason}}**\nTrigger: **{{type}}**\n\nContact: **{{contactUser}}**",
};

export default function PreOnboardingPage() {
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
        const next = { ...DEFAULTS, ...(all?.security?.preOnboarding || {}) };
        setCfg(next);
        setOrig(next);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load pre-onboarding settings.");
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
      await saveDashboardPatch(guildId, { security: { preOnboarding: cfg } });
      setOrig(cfg);
      setMsg("Saved pre-onboarding.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading pre-onboarding...</div>;

  return (
    <div style={styles.page}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Pre-Onboarding
        <StatusPill on={!!cfg.enabled} />
      </h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      <div style={styles.card}>
        <label><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine enabled</label><br />
        <label><input type="checkbox" checked={!!cfg.autoBanOnBlacklistRejoin} onChange={(e) => setCfg({ ...cfg, autoBanOnBlacklistRejoin: e.target.checked })} /> Auto-ban blacklist rejoin</label><br />
        <label><input type="checkbox" checked={!!cfg.autoBanOnRefusalRole} onChange={(e) => setCfg({ ...cfg, autoBanOnRefusalRole: e.target.checked })} /> Auto-ban refusal role</label>
      </div>

      <div style={styles.card}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label>Refusal role ID</label><input style={styles.input} value={cfg.refusalRoleId || ""} onChange={(e) => setCfg({ ...cfg, refusalRoleId: e.target.value })} /></div>
          <div><label>Enforcement channel ID</label><input style={styles.input} value={cfg.enforcementChannelId || ""} onChange={(e) => setCfg({ ...cfg, enforcementChannelId: e.target.value })} /></div>
          <div style={{ gridColumn: "1 / span 2" }}><label>Contact user</label><input style={styles.input} value={cfg.contactUser || ""} onChange={(e) => setCfg({ ...cfg, contactUser: e.target.value })} /></div>
        </div>
      </div>

      <div style={styles.card}>
        <label>Ban DM template</label>
        <textarea style={styles.area} value={cfg.banDmTemplate || ""} onChange={(e) => setCfg({ ...cfg, banDmTemplate: e.target.value })} />
      </div>

      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div style={styles.saveDock}>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{dirty ? "DIRTY" : "READY"}</span>
        <button onClick={save} disabled={saving || !dirty} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>
          {saving ? "Saving..." : "Save Pre-Onboarding"}
        </button>
      </div>
    </div>
  );
}
