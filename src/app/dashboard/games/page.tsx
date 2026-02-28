"use client";

import { useEffect, useState } from "react";

type DashboardConfig = { features?: Record<string, boolean> };

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
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

export default function GamesPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [rareDropEnabled, setRareDropEnabled] = useState(false);
  const [pokemonEnabled, setPokemonEnabled] = useState(false);

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
        const json: { config?: DashboardConfig } = await res.json();
        const f = json?.config?.features || {};
        setRareDropEnabled(!!f.rareDropEnabled);
        setPokemonEnabled(!!f.pokemonEnabled);
      } catch {
        setMsg("Failed to load games config.");
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
          patch: {
            features: {
              rareDropEnabled,
              pokemonEnabled
            }
          }
        })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) {
        throw new Error(j?.error || "Save failed");
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
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 980 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Games Command</h1>
      <p>Guild: {guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 12px", color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Live Toggles
            </h3>

            <label style={{ display: "block", marginBottom: 10 }}>
              <input type="checkbox" checked={rareDropEnabled} onChange={(e) => setRareDropEnabled(e.target.checked)} /> rareDropEnabled
            </label>
            <label style={{ display: "block", marginBottom: 10 }}>
              <input type="checkbox" checked={pokemonEnabled} onChange={(e) => setPokemonEnabled(e.target.checked)} /> pokemonEnabled
            </label>
          </div>

          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 12px", color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Detected Game Stack (Built-In)
            </h3>
            <p style={{ margin: 0 }}>Cat Drop Engine</p>
            <p style={{ margin: "6px 0 0" }}>Crew/Contracts Game Flow</p>
            <p style={{ margin: "6px 0 0" }}>XP/Progression Hooks</p>
            <p style={{ margin: "6px 0 0" }}>Heist remains in GTA Ops (separate page)</p>
          </div>

          <button onClick={save} disabled={saving} style={{ ...inputStyle, width: 180, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Games"}
          </button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
