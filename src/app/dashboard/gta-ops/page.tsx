"use client";

import { useEffect, useState } from "react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid #7a0000",
  background: "#0b0b0b",
  color: "#ffd2d2"
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

export default function GtaOpsPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [heistEnabled, setHeistEnabled] = useState(false);

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
        const f = json?.config?.features || {};
        setHeistEnabled(!!f.heistEnabled);
      } catch {
        setMsg("Failed to load GTA Ops config.");
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
      const res = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            features: {
              heistEnabled
            }
          }
        })
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
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
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 980 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>GTA Ops Command</h1>
      <p>Guild: {guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ marginTop: 0 }}>Heist Engine</h3>
            <label>
              <input
                type="checkbox"
                checked={heistEnabled}
                onChange={(e) => setHeistEnabled(e.target.checked)}
              /> heistEnabled
            </label>
            <p style={{ marginTop: 10, opacity: 0.9 }}>
              This toggle controls whether heist engine runs for this guild.
            </p>
          </div>

          <button onClick={save} disabled={saving} style={{ ...inputStyle, width: 180, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save GTA Ops"}
          </button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
