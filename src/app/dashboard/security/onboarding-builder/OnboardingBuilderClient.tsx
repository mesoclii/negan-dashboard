"use client";



import { useEffect, useState } from "react";

type GuildRole = { id: string; name: string };
type GuildChannel = { id: string; name: string };

type OnboardingFlowConfig = {
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
  sendWelcomeDm: boolean;
  channels: {
    welcomeChannelId: string;
    mainChatChannelId: string;
    rulesChannelId: string;
    idChannelId: string;
    ticketCategoryId: string;
    transcriptChannelId: string;
    logChannelId: string;
    hostingLegacyChannelId: string;
    hostingEnhancedChannelId: string;
    staffIntroChannelId: string;
    selfRolesChannelId: string;
    botGuideChannelId: string;
    updatesChannelId: string;
    funChannelId: string;
    subscriptionChannelId: string;
  };
  roles: {
    verifiedRoleId: string;
    declineRoleId: string;
    staffRoleIds: string[];
    removeOnVerifyRoleIds: string[];
  };
  templates: {
    dmTemplate: string;
    panelTitle: string;
    panelDescription: string;
    panelFooter: string;
    gateAnnouncementTemplate: string;
    idPanelTitle: string;
    idPanelDescription: string;
    idPanelContent: string;
    postVerifyTemplate: string;
  };
  verification: {
    idTimeoutMinutes: number;
    autoKickOnDecline: boolean;
    autoKickOnTimeout: boolean;
    declineKickReason: string;
    timeoutKickReason: string;
    declineReplyTemplate: string;
  };
};

const DEFAULT_CFG: OnboardingFlowConfig = {
  onboardingEnabled: true,
  verificationEnabled: true,
  sendWelcomeDm: true,
  channels: {
    welcomeChannelId: "",
    mainChatChannelId: "",
    rulesChannelId: "",
    idChannelId: "",
    ticketCategoryId: "",
    transcriptChannelId: "",
    logChannelId: "",
    hostingLegacyChannelId: "",
    hostingEnhancedChannelId: "",
    staffIntroChannelId: "",
    selfRolesChannelId: "",
    botGuideChannelId: "",
    updatesChannelId: "",
    funChannelId: "",
    subscriptionChannelId: "",
  },
  roles: {
    verifiedRoleId: "",
    declineRoleId: "",
    staffRoleIds: [],
    removeOnVerifyRoleIds: [],
  },
  templates: {
    dmTemplate: "",
    panelTitle: "",
    panelDescription: "",
    panelFooter: "",
    gateAnnouncementTemplate: "",
    idPanelTitle: "",
    idPanelDescription: "",
    idPanelContent: "",
    postVerifyTemplate: "",
  },
  verification: {
    idTimeoutMinutes: 30,
    autoKickOnDecline: true,
    autoKickOnTimeout: true,
    declineKickReason: "",
    timeoutKickReason: "",
    declineReplyTemplate: "",
  },
};

const CHANNEL_FIELDS: Array<{ key: keyof OnboardingFlowConfig["channels"]; label: string }> = [
  { key: "welcomeChannelId", label: "Welcome Channel" },
  { key: "mainChatChannelId", label: "Main Chat Channel" },
  { key: "rulesChannelId", label: "Rules Channel" },
  { key: "idChannelId", label: "ID Channel" },
  { key: "ticketCategoryId", label: "Ticket Category ID" },
  { key: "transcriptChannelId", label: "Transcript Channel" },
  { key: "logChannelId", label: "Log Channel" },
  { key: "hostingLegacyChannelId", label: "Hosting Legacy Channel" },
  { key: "hostingEnhancedChannelId", label: "Hosting Enhanced Channel" },
  { key: "staffIntroChannelId", label: "Staff Intro Channel" },
  { key: "selfRolesChannelId", label: "Self Roles Channel" },
  { key: "botGuideChannelId", label: "Bot Guide Channel" },
  { key: "updatesChannelId", label: "Updates Channel" },
  { key: "funChannelId", label: "Fun Channel" },
  { key: "subscriptionChannelId", label: "Subscription Channel" },
];

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}
function toCsv(v: string[]) {
  return (v || []).join(", ");
}
function fromCsv(v: string) {
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

const shell: React.CSSProperties = { color: "#ff5a5a", maxWidth: 1300 };
const box: React.CSSProperties = { border: "1px solid #650000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(100,0,0,0.10)" };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", border: "1px solid #700000", color: "#ffd7d7", borderRadius: 8 };
const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

export default function OnboardingBuilderPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<OnboardingFlowConfig>(DEFAULT_CFG);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
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
        setMsg("");
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/onboarding-flow-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
        ]);
        const cfgJson = await cfgRes.json();
        const gdJson = await gdRes.json();

        if (!cfgRes.ok || cfgJson?.success === false) throw new Error(cfgJson?.error || "Failed to load onboarding flow.");
        setCfg({ ...DEFAULT_CFG, ...(cfgJson?.config || {}) });
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
        setRoles(Array.isArray(gdJson?.roles) ? gdJson.roles : []);
      } catch (e: any) {
        setMsg(e?.message || "Load failed.");
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
      const res = await fetch("/api/setup/onboarding-flow-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg }),
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setCfg({ ...DEFAULT_CFG, ...(json?.config || {}) });
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
      <h1 style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}>Onboarding Builder</h1>
      <p>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={box}>
            <h3 style={{ marginTop: 0 }}>Engine Toggles</h3>
            <div style={row2}>
              <label><input type="checkbox" checked={cfg.onboardingEnabled} onChange={(e) => setCfg({ ...cfg, onboardingEnabled: e.target.checked })} /> Onboarding Enabled</label>
              <label><input type="checkbox" checked={cfg.verificationEnabled} onChange={(e) => setCfg({ ...cfg, verificationEnabled: e.target.checked })} /> Verification Enabled</label>
              <label><input type="checkbox" checked={cfg.sendWelcomeDm} onChange={(e) => setCfg({ ...cfg, sendWelcomeDm: e.target.checked })} /> Send Welcome DM</label>
              <label><input type="checkbox" checked={cfg.verification.autoKickOnDecline} onChange={(e) => setCfg({ ...cfg, verification: { ...cfg.verification, autoKickOnDecline: e.target.checked } })} /> Auto Kick on Decline</label>
              <label><input type="checkbox" checked={cfg.verification.autoKickOnTimeout} onChange={(e) => setCfg({ ...cfg, verification: { ...cfg.verification, autoKickOnTimeout: e.target.checked } })} /> Auto Kick on Timeout</label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0 }}>Channel Mapping</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {CHANNEL_FIELDS.map((f) => (
                <div key={f.key}>
                  <label>{f.label}</label>
                  <select
                    style={input}
                    value={cfg.channels[f.key] || ""}
                    onChange={(e) => setCfg({ ...cfg, channels: { ...cfg.channels, [f.key]: e.target.value } })}
                  >
                    <option value="">(none)</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0 }}>Role Mapping</h3>
            <div style={row2}>
              <div>
                <label>Verified Role</label>
                <select style={input} value={cfg.roles.verifiedRoleId} onChange={(e) => setCfg({ ...cfg, roles: { ...cfg.roles, verifiedRoleId: e.target.value } })}>
                  <option value="">(none)</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
                </select>
              </div>
              <div>
                <label>Decline Role</label>
                <select style={input} value={cfg.roles.declineRoleId} onChange={(e) => setCfg({ ...cfg, roles: { ...cfg.roles, declineRoleId: e.target.value } })}>
                  <option value="">(none)</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={input} value={toCsv(cfg.roles.staffRoleIds)} onChange={(e) => setCfg({ ...cfg, roles: { ...cfg.roles, staffRoleIds: fromCsv(e.target.value) } })} placeholder="Staff role IDs (csv)" />
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={input} value={toCsv(cfg.roles.removeOnVerifyRoleIds)} onChange={(e) => setCfg({ ...cfg, roles: { ...cfg.roles, removeOnVerifyRoleIds: fromCsv(e.target.value) } })} placeholder="Remove-on-verify role IDs (csv)" />
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0 }}>Templates</h3>
            <div style={row2}>
              <input style={input} value={cfg.templates.panelTitle} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, panelTitle: e.target.value } })} placeholder="Panel title" />
              <input style={input} value={cfg.templates.panelFooter} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, panelFooter: e.target.value } })} placeholder="Panel footer" />
            </div>
            <div style={{ marginTop: 10 }}>
              <textarea style={{ ...input, minHeight: 90 }} value={cfg.templates.panelDescription} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, panelDescription: e.target.value } })} placeholder="Panel description" />
            </div>
            <div style={{ marginTop: 10 }}>
              <textarea style={{ ...input, minHeight: 90 }} value={cfg.templates.dmTemplate} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, dmTemplate: e.target.value } })} placeholder="Welcome DM template" />
            </div>
            <div style={{ marginTop: 10 }}>
              <textarea style={{ ...input, minHeight: 70 }} value={cfg.templates.gateAnnouncementTemplate} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, gateAnnouncementTemplate: e.target.value } })} placeholder="Gate announcement template" />
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={input} value={cfg.templates.idPanelTitle} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, idPanelTitle: e.target.value } })} placeholder="ID panel title" />
            </div>
            <div style={{ marginTop: 10 }}>
              <textarea style={{ ...input, minHeight: 70 }} value={cfg.templates.idPanelDescription} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, idPanelDescription: e.target.value } })} placeholder="ID panel description" />
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={input} value={cfg.templates.idPanelContent} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, idPanelContent: e.target.value } })} placeholder="ID panel content" />
            </div>
            <div style={{ marginTop: 10 }}>
              <textarea style={{ ...input, minHeight: 70 }} value={cfg.templates.postVerifyTemplate} onChange={(e) => setCfg({ ...cfg, templates: { ...cfg.templates, postVerifyTemplate: e.target.value } })} placeholder="Post verify template" />
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0 }}>Verification Rules</h3>
            <div style={row2}>
              <input style={input} type="number" value={cfg.verification.idTimeoutMinutes} onChange={(e) => setCfg({ ...cfg, verification: { ...cfg.verification, idTimeoutMinutes: Number(e.target.value || 0) } })} placeholder="ID timeout minutes" />
              <input style={input} value={cfg.verification.declineKickReason} onChange={(e) => setCfg({ ...cfg, verification: { ...cfg.verification, declineKickReason: e.target.value } })} placeholder="Decline kick reason" />
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={input} value={cfg.verification.timeoutKickReason} onChange={(e) => setCfg({ ...cfg, verification: { ...cfg.verification, timeoutKickReason: e.target.value } })} placeholder="Timeout kick reason" />
            </div>
            <div style={{ marginTop: 10 }}>
              <textarea style={{ ...input, minHeight: 70 }} value={cfg.verification.declineReplyTemplate} onChange={(e) => setCfg({ ...cfg, verification: { ...cfg.verification, declineReplyTemplate: e.target.value } })} placeholder="Decline reply template" />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={save} disabled={saving} style={{ ...input, width: 180, cursor: "pointer" }}>{saving ? "Saving..." : "Save Onboarding Flow"}</button>
            <button onClick={() => setCfg(DEFAULT_CFG)} disabled={saving} style={{ ...input, width: 140, cursor: "pointer" }}>Reset Form</button>
          </div>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
