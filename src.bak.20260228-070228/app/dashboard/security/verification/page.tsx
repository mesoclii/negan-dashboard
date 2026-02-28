"use client";

import { useEffect, useState } from "react";

type VerifyCfg = {
  autoKickOnDecline: boolean;
  autoKickOnTimeout: boolean;
  declineKickReason: string;
  timeoutKickReason: string;
  declineReplyTemplate: string;
};

const DEFAULT_CFG: VerifyCfg = {
  autoKickOnDecline: true,
  autoKickOnTimeout: true,
  declineKickReason: "Declined ID verification",
  timeoutKickReason: "ID submission timeout",
  declineReplyTemplate: "You declined ID verification."
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const gid = (q || s).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function VerificationPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<VerifyCfg>(DEFAULT_CFG);
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
        const data = j?.config?.security?.verification || {};
        setCfg({
          autoKickOnDecline: Boolean(data.autoKickOnDecline ?? true),
          autoKickOnTimeout: Boolean(data.autoKickOnTimeout ?? true),
          declineKickReason: String(data.declineKickReason || DEFAULT_CFG.declineKickReason),
          timeoutKickReason: String(data.timeoutKickReason || DEFAULT_CFG.timeoutKickReason),
          declineReplyTemplate: String(data.declineReplyTemplate || DEFAULT_CFG.declineReplyTemplate)
        });
      } catch {
        setMsg("Failed to load verification config.");
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
          patch: { security: { verification: cfg } }
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
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Verification Config</h1>
      <p>Guild: {guildId}</p>

      <label><input type="checkbox" checked={cfg.autoKickOnDecline} onChange={(e) => setCfg({ ...cfg, autoKickOnDecline: e.target.checked })} /> autoKickOnDecline</label>
      <br />
      <label><input type="checkbox" checked={cfg.autoKickOnTimeout} onChange={(e) => setCfg({ ...cfg, autoKickOnTimeout: e.target.checked })} /> autoKickOnTimeout</label>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <input style={inputStyle} value={cfg.declineKickReason} onChange={(e) => setCfg({ ...cfg, declineKickReason: e.target.value })} placeholder="declineKickReason" />
        <input style={inputStyle} value={cfg.timeoutKickReason} onChange={(e) => setCfg({ ...cfg, timeoutKickReason: e.target.value })} placeholder="timeoutKickReason" />
      </div>

      <div style={{ marginTop: 10 }}>
        <textarea style={{ ...inputStyle, minHeight: 100 }} value={cfg.declineReplyTemplate} onChange={(e) => setCfg({ ...cfg, declineReplyTemplate: e.target.value })} placeholder="declineReplyTemplate" />
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Verification"}</button>
        {msg ? <span style={{ marginLeft: 12 }}>{msg}</span> : null}
      </div>
    </div>
  );
}
