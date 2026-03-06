"use client";



import { useEffect, useMemo, useState } from "react";
import { fromCsv, getGuildId, loadDashboardConfig, saveDashboardPatch, styles, toCsv, StatusPill } from "../_engineClient";

const DEFAULTS: any = {
  enabled: true,
  welcomeChannelId: "",
  mainChatChannelId: "",
  rulesChannelId: "",
  idChannelId: "",
  ticketCategoryId: "",
  transcriptChannelId: "",
  logChannelId: "",
  verifiedRoleId: "",
  declineRoleId: "",
  staffRoleIds: [],
  removeOnVerifyRoleIds: [],
  idTimeoutMinutes: 30,
  hostingLegacyChannelId: "",
  hostingEnhancedChannelId: "",
  staffIntroChannelId: "",
  selfRolesChannelId: "",
  botGuideChannelId: "",
  updatesChannelId: "",
  funChannelId: "",
  subscriptionChannelId: "",
  dmTemplate: "Welcome to {{guildName}}.\n\nStart onboarding in <#{{welcomeChannelId}}>.",
  panelTitle: "Welcome to {{guildName}}",
  panelDescription: "Read the rules in <#{{rulesChannelId}}> and confirm below to continue.",
  panelFooter: "Complete onboarding to unlock the server.",
  gateAnnouncementTemplate: "Survivor <@{{userId}}> has reached the gates.",
  idPanelTitle: "ID Verification - Final Gate",
  idPanelDescription: "<@{{userId}}> choose how you proceed.\n\nThose who refuse will be removed.",
  idPanelContent: "Survivor <@{{userId}}>",
  postVerifyTemplate: "<@{{userId}}> is now verified. Welcome to {{guildName}}.",
};

export default function OnboardingPage() {
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
        const next = { ...DEFAULTS, ...(all?.security?.onboarding || {}) };
        setCfg(next);
        setOrig(next);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load onboarding settings.");
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
      await saveDashboardPatch(guildId, { security: { onboarding: cfg } });
      setOrig(cfg);
      setMsg("Saved onboarding.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading onboarding...</div>;

  const idFields = [
    "welcomeChannelId","mainChatChannelId","rulesChannelId","idChannelId","ticketCategoryId","transcriptChannelId",
    "logChannelId","verifiedRoleId","declineRoleId","hostingLegacyChannelId","hostingEnhancedChannelId","staffIntroChannelId",
    "selfRolesChannelId","botGuideChannelId","updatesChannelId","funChannelId","subscriptionChannelId"
  ];

  return (
    <div style={styles.page}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Onboarding
        <StatusPill on={!!cfg.enabled} />
      </h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      <div style={styles.card}>
        <label><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine enabled</label>
        <div style={{ marginTop: 10, maxWidth: 320 }}>
          <label>ID timeout minutes</label>
          <input style={styles.input} type="number" value={cfg.idTimeoutMinutes || 0} onChange={(e) => setCfg({ ...cfg, idTimeoutMinutes: Number(e.target.value || 0) })} />
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Channel and Role IDs</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {idFields.map((k) => (
            <div key={k}>
              <label>{k}</label>
              <input style={styles.input} value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
            </div>
          ))}
          <div>
            <label>staffRoleIds (csv)</label>
            <input style={styles.input} value={toCsv(cfg.staffRoleIds)} onChange={(e) => setCfg({ ...cfg, staffRoleIds: fromCsv(e.target.value) })} />
          </div>
          <div>
            <label>removeOnVerifyRoleIds (csv)</label>
            <input style={styles.input} value={toCsv(cfg.removeOnVerifyRoleIds)} onChange={(e) => setCfg({ ...cfg, removeOnVerifyRoleIds: fromCsv(e.target.value) })} />
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Templates</h3>
        {[
          "dmTemplate","panelTitle","panelDescription","panelFooter","gateAnnouncementTemplate",
          "idPanelTitle","idPanelDescription","idPanelContent","postVerifyTemplate"
        ].map((k) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label>{k}</label>
            {k.toLowerCase().includes("title") ? (
              <input style={styles.input} value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
            ) : (
              <textarea style={styles.area} value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div style={styles.saveDock}>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{dirty ? "DIRTY" : "READY"}</span>
        <button onClick={save} disabled={saving || !dirty} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>
          {saving ? "Saving..." : "Save Onboarding"}
        </button>
      </div>
    </div>
  );
}
