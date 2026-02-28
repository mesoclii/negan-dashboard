"use client";

import { useEffect, useMemo, useState } from "react";

type Guild = { id: string; name: string };

type DashboardConfig = {
  security: {
    preOnboarding: any;
    verification: any;
    onboarding: any;
    lockdown: any;
    raid: any;
  };
  persona: any;
  features?: any;
};

const EMPTY: DashboardConfig = {
  security: {
    preOnboarding: {},
    verification: {},
    onboarding: {},
    lockdown: {},
    raid: {}
  },
  persona: {},
  features: {}
};

function s(v: any) { return v == null ? "" : String(v); }
function csvToArr(v: string) { return String(v || "").split(",").map(x => x.trim()).filter(Boolean); }
function arrToCsv(v: any) { return Array.isArray(v) ? v.join(", ") : ""; }

export default function DashboardPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<DashboardConfig>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const guildName = useMemo(() => guilds.find(g => g.id === guildId)?.name || guildId, [guilds, guildId]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("guildId") || "" : "";
        const st = typeof window !== "undefined" ? localStorage.getItem("activeGuildId") || "" : "";
        const next = q || st || list[0]?.id || "";
        setGuildId(next);

        if (next && typeof window !== "undefined") {
          localStorage.setItem("activeGuildId", next);
          const u = new URL(window.location.href);
          u.searchParams.set("guildId", next);
          window.history.replaceState({}, "", u.toString());
        }
      } catch {
        setMsg("Failed to load guilds.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        if (!r.ok || j?.success === false) throw new Error(j?.error || "Load failed");
        setCfg({
          security: {
            preOnboarding: j?.config?.security?.preOnboarding || {},
            verification: j?.config?.security?.verification || {},
            onboarding: j?.config?.security?.onboarding || {},
            lockdown: j?.config?.security?.lockdown || {},
            raid: j?.config?.security?.raid || {}
          },
          persona: j?.config?.persona || {},
          features: j?.config?.features || {}
        });
      } catch (e: any) {
        setMsg(e?.message || "Failed to load config.");
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
      const body = {
        guildId,
        patch: {
          security: cfg.security,
          persona: cfg.persona
        }
      };
      const r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
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
    width: "100%", padding: 10, borderRadius: 8, border: "1px solid #7a0000",
    background: "#0d0d0d", color: "#ffd2d2"
  };
  const box: React.CSSProperties = {
    border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)"
  };

  if (loading) return <div style={{ color: "#ff5252", padding: 24 }}>Loading...</div>;

  return (
    <div style={{ color: "#ff5252", padding: 24 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>SaaS Control Center</h1>
      <p>Active: {guildName}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, maxWidth: 900, marginBottom: 14 }}>
        <select
          value={guildId}
          onChange={(e) => {
            const next = e.target.value;
            setGuildId(next);
            if (typeof window !== "undefined") {
              localStorage.setItem("activeGuildId", next);
              const u = new URL(window.location.href);
              u.searchParams.set("guildId", next);
              window.history.replaceState({}, "", u.toString());
            }
          }}
          style={inputStyle}
        >
          {guilds.map(g => <option key={g.id} value={g.id}>{g.name} ({g.id})</option>)}
        </select>
        <button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save All"}</button>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pre-Onboarding</h3>
        <label><input type="checkbox" checked={!!cfg.security.preOnboarding.autoBanOnBlacklistRejoin}
          onChange={(e)=>setCfg(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,autoBanOnBlacklistRejoin:e.target.checked}}}))}/> autoBanOnBlacklistRejoin</label>
        <label style={{ marginLeft: 14 }}><input type="checkbox" checked={!!cfg.security.preOnboarding.autoBanOnRefusalRole}
          onChange={(e)=>setCfg(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,autoBanOnRefusalRole:e.target.checked}}}))}/> autoBanOnRefusalRole</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <input style={inputStyle} value={s(cfg.security.preOnboarding.refusalRoleId)} placeholder="refusalRoleId"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,refusalRoleId:e.target.value}}}))}/>
          <input style={inputStyle} value={s(cfg.security.preOnboarding.enforcementChannelId)} placeholder="enforcementChannelId"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,preOnboarding:{...p.security.preOnboarding,enforcementChannelId:e.target.value}}}))}/>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Verification</h3>
        <label><input type="checkbox" checked={!!cfg.security.verification.autoKickOnDecline}
          onChange={(e)=>setCfg(p=>({...p,security:{...p.security,verification:{...p.security.verification,autoKickOnDecline:e.target.checked}}}))}/> autoKickOnDecline</label>
        <label style={{ marginLeft: 14 }}><input type="checkbox" checked={!!cfg.security.verification.autoKickOnTimeout}
          onChange={(e)=>setCfg(p=>({...p,security:{...p.security,verification:{...p.security.verification,autoKickOnTimeout:e.target.checked}}}))}/> autoKickOnTimeout</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          <input style={inputStyle} value={s(cfg.security.verification.declineKickReason)} placeholder="declineKickReason"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,verification:{...p.security.verification,declineKickReason:e.target.value}}}))}/>
          <input style={inputStyle} value={s(cfg.security.verification.timeoutKickReason)} placeholder="timeoutKickReason"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,verification:{...p.security.verification,timeoutKickReason:e.target.value}}}))}/>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Onboarding</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input style={inputStyle} value={s(cfg.security.onboarding.welcomeChannelId)} placeholder="welcomeChannelId"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,welcomeChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={s(cfg.security.onboarding.rulesChannelId)} placeholder="rulesChannelId"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,rulesChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={s(cfg.security.onboarding.idChannelId)} placeholder="idChannelId"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,idChannelId:e.target.value}}}))}/>
          <input style={inputStyle} value={s(cfg.security.onboarding.ticketCategoryId)} placeholder="ticketCategoryId"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,ticketCategoryId:e.target.value}}}))}/>
          <input style={inputStyle} value={arrToCsv(cfg.security.onboarding.staffRoleIds)} placeholder="staffRoleIds (comma-separated)"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,staffRoleIds:csvToArr(e.target.value)}}}))}/>
          <input style={inputStyle} value={arrToCsv(cfg.security.onboarding.removeOnVerifyRoleIds)} placeholder="removeOnVerifyRoleIds (comma-separated)"
            onChange={(e)=>setCfg(p=>({...p,security:{...p.security,onboarding:{...p.security.onboarding,removeOnVerifyRoleIds:csvToArr(e.target.value)}}}))}/>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Bot Persona (not AI characters)</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <input style={inputStyle} value={s(cfg.persona.guildNickname)} placeholder="guildNickname"
            onChange={(e)=>setCfg(p=>({...p,persona:{...p.persona,guildNickname:e.target.value}}))}/>
          <input style={inputStyle} value={s(cfg.persona.webhookName)} placeholder="webhookName"
            onChange={(e)=>setCfg(p=>({...p,persona:{...p.persona,webhookName:e.target.value}}))}/>
        </div>
      </div>

      {msg ? <p>{msg}</p> : null}
    </div>
  );
}
