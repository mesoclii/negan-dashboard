"use client";

import { useEffect, useState } from "react";

type PersonaCfg = {
  guildNickname: string;
  webhookName: string;
  webhookAvatarUrl: string;
  useWebhookPersona: boolean;
};

const DEFAULT_PERSONA: PersonaCfg = {
  guildNickname: "",
  webhookName: "",
  webhookAvatarUrl: "",
  useWebhookPersona: false
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function AiPersonaPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [aiEnabled, setAiEnabled] = useState(false);
  const [persona, setPersona] = useState<PersonaCfg>(DEFAULT_PERSONA);

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
        const data = await res.json();

        setAiEnabled(Boolean(data?.config?.features?.aiEnabled));
        setPersona({ ...DEFAULT_PERSONA, ...(data?.config?.persona || {}) });
      } catch {
        setMsg("Failed to load AI Personas config.");
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
            features: { aiEnabled },
            persona
          }
        })
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.error || "Save failed");
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

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 1000 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>AI Personas Engine</h1>
      <p>Guild: {guildId}</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Engine Toggle</h3>
            <label><input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} /> aiEnabled</label>
          </div>

          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Persona Engine Config</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input style={inputStyle} value={persona.guildNickname} onChange={(e) => setPersona({ ...persona, guildNickname: e.target.value })} placeholder="guildNickname" />
              <input style={inputStyle} value={persona.webhookName} onChange={(e) => setPersona({ ...persona, webhookName: e.target.value })} placeholder="webhookName" />
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={inputStyle} value={persona.webhookAvatarUrl} onChange={(e) => setPersona({ ...persona, webhookAvatarUrl: e.target.value })} placeholder="webhookAvatarUrl" />
            </div>
            <div style={{ marginTop: 10 }}>
              <label><input type="checkbox" checked={persona.useWebhookPersona} onChange={(e) => setPersona({ ...persona, useWebhookPersona: e.target.checked })} /> useWebhookPersona</label>
            </div>
          </div>

          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Character Studio (Next)</h3>
            <p style={{ margin: 0 }}>Next chunk adds create/list/edit AI characters directly from dashboard.</p>
          </div>

          <div style={{ marginTop: 16 }}>
            <button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save AI Personas"}</button>
            {msg ? <span style={{ marginLeft: 12 }}>{msg}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}
