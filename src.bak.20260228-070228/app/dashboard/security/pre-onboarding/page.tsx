"use client";

import { useEffect, useState } from "react";

type PreCfg = {
  autoBanOnBlacklistRejoin: boolean;
  autoBanOnRefusalRole: boolean;
  refusalRoleId: string;
  enforcementChannelId: string;
  contactUser: string;
  banDmTemplate: string;
};

const DEFAULT_CFG: PreCfg = {
  autoBanOnBlacklistRejoin: true,
  autoBanOnRefusalRole: true,
  refusalRoleId: "",
  enforcementChannelId: "",
  contactUser: "Support Team",
  banDmTemplate: ""
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const gid = (q || s).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function PreOnboardingPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<PreCfg>(DEFAULT_CFG);
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
        const data = j?.config?.security?.preOnboarding || {};
        setCfg({
          autoBanOnBlacklistRejoin: Boolean(data.autoBanOnBlacklistRejoin ?? true),
          autoBanOnRefusalRole: Boolean(data.autoBanOnRefusalRole ?? true),
          refusalRoleId: String(data.refusalRoleId || ""),
          enforcementChannelId: String(data.enforcementChannelId || ""),
          contactUser: String(data.contactUser || "Support Team"),
          banDmTemplate: String(data.banDmTemplate || "")
        });
      } catch {
        setMsg("Failed to load pre-onboarding config.");
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
          patch: { security: { preOnboarding: cfg } }
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
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 1000 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Pre-Onboarding Config</h1>
      <p>Guild: {guildId}</p>

      <label><input type="checkbox" checked={cfg.autoBanOnBlacklistRejoin} onChange={(e) => setCfg({ ...cfg, autoBanOnBlacklistRejoin: e.target.checked })} /> autoBanOnBlacklistRejoin</label>
      <br />
      <label><input type="checkbox" checked={cfg.autoBanOnRefusalRole} onChange={(e) => setCfg({ ...cfg, autoBanOnRefusalRole: e.target.checked })} /> autoBanOnRefusalRole</label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <input style={inputStyle} value={cfg.refusalRoleId} onChange={(e) => setCfg({ ...cfg, refusalRoleId: e.target.value })} placeholder="refusalRoleId" />
        <input style={inputStyle} value={cfg.enforcementChannelId} onChange={(e) => setCfg({ ...cfg, enforcementChannelId: e.target.value })} placeholder="enforcementChannelId" />
      </div>

      <div style={{ marginTop: 10 }}>
        <input style={inputStyle} value={cfg.contactUser} onChange={(e) => setCfg({ ...cfg, contactUser: e.target.value })} placeholder="contactUser" />
      </div>

      <div style={{ marginTop: 10 }}>
        <textarea style={{ ...inputStyle, minHeight: 100 }} value={cfg.banDmTemplate} onChange={(e) => setCfg({ ...cfg, banDmTemplate: e.target.value })} placeholder="banDmTemplate" />
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Pre-Onboarding"}</button>
        {msg ? <span style={{ marginLeft: 12 }}>{msg}</span> : null}
      </div>
    </div>
  );
}
