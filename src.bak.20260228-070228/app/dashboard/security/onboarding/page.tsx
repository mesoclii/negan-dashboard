"use client";

import { useEffect, useState } from "react";

type OnCfg = {
  welcomeChannelId: string;
  mainChatChannelId: string;
  rulesChannelId: string;
  idChannelId: string;
  ticketCategoryId: string;
  transcriptChannelId: string;
  logChannelId: string;
  verifiedRoleId: string;
  declineRoleId: string;
  staffRoleIds: string[];
  removeOnVerifyRoleIds: string[];
  idTimeoutMinutes: number;
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

const DEFAULT_CFG: OnCfg = {
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
  dmTemplate: "",
  panelTitle: "",
  panelDescription: "",
  panelFooter: "",
  gateAnnouncementTemplate: "",
  idPanelTitle: "",
  idPanelDescription: "",
  idPanelContent: "",
  postVerifyTemplate: ""
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const gid = (q || s).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}
function csvToArr(v: string): string[] { return String(v || "").split(",").map(x => x.trim()).filter(Boolean); }
function arrToCsv(v: string[]): string { return (v || []).join(", "); }

export default function OnboardingPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<OnCfg>(DEFAULT_CFG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

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
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        const d = j?.config?.security?.onboarding || {};
        setCfg({
          welcomeChannelId: String(d.welcomeChannelId || ""),
          mainChatChannelId: String(d.mainChatChannelId || ""),
          rulesChannelId: String(d.rulesChannelId || ""),
          idChannelId: String(d.idChannelId || ""),
          ticketCategoryId: String(d.ticketCategoryId || ""),
          transcriptChannelId: String(d.transcriptChannelId || ""),
          logChannelId: String(d.logChannelId || ""),
          verifiedRoleId: String(d.verifiedRoleId || ""),
          declineRoleId: String(d.declineRoleId || ""),
          staffRoleIds: Array.isArray(d.staffRoleIds) ? d.staffRoleIds : [],
          removeOnVerifyRoleIds: Array.isArray(d.removeOnVerifyRoleIds) ? d.removeOnVerifyRoleIds : [],
          idTimeoutMinutes: Number(d.idTimeoutMinutes || 30),
          dmTemplate: String(d.dmTemplate || ""),
          panelTitle: String(d.panelTitle || ""),
          panelDescription: String(d.panelDescription || ""),
          panelFooter: String(d.panelFooter || ""),
          gateAnnouncementTemplate: String(d.gateAnnouncementTemplate || ""),
          idPanelTitle: String(d.idPanelTitle || ""),
          idPanelDescription: String(d.idPanelDescription || ""),
          idPanelContent: String(d.idPanelContent || ""),
          postVerifyTemplate: String(d.postVerifyTemplate || "")
        });
      } catch {
        setMsg("Failed to load onboarding config.");
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
      const r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: { security: { onboarding: cfg } }
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
    padding: 10,
    borderRadius: 8,
    border: "1px solid #7a0000",
    background: "#0d0d0d",
    color: "#ffd2d2"
  };

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  if (loading) return <div style={{ color: "#ff5252", padding: 24 }}>Loading...</div>;

  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 1100 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Onboarding Config</h1>
      <p>Guild: {guildId}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <input style={inputStyle} value={cfg.welcomeChannelId} onChange={(e)=>setCfg({...cfg,welcomeChannelId:e.target.value})} placeholder="welcomeChannelId" />
        <input style={inputStyle} value={cfg.mainChatChannelId} onChange={(e)=>setCfg({...cfg,mainChatChannelId:e.target.value})} placeholder="mainChatChannelId" />
        <input style={inputStyle} value={cfg.rulesChannelId} onChange={(e)=>setCfg({...cfg,rulesChannelId:e.target.value})} placeholder="rulesChannelId" />
        <input style={inputStyle} value={cfg.idChannelId} onChange={(e)=>setCfg({...cfg,idChannelId:e.target.value})} placeholder="idChannelId" />
        <input style={inputStyle} value={cfg.ticketCategoryId} onChange={(e)=>setCfg({...cfg,ticketCategoryId:e.target.value})} placeholder="ticketCategoryId" />
        <input style={inputStyle} value={cfg.transcriptChannelId} onChange={(e)=>setCfg({...cfg,transcriptChannelId:e.target.value})} placeholder="transcriptChannelId" />
        <input style={inputStyle} value={cfg.logChannelId} onChange={(e)=>setCfg({...cfg,logChannelId:e.target.value})} placeholder="logChannelId" />
        <input style={inputStyle} value={cfg.verifiedRoleId} onChange={(e)=>setCfg({...cfg,verifiedRoleId:e.target.value})} placeholder="verifiedRoleId" />
        <input style={inputStyle} value={cfg.declineRoleId} onChange={(e)=>setCfg({...cfg,declineRoleId:e.target.value})} placeholder="declineRoleId" />
        <input style={inputStyle} type="number" value={cfg.idTimeoutMinutes} onChange={(e)=>setCfg({...cfg,idTimeoutMinutes:Number(e.target.value || 30)})} placeholder="idTimeoutMinutes" />
      </div>

      <div style={{ marginTop: 10 }}>
        <input style={inputStyle} value={arrToCsv(cfg.staffRoleIds)} onChange={(e)=>setCfg({...cfg,staffRoleIds:csvToArr(e.target.value)})} placeholder="staffRoleIds (comma-separated)" />
      </div>
      <div style={{ marginTop: 10 }}>
        <input style={inputStyle} value={arrToCsv(cfg.removeOnVerifyRoleIds)} onChange={(e)=>setCfg({...cfg,removeOnVerifyRoleIds:csvToArr(e.target.value)})} placeholder="removeOnVerifyRoleIds (comma-separated)" />
      </div>

      <div style={{ marginTop: 10 }}><textarea style={{ ...inputStyle, minHeight: 80 }} value={cfg.dmTemplate} onChange={(e)=>setCfg({...cfg,dmTemplate:e.target.value})} placeholder="dmTemplate" /></div>
      <div style={{ marginTop: 10 }}><input style={inputStyle} value={cfg.panelTitle} onChange={(e)=>setCfg({...cfg,panelTitle:e.target.value})} placeholder="panelTitle" /></div>
      <div style={{ marginTop: 10 }}><textarea style={{ ...inputStyle, minHeight: 80 }} value={cfg.panelDescription} onChange={(e)=>setCfg({...cfg,panelDescription:e.target.value})} placeholder="panelDescription" /></div>
      <div style={{ marginTop: 10 }}><input style={inputStyle} value={cfg.panelFooter} onChange={(e)=>setCfg({...cfg,panelFooter:e.target.value})} placeholder="panelFooter" /></div>
      <div style={{ marginTop: 10 }}><textarea style={{ ...inputStyle, minHeight: 80 }} value={cfg.gateAnnouncementTemplate} onChange={(e)=>setCfg({...cfg,gateAnnouncementTemplate:e.target.value})} placeholder="gateAnnouncementTemplate" /></div>
      <div style={{ marginTop: 10 }}><input style={inputStyle} value={cfg.idPanelTitle} onChange={(e)=>setCfg({...cfg,idPanelTitle:e.target.value})} placeholder="idPanelTitle" /></div>
      <div style={{ marginTop: 10 }}><textarea style={{ ...inputStyle, minHeight: 80 }} value={cfg.idPanelDescription} onChange={(e)=>setCfg({...cfg,idPanelDescription:e.target.value})} placeholder="idPanelDescription" /></div>
      <div style={{ marginTop: 10 }}><textarea style={{ ...inputStyle, minHeight: 80 }} value={cfg.idPanelContent} onChange={(e)=>setCfg({...cfg,idPanelContent:e.target.value})} placeholder="idPanelContent" /></div>
      <div style={{ marginTop: 10 }}><textarea style={{ ...inputStyle, minHeight: 80 }} value={cfg.postVerifyTemplate} onChange={(e)=>setCfg({...cfg,postVerifyTemplate:e.target.value})} placeholder="postVerifyTemplate" /></div>

      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Onboarding"}</button>
        {msg ? <span style={{ marginLeft: 12 }}>{msg}</span> : null}
      </div>
    </div>
  );
}
