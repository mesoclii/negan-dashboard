"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Features = Record<string, boolean>;

const FEATURE_KEYS: Array<{ key: string; label: string; group: string }> = [
  { key: "securityEnabled", label: "Security Core", group: "Security" },
  { key: "onboardingEnabled", label: "Pre-Onboarding / Onboarding", group: "Security" },
  { key: "verificationEnabled", label: "Verification", group: "Security" },
  { key: "lockdownEnabled", label: "Lockdown", group: "Security" },
  { key: "raidEnabled", label: "Raid", group: "Security" },

  { key: "ticketsEnabled", label: "Tickets", group: "Access" },
  { key: "ttsEnabled", label: "TTS", group: "Access" },
  { key: "governanceEnabled", label: "Governance", group: "Access" },

  { key: "economyEnabled", label: "Economy", group: "Economy" },
  { key: "birthdayEnabled", label: "Birthdays", group: "Economy" },
  { key: "giveawaysEnabled", label: "Giveaways", group: "Economy" },

  { key: "rareDropEnabled", label: "Rare Drop", group: "Games" },
  { key: "catdropEnabled", label: "Cat Drop", group: "Games" },
  { key: "pokemonEnabled", label: "Pokemon", group: "Games" },
  { key: "pokemonPrivateOnly", label: "Pokemon Private-Only", group: "Games" },
  { key: "crewEnabled", label: "Crew", group: "Games" },
  { key: "contractsEnabled", label: "Contracts", group: "Games" },
  { key: "progressionEnabled", label: "Progression", group: "Games" },

  { key: "heistEnabled", label: "Heist", group: "GTA Ops" },
  { key: "aiEnabled", label: "AI Personas", group: "AI" }
];

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function withGuild(path: string, guildId: string) {
  if (!guildId) return path;
  const glue = path.includes("?") ? "&" : "?";
  return `${path}${glue}guildId=${encodeURIComponent(guildId)}`;
}

function card(): React.CSSProperties {
  return {
    border: "1px solid rgba(255,0,0,0.35)",
    borderRadius: 12,
    padding: 14,
    background: "rgba(45,0,0,0.25)"
  };
}

function input(): React.CSSProperties {
  return {
    width: "100%",
    background: "#090909",
    color: "#ffd9d9",
    border: "1px solid rgba(255,0,0,0.45)",
    borderRadius: 8,
    padding: "10px 12px"
  };
}

function btn(): React.CSSProperties {
  return {
    border: "1px solid rgba(255,0,0,0.45)",
    background: "transparent",
    color: "#ffd0d0",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 900
  };
}

export default function ControlCenterPage() {
  const [guildId, setGuildId] = useState("");
  const [features, setFeatures] = useState<Features>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

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
        setFeatures(j?.config?.features || {});
      } catch (e: any) {
        setMsg(e?.message || "Failed to load control center");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveFeature(key: string, value: boolean) {
    try {
      setSaving(true);
      setMsg("");
      const r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { features: { [key]: value } } })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setFeatures((p) => ({ ...p, [key]: value }));
      setMsg(`${key} updated.`);
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAll() {
    try {
      setSaving(true);
      setMsg("");
      const r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { features } })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save all failed");
      setMsg("All toggles saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save all failed");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  if (loading) return <div style={{ color: "#ff6b6b", padding: 24 }}>Loading control center…</div>;

  const groups = Array.from(new Set(FEATURE_KEYS.map((f) => f.group)));

  return (
    <div style={{ color: "#ff5252", padding: 18 }}>
      <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 20 }}>Control Center</h1>
      <div style={{ marginTop: 6 }}>Quick toggles (deep config still lives in each module page).</div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={saveAll} disabled={saving} style={btn()}>
          {saving ? "Saving..." : "Save All"}
        </button>
        <Link href={withGuild("/dashboard/setup", guildId)} style={{ ...btn(), textDecoration: "none" }}>
          Setup
        </Link>
      </div>

      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {groups.map((g) => (
          <div key={g} style={card()}>
            <div style={{ fontWeight: 900, fontSize: 20 }}>{g}</div>
            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {FEATURE_KEYS.filter((f) => f.group === g).map((f) => (
                <div key={f.key} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                  <div>{f.label}</div>
                  <button
                    style={btn()}
                    disabled={saving}
                    onClick={() => {
                      const v = !features[f.key];
                      setFeatures((p) => ({ ...p, [f.key]: v }));
                    }}
                  >
                    {features[f.key] ? "Enabled" : "Disabled"}
                  </button>
                  <button
                    style={btn()}
                    disabled={saving}
                    onClick={() => saveFeature(f.key, !features[f.key])}
                  >
                    Quick Save
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10 }}>
              {g === "Security" && <Link href={withGuild("/dashboard/security", guildId)} style={{ color: "#ffb0b0" }}>Open Security</Link>}
              {g === "Access" && <Link href={withGuild("/dashboard/access", guildId)} style={{ color: "#ffb0b0" }}>Open Access</Link>}
              {g === "Economy" && <Link href={withGuild("/dashboard/economy", guildId)} style={{ color: "#ffb0b0" }}>Open Economy</Link>}
              {g === "Games" && <Link href={withGuild("/dashboard/games", guildId)} style={{ color: "#ffb0b0" }}>Open Games</Link>}
              {g === "GTA Ops" && <Link href={withGuild("/dashboard/heist", guildId)} style={{ color: "#ffb0b0" }}>Open GTA Ops</Link>}
              {g === "AI" && <Link href={withGuild("/dashboard/ai", guildId)} style={{ color: "#ffb0b0" }}>Open AI Personas</Link>}
            </div>
          </div>
        ))}
      </div>

      {msg ? <div style={{ marginTop: 10, color: "#ffb3b3" }}>{msg}</div> : null}
    </div>
  );
}
