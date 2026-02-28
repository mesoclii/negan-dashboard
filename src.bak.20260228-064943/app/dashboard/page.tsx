"use client";

import { useEffect, useMemo, useState } from "react";

type Guild = { id: string; name: string; icon?: string | null };

type Features = {
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
  heistEnabled: boolean;
  rareDropEnabled: boolean;
  pokemonEnabled: boolean;
  aiEnabled: boolean;
  birthdayEnabled: boolean;
  economyEnabled: boolean;
  governanceEnabled: boolean;
  ttsEnabled: boolean;
  pokemonPrivateOnly?: boolean;
};

type DashboardConfig = {
  features: Features;
  security: {
    preOnboarding: {
      autoBanOnBlacklistRejoin: boolean;
      autoBanOnRefusalRole: boolean;
      refusalRoleId: string | null;
      enforcementChannelId: string | null;
      contactUser: string;
      banDmTemplate?: string;
    };
    verification: {
      autoKickOnDecline: boolean;
      autoKickOnTimeout: boolean;
      declineKickReason: string;
      timeoutKickReason: string;
      declineReplyTemplate: string;
    };
    onboarding: {
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
      dmTemplate?: string;
      panelTitle?: string;
      panelDescription?: string;
      panelFooter?: string;
      gateAnnouncementTemplate?: string;
      idPanelTitle?: string;
      idPanelDescription?: string;
      idPanelContent?: string;
      postVerifyTemplate?: string;
    };
    lockdown: {
      enabled: boolean;
      joinThresholdPerMinute: number;
      mentionThresholdPerMinute: number;
      autoEscalation: boolean;
      exemptRoleIds: string[];
      exemptChannelIds: string[];
    };
    raid: {
      enabled: boolean;
      joinBurstThreshold: number;
      windowSeconds: number;
      actionPreset: string;
      exemptRoleIds: string[];
      exemptChannelIds: string[];
      autoEscalate: boolean;
    };
  };
  persona: {
    guildNickname: string;
    webhookName: string;
    webhookAvatarUrl: string;
    useWebhookPersona: boolean;
  };
};

const DEFAULT_CONFIG: DashboardConfig = {
  features: {
    onboardingEnabled: true,
    verificationEnabled: true,
    heistEnabled: true,
    rareDropEnabled: true,
    pokemonEnabled: true,
    aiEnabled: false,
    birthdayEnabled: true,
    economyEnabled: true,
    governanceEnabled: true,
    ttsEnabled: false,
    pokemonPrivateOnly: false
  },
  security: {
    preOnboarding: {
      autoBanOnBlacklistRejoin: true,
      autoBanOnRefusalRole: true,
      refusalRoleId: "",
      enforcementChannelId: "",
      contactUser: "Support Team",
      banDmTemplate: ""
    },
    verification: {
      autoKickOnDecline: true,
      autoKickOnTimeout: true,
      declineKickReason: "Declined ID verification",
      timeoutKickReason: "ID submission timeout",
      declineReplyTemplate: "You declined ID verification."
    },
    onboarding: {
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
      dmTemplate: "",
      panelTitle: "",
      panelDescription: "",
      panelFooter: "",
      gateAnnouncementTemplate: "",
      idPanelTitle: "",
      idPanelDescription: "",
      idPanelContent: "",
      postVerifyTemplate: ""
    },
    lockdown: {
      enabled: false,
      joinThresholdPerMinute: 10,
      mentionThresholdPerMinute: 20,
      autoEscalation: false,
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    raid: {
      enabled: true,
      joinBurstThreshold: 6,
      windowSeconds: 30,
      actionPreset: "contain",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: true
    }
  },
  persona: {
    guildNickname: "",
    webhookName: "",
    webhookAvatarUrl: "",
    useWebhookPersona: false
  }
};

function csvToArray(v: string): string[] {
  return String(v || "").split(",").map((x) => x.trim()).filter(Boolean);
}
function arrayToCsv(v: string[]): string {
  return (v || []).join(", ");
}
function str(v: any) {
  return v == null ? "" : String(v);
}

export default function DashboardPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [config, setConfig] = useState<DashboardConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const activeGuildName = useMemo(
    () => guilds.find((g) => g.id === guildId)?.name || guildId,
    [guilds, guildId]
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("guildId") || "" : "";
        const s = typeof window !== "undefined" ? localStorage.getItem("activeGuildId") || "" : "";
        const next = q || s || list[0]?.id || "";
        setGuildId(next);

        if (next && typeof window !== "undefined") {
          localStorage.setItem("activeGuildId", next);
          const url = new URL(window.location.href);
          url.searchParams.set("guildId", next);
          window.history.replaceState({}, "", url.toString());
        }
      } catch {
        setMsg("Failed to load guild list.");
      }
    })();
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
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        const c = j?.config || {};
        setConfig({
          features: { ...DEFAULT_CONFIG.features, ...(c.features || {}) },
          security: {
            preOnboarding: { ...DEFAULT_CONFIG.security.preOnboarding, ...(c.security?.preOnboarding || {}) },
            verification: { ...DEFAULT_CONFIG.security.verification, ...(c.security?.verification || {}) },
            onboarding: { ...DEFAULT_CONFIG.security.onboarding, ...(c.security?.onboarding || {}) },
            lockdown: { ...DEFAULT_CONFIG.security.lockdown, ...(c.security?.lockdown || {}) },
            raid: { ...DEFAULT_CONFIG.security.raid, ...(c.security?.raid || {}) }
          },
          persona: { ...DEFAULT_CONFIG.persona, ...(c.persona || {}) }
        });
      } catch {
        setMsg("Failed to load config.");
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
      const featuresToSave = { ...config.features };
      delete (featuresToSave as any).pokemonPrivateOnly;

      const r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            features: featuresToSave,
            security: config.security,
            persona: config.persona
          }
        })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border: "1px solid #7a0000",
    background: "#0d0d0d",
    color: "#ffd2d2"
  };

  const box: React.CSSProperties = {
    border: "1px solid #6f0000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    background: "rgba(120,0,0,0.08)"
  };

  if (loading) return <div style={{ color: "#ff5252", padding: 24 }}>Loading...</div>;

  return (
    <div style={{ color: "#ff5252", padding: 24 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>SaaS Control Center</h1>
      <p>Per-guild deep config. No overlap. No global bleed.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, maxWidth: 900 }}>
        <select
          value={guildId}
          onChange={(e) => {
            const next = e.target.value;
            setGuildId(next);
            if (typeof window !== "undefined") {
              localStorage.setItem("activeGuildId", next);
              const url = new URL(window.location.href);
              url.searchParams.set("guildId", next);
              window.history.replaceState({}, "", url.toString());
            }
          }}
          style={inputStyle}
        >
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.id})
            </option>
          ))}
        </select>
        <button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save All"}</button>
      </div>

      <p style={{ marginTop: 12 }}>Active: {activeGuildName}</p>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Features</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 8 }}>
          {Object.entries(config.features).map(([k, v]) => {
            if (k === "pokemonPrivateOnly") return null;
            return (
              <label key={k}><input type="checkbox" checked={Boolean(v)} onChange={(e) => setConfig((p) => ({ ...p, features: { ...p.features, [k]: e.target.checked } }))} /> {k}</label>
            );
          })}
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pre-Onboarding</h3>
        <label><input type="checkbox" checked={config.security.preOnboarding.autoBanOnBlacklistRejoin} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,autoBanOnBlacklistRejoin:e.target.checked}}}))}/> autoBanOnBlacklistRejoin</label>
        <label style={{ marginLeft: 14 }}><input type="checkbox" checked={config.security.preOnboarding.autoBanOnRefusalRole} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,autoBanOnRefusalRole:e.target.checked}}}))}/> autoBanOnRefusalRole</label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
          <input style={inputStyle} value={str(config.security.preOnboarding.refusalRoleId)} placeholder="refusalRoleId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,refusalRoleId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.preOnboarding.enforcementChannelId)} placeholder="enforcementChannelId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,enforcementChannelId:e.target.value}}}))}/>
        </div>
        <div style={{ marginTop:10 }}>
          <input style={inputStyle} value={str(config.security.preOnboarding.contactUser)} placeholder="contactUser" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,contactUser:e.target.value}}}))}/>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Verification</h3>
        <label><input type="checkbox" checked={config.security.verification.autoKickOnDecline} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,verification:{...p.security.verification,autoKickOnDecline:e.target.checked}}}))}/> autoKickOnDecline</label>
        <label style={{ marginLeft: 14 }}><input type="checkbox" checked={config.security.verification.autoKickOnTimeout} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,verification:{...p.security.verification,autoKickOnTimeout:e.target.checked}}}))}/> autoKickOnTimeout</label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:10 }}>
          <input style={inputStyle} value={str(config.security.verification.declineKickReason)} placeholder="declineKickReason" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,verification:{...p.security.verification,declineKickReason:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.verification.timeoutKickReason)} placeholder="timeoutKickReason" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,verification:{...p.security.verification,timeoutKickReason:e.target.value}}}))}/>
        </div>
        <div style={{ marginTop:10 }}>
          <textarea style={{...inputStyle,minHeight:80}} value={str(config.security.verification.declineReplyTemplate)} placeholder="declineReplyTemplate" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,verification:{...p.security.verification,declineReplyTemplate:e.target.value}}}))}/>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Onboarding</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <input style={inputStyle} value={str(config.security.onboarding.welcomeChannelId)} placeholder="welcomeChannelId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,welcomeChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.mainChatChannelId)} placeholder="mainChatChannelId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,mainChatChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.rulesChannelId)} placeholder="rulesChannelId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,rulesChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.idChannelId)} placeholder="idChannelId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,idChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.ticketCategoryId)} placeholder="ticketCategoryId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,ticketCategoryId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.transcriptChannelId)} placeholder="transcriptChannelId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,transcriptChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.logChannelId)} placeholder="logChannelId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,logChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.verifiedRoleId)} placeholder="verifiedRoleId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,verifiedRoleId:e.target.value}}}))}/>
          <input style={inputStyle} value={str(config.security.onboarding.declineRoleId)} placeholder="declineRoleId" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,declineRoleId:e.target.value}}}))}/>
          <input style={inputStyle} type="number" value={Number(config.security.onboarding.idTimeoutMinutes || 30)} placeholder="idTimeoutMinutes" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,idTimeoutMinutes:Number(e.target.value || 30)}}}))}/>
          <input style={inputStyle} value={arrayToCsv(config.security.onboarding.staffRoleIds)} placeholder="staffRoleIds (comma-separated)" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,staffRoleIds:csvToArray(e.target.value)}}}))}/>
          <input style={inputStyle} value={arrayToCsv(config.security.onboarding.removeOnVerifyRoleIds)} placeholder="removeOnVerifyRoleIds (comma-separated)" onChange={(e)=>setConfig(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,removeOnVerifyRoleIds:csvToArray(e.target.value)}}}))}/>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Lockdown</h3>
        <label><input type="checkbox" checked={config.security.lockdown.enabled} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,lockdown:{...p.security.lockdown,enabled:e.target.checked}}}))}/> enabled</label>
        <label style={{ marginLeft:14 }}><input type="checkbox" checked={config.security.lockdown.autoEscalation} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,lockdown:{...p.security.lockdown,autoEscalation:e.target.checked}}}))}/> autoEscalation</label>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Raid</h3>
        <label><input type="checkbox" checked={config.security.raid.enabled} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,raid:{...p.security.raid,enabled:e.target.checked}}}))}/> enabled</label>
        <label style={{ marginLeft:14 }}><input type="checkbox" checked={config.security.raid.autoEscalate} onChange={(e)=>setConfig(p=>({...p,security:{...p.security,raid:{...p.security.raid,autoEscalate:e.target.checked}}}))}/> autoEscalate</label>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Bot Persona (Not AI Characters)</h3>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <input style={inputStyle} value={str(config.persona.guildNickname)} placeholder="guildNickname" onChange={(e)=>setConfig(p=>({...p,persona:{...p.persona,guildNickname:e.target.value}}))}/>
          <input style={inputStyle} value={str(config.persona.webhookName)} placeholder="webhookName" onChange={(e)=>setConfig(p=>({...p,persona:{...p.persona,webhookName:e.target.value}}))}/>
          <input style={inputStyle} value={str(config.persona.webhookAvatarUrl)} placeholder="webhookAvatarUrl" onChange={(e)=>setConfig(p=>({...p,persona:{...p.persona,webhookAvatarUrl:e.target.value}}))}/>
        </div>
        <div style={{ marginTop:10 }}>
          <label><input type="checkbox" checked={config.persona.useWebhookPersona} onChange={(e)=>setConfig(p=>({...p,persona:{...p.persona,useWebhookPersona:e.target.checked}}))}/> useWebhookPersona</label>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save All"}</button>
        {msg ? <span style={{ marginLeft: 12 }}>{msg}</span> : null}
      </div>
    </div>
  );
}
