"use client";

import { useEffect, useState } from "react";

type Features = {
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
};

type PreOnboarding = {
  autoBanOnBlacklistRejoin: boolean;
  autoBanOnRefusalRole: boolean;
  refusalRoleId: string | null;
  enforcementChannelId: string | null;
  contactUser: string;
  banDmTemplate: string;
};

type Onboarding = {
  welcomeChannelId: string | null;
  mainChatChannelId: string | null;
  rulesChannelId: string | null;
  idChannelId: string | null;
  ticketCategoryId: string | null;
  transcriptChannelId: string | null;
  logChannelId: string | null;
  verifiedRoleId: string | null;
  declineRoleId: string | null;
  staffRoleIds: string[];
  removeOnVerifyRoleIds: string[];
  idTimeoutMinutes: number;
  hostingLegacyChannelId: string | null;
  hostingEnhancedChannelId: string | null;
  staffIntroChannelId: string | null;
  selfRolesChannelId: string | null;
  botGuideChannelId: string | null;
  updatesChannelId: string | null;
  funChannelId: string | null;
  subscriptionChannelId: string | null;
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

type Verification = {
  autoKickOnDecline: boolean;
  autoKickOnTimeout: boolean;
  declineKickReason: string;
  timeoutKickReason: string;
  declineReplyTemplate: string;
};

type Lockdown = {
  enabled: boolean;
  joinThresholdPerMinute: number;
  mentionThresholdPerMinute: number;
  autoEscalation: boolean;
  exemptRoleIds: string[];
  exemptChannelIds: string[];
};

type Raid = {
  enabled: boolean;
  joinBurstThreshold: number;
  windowSeconds: number;
  actionPreset: string;
  exemptRoleIds: string[];
  exemptChannelIds: string[];
  autoEscalate: boolean;
};

type Persona = {
  guildNickname: string;
  webhookName: string;
  webhookAvatarUrl: string;
  useWebhookPersona: boolean;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #7a0000",
  background: "#0b0b0b",
  color: "#ffd2d2"
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #6f0000",
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
  background: "rgba(120,0,0,0.08)"
};

const defaultFeatures: Features = {
  onboardingEnabled: true,
  verificationEnabled: true
};

const defaultPreOnboarding: PreOnboarding = {
  autoBanOnBlacklistRejoin: true,
  autoBanOnRefusalRole: true,
  refusalRoleId: "",
  enforcementChannelId: "",
  contactUser: "Support Team",
  banDmTemplate:
    "You were removed from the server.\n\nReason: **{{reason}}**\nTrigger: **{{type}}**\n\nContact: **{{contactUser}}**"
};

const defaultOnboarding: Onboarding = {
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
  postVerifyTemplate: "<@{{userId}}> is now verified. Welcome to {{guildName}}."
};

const defaultVerification: Verification = {
  autoKickOnDecline: true,
  autoKickOnTimeout: true,
  declineKickReason: "Declined ID verification",
  timeoutKickReason: "ID submission timeout",
  declineReplyTemplate: "You declined ID verification."
};

const defaultLockdown: Lockdown = {
  enabled: false,
  joinThresholdPerMinute: 10,
  mentionThresholdPerMinute: 20,
  autoEscalation: false,
  exemptRoleIds: [],
  exemptChannelIds: []
};

const defaultRaid: Raid = {
  enabled: true,
  joinBurstThreshold: 6,
  windowSeconds: 30,
  actionPreset: "contain",
  exemptRoleIds: [],
  exemptChannelIds: [],
  autoEscalate: true
};

const defaultPersona: Persona = {
  guildNickname: "",
  webhookName: "",
  webhookAvatarUrl: "",
  useWebhookPersona: false
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function csvToArray(v: string) {
  return String(v || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrayToCsv(v: string[]) {
  return (v || []).join(", ");
}

export default function SecurityPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [features, setFeatures] = useState<Features>(defaultFeatures);
  const [pre, setPre] = useState<PreOnboarding>(defaultPreOnboarding);
  const [onb, setOnb] = useState<Onboarding>(defaultOnboarding);
  const [ver, setVer] = useState<Verification>(defaultVerification);
  const [lockdown, setLockdown] = useState<Lockdown>(defaultLockdown);
  const [raid, setRaid] = useState<Raid>(defaultRaid);
  const [persona, setPersona] = useState<Persona>(defaultPersona);

  useEffect(() => {
    setGuildId(getGuildId());
  }, []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const json = await res.json();
        const cfg = json?.config || {};
        const f = cfg?.features || {};
        const s = cfg?.security || {};

        setFeatures({
          onboardingEnabled: typeof f.onboardingEnabled === "boolean" ? f.onboardingEnabled : true,
          verificationEnabled: typeof f.verificationEnabled === "boolean" ? f.verificationEnabled : true
        });

        setPre({ ...defaultPreOnboarding, ...(s.preOnboarding || {}) });
        setOnb({ ...defaultOnboarding, ...(s.onboarding || {}) });
        setVer({ ...defaultVerification, ...(s.verification || {}) });
        setLockdown({ ...defaultLockdown, ...(s.lockdown || {}) });
        setRaid({ ...defaultRaid, ...(s.raid || {}) });
        setPersona({ ...defaultPersona, ...(cfg.persona || {}) });
      } catch {
        setMsg("Failed to load security config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            features: {
              onboardingEnabled: !!features.onboardingEnabled,
              verificationEnabled: !!features.verificationEnabled
            },
            security: {
              preOnboarding: pre,
              onboarding: onb,
              verification: ver,
              lockdown,
              raid
            },
            persona
          }
        })
      });

      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || "Save failed");
      }
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 1100 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Security Command</h1>
      <p>Guild: {guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Global Security Toggles</h3>
            <label style={{ marginRight: 20 }}>
              <input
                type="checkbox"
                checked={features.onboardingEnabled}
                onChange={(e) => setFeatures((v) => ({ ...v, onboardingEnabled: e.target.checked }))}
              /> onboardingEnabled
            </label>
            <label>
              <input
                type="checkbox"
                checked={features.verificationEnabled}
                onChange={(e) => setFeatures((v) => ({ ...v, verificationEnabled: e.target.checked }))}
              /> verificationEnabled
            </label>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Pre-Onboarding</h3>
            <label><input type="checkbox" checked={pre.autoBanOnBlacklistRejoin} onChange={(e) => setPre({ ...pre, autoBanOnBlacklistRejoin: e.target.checked })} /> autoBanOnBlacklistRejoin</label>
            <br />
            <label><input type="checkbox" checked={pre.autoBanOnRefusalRole} onChange={(e) => setPre({ ...pre, autoBanOnRefusalRole: e.target.checked })} /> autoBanOnRefusalRole</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <input style={inputStyle} placeholder="refusalRoleId" value={pre.refusalRoleId || ""} onChange={(e) => setPre({ ...pre, refusalRoleId: e.target.value })} />
              <input style={inputStyle} placeholder="enforcementChannelId" value={pre.enforcementChannelId || ""} onChange={(e) => setPre({ ...pre, enforcementChannelId: e.target.value })} />
            </div>
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="contactUser" value={pre.contactUser || ""} onChange={(e) => setPre({ ...pre, contactUser: e.target.value })} />
            <textarea style={{ ...inputStyle, marginTop: 10, minHeight: 90 }} placeholder="banDmTemplate" value={pre.banDmTemplate || ""} onChange={(e) => setPre({ ...pre, banDmTemplate: e.target.value })} />
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Verification</h3>
            <label><input type="checkbox" checked={ver.autoKickOnDecline} onChange={(e) => setVer({ ...ver, autoKickOnDecline: e.target.checked })} /> autoKickOnDecline</label>
            <br />
            <label><input type="checkbox" checked={ver.autoKickOnTimeout} onChange={(e) => setVer({ ...ver, autoKickOnTimeout: e.target.checked })} /> autoKickOnTimeout</label>
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="declineKickReason" value={ver.declineKickReason || ""} onChange={(e) => setVer({ ...ver, declineKickReason: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="timeoutKickReason" value={ver.timeoutKickReason || ""} onChange={(e) => setVer({ ...ver, timeoutKickReason: e.target.value })} />
            <textarea style={{ ...inputStyle, marginTop: 10, minHeight: 80 }} placeholder="declineReplyTemplate" value={ver.declineReplyTemplate || ""} onChange={(e) => setVer({ ...ver, declineReplyTemplate: e.target.value })} />
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Onboarding</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} placeholder="welcomeChannelId" value={onb.welcomeChannelId || ""} onChange={(e) => setOnb({ ...onb, welcomeChannelId: e.target.value })} />
              <input style={inputStyle} placeholder="mainChatChannelId" value={onb.mainChatChannelId || ""} onChange={(e) => setOnb({ ...onb, mainChatChannelId: e.target.value })} />
              <input style={inputStyle} placeholder="rulesChannelId" value={onb.rulesChannelId || ""} onChange={(e) => setOnb({ ...onb, rulesChannelId: e.target.value })} />
              <input style={inputStyle} placeholder="idChannelId" value={onb.idChannelId || ""} onChange={(e) => setOnb({ ...onb, idChannelId: e.target.value })} />
              <input style={inputStyle} placeholder="ticketCategoryId" value={onb.ticketCategoryId || ""} onChange={(e) => setOnb({ ...onb, ticketCategoryId: e.target.value })} />
              <input style={inputStyle} placeholder="transcriptChannelId" value={onb.transcriptChannelId || ""} onChange={(e) => setOnb({ ...onb, transcriptChannelId: e.target.value })} />
              <input style={inputStyle} placeholder="logChannelId" value={onb.logChannelId || ""} onChange={(e) => setOnb({ ...onb, logChannelId: e.target.value })} />
              <input style={inputStyle} placeholder="verifiedRoleId" value={onb.verifiedRoleId || ""} onChange={(e) => setOnb({ ...onb, verifiedRoleId: e.target.value })} />
              <input style={inputStyle} placeholder="declineRoleId" value={onb.declineRoleId || ""} onChange={(e) => setOnb({ ...onb, declineRoleId: e.target.value })} />
              <input style={inputStyle} type="number" placeholder="idTimeoutMinutes" value={onb.idTimeoutMinutes || 30} onChange={(e) => setOnb({ ...onb, idTimeoutMinutes: Number(e.target.value || 30) })} />
              <input style={inputStyle} placeholder="staffRoleIds (comma-separated)" value={arrayToCsv(onb.staffRoleIds)} onChange={(e) => setOnb({ ...onb, staffRoleIds: csvToArray(e.target.value) })} />
              <input style={inputStyle} placeholder="removeOnVerifyRoleIds (comma-separated)" value={arrayToCsv(onb.removeOnVerifyRoleIds)} onChange={(e) => setOnb({ ...onb, removeOnVerifyRoleIds: csvToArray(e.target.value) })} />
            </div>
            <textarea style={{ ...inputStyle, marginTop: 10, minHeight: 70 }} placeholder="dmTemplate" value={onb.dmTemplate || ""} onChange={(e) => setOnb({ ...onb, dmTemplate: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="panelTitle" value={onb.panelTitle || ""} onChange={(e) => setOnb({ ...onb, panelTitle: e.target.value })} />
            <textarea style={{ ...inputStyle, marginTop: 10, minHeight: 80 }} placeholder="panelDescription" value={onb.panelDescription || ""} onChange={(e) => setOnb({ ...onb, panelDescription: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="panelFooter" value={onb.panelFooter || ""} onChange={(e) => setOnb({ ...onb, panelFooter: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="gateAnnouncementTemplate" value={onb.gateAnnouncementTemplate || ""} onChange={(e) => setOnb({ ...onb, gateAnnouncementTemplate: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="idPanelTitle" value={onb.idPanelTitle || ""} onChange={(e) => setOnb({ ...onb, idPanelTitle: e.target.value })} />
            <textarea style={{ ...inputStyle, marginTop: 10, minHeight: 80 }} placeholder="idPanelDescription" value={onb.idPanelDescription || ""} onChange={(e) => setOnb({ ...onb, idPanelDescription: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="idPanelContent" value={onb.idPanelContent || ""} onChange={(e) => setOnb({ ...onb, idPanelContent: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="postVerifyTemplate" value={onb.postVerifyTemplate || ""} onChange={(e) => setOnb({ ...onb, postVerifyTemplate: e.target.value })} />
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Lockdown</h3>
            <label><input type="checkbox" checked={lockdown.enabled} onChange={(e) => setLockdown({ ...lockdown, enabled: e.target.checked })} /> enabled</label>
            <br />
            <label><input type="checkbox" checked={lockdown.autoEscalation} onChange={(e) => setLockdown({ ...lockdown, autoEscalation: e.target.checked })} /> autoEscalation</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <input style={inputStyle} type="number" placeholder="joinThresholdPerMinute" value={lockdown.joinThresholdPerMinute} onChange={(e) => setLockdown({ ...lockdown, joinThresholdPerMinute: Number(e.target.value || 0) })} />
              <input style={inputStyle} type="number" placeholder="mentionThresholdPerMinute" value={lockdown.mentionThresholdPerMinute} onChange={(e) => setLockdown({ ...lockdown, mentionThresholdPerMinute: Number(e.target.value || 0) })} />
            </div>
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="exemptRoleIds (comma-separated)" value={arrayToCsv(lockdown.exemptRoleIds)} onChange={(e) => setLockdown({ ...lockdown, exemptRoleIds: csvToArray(e.target.value) })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="exemptChannelIds (comma-separated)" value={arrayToCsv(lockdown.exemptChannelIds)} onChange={(e) => setLockdown({ ...lockdown, exemptChannelIds: csvToArray(e.target.value) })} />
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Raid</h3>
            <label><input type="checkbox" checked={raid.enabled} onChange={(e) => setRaid({ ...raid, enabled: e.target.checked })} /> enabled</label>
            <br />
            <label><input type="checkbox" checked={raid.autoEscalate} onChange={(e) => setRaid({ ...raid, autoEscalate: e.target.checked })} /> autoEscalate</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <input style={inputStyle} type="number" placeholder="joinBurstThreshold" value={raid.joinBurstThreshold} onChange={(e) => setRaid({ ...raid, joinBurstThreshold: Number(e.target.value || 0) })} />
              <input style={inputStyle} type="number" placeholder="windowSeconds" value={raid.windowSeconds} onChange={(e) => setRaid({ ...raid, windowSeconds: Number(e.target.value || 0) })} />
            </div>
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="actionPreset" value={raid.actionPreset || ""} onChange={(e) => setRaid({ ...raid, actionPreset: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="exemptRoleIds (comma-separated)" value={arrayToCsv(raid.exemptRoleIds)} onChange={(e) => setRaid({ ...raid, exemptRoleIds: csvToArray(e.target.value) })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="exemptChannelIds (comma-separated)" value={arrayToCsv(raid.exemptChannelIds)} onChange={(e) => setRaid({ ...raid, exemptChannelIds: csvToArray(e.target.value) })} />
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Bot Persona (not AI engine)</h3>
            <label><input type="checkbox" checked={persona.useWebhookPersona} onChange={(e) => setPersona({ ...persona, useWebhookPersona: e.target.checked })} /> useWebhookPersona</label>
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="guildNickname" value={persona.guildNickname || ""} onChange={(e) => setPersona({ ...persona, guildNickname: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="webhookName" value={persona.webhookName || ""} onChange={(e) => setPersona({ ...persona, webhookName: e.target.value })} />
            <input style={{ ...inputStyle, marginTop: 10 }} placeholder="webhookAvatarUrl" value={persona.webhookAvatarUrl || ""} onChange={(e) => setPersona({ ...persona, webhookAvatarUrl: e.target.value })} />
          </div>

          <button onClick={saveAll} disabled={saving} style={{ ...inputStyle, width: 240, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Security + Persona"}
          </button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
