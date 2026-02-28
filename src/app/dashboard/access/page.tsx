"use client";

import { useEffect, useState } from "react";

type Features = {
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
  ticketsEnabled: boolean;
  ttsEnabled: boolean;
  governanceEnabled: boolean;
  aiEnabled: boolean;
};

const DEFAULT: Features = {
  onboardingEnabled: false,
  verificationEnabled: false,
  ticketsEnabled: false,
  ttsEnabled: false,
  governanceEnabled: false,
  aiEnabled: false
};

export default function AccessPage() {
  const [guildId, setGuildId] = useState("");
  const [f, setF] = useState<Features>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("guildId") || "";
    const s = localStorage.getItem("activeGuildId") || "";
    const gid = q || s || "";
    setGuildId(gid);
    if (gid) localStorage.setItem("activeGuildId", gid);
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
        if (!r.ok || j?.success === false) throw new Error(j?.error || "Load failed");
        const src = j?.config?.features || {};
        setF({
          onboardingEnabled: !!src.onboardingEnabled,
          verificationEnabled: !!src.verificationEnabled,
          ticketsEnabled: !!src.ticketsEnabled,
          ttsEnabled: !!src.ttsEnabled,
          governanceEnabled: !!src.governanceEnabled,
          aiEnabled: !!src.aiEnabled
        });
      } catch (e: any) {
        setMsg(e?.message || "Load failed");
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
        body: JSON.stringify({ guildId, patch: { features: f } })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Access settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const box: React.CSSProperties = {
    border: "1px solid #6f0000",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    background: "rgba(120,0,0,0.08)"
  };

  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 980 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Access Control</h1>
      <p>Guild: {guildId || "None selected"}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={box}>
            <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Core Access Toggles</h3>
            {Object.keys(f).map((k) => (
              <label key={k} style={{ display: "block", marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={(f as any)[k]}
                  onChange={(e) => setF((p) => ({ ...p, [k]: e.target.checked }))}
                />{" "}
                {k}
              </label>
            ))}
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick Links</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <a href={`/dashboard/security/onboarding?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#ff9d9d" }}>Onboarding Config</a>
              <a href={`/dashboard/security/verification?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#ff9d9d" }}>Verification Config</a>
              <a href={`/dashboard/ai/persona?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#ff9d9d" }}>AI Personas Engine</a>
            </div>
          </div>

          <button onClick={save} disabled={saving} style={{ padding: "10px 16px" }}>
            {saving ? "Saving..." : "Save Access"}
          </button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
