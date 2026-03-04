"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string };

type FeaturesConfig = {
  economyEnabled: boolean;
  birthdayEnabled: boolean;
  giveawaysEnabled: boolean;
};

const DEFAULT_FEATURES: FeaturesConfig = {
  economyEnabled: true,
  birthdayEnabled: true,
  giveawaysEnabled: true
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function getGuildIdClient(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(255,0,0,.28)",
    borderRadius: 12,
    background: "rgba(85,0,0,.10)",
    marginBottom: 14
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: "#0a0a0a",
    border: "1px solid rgba(255,0,0,.35)",
    color: "#ffd1d1",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "block",
    marginBottom: 6,
    color: "#fca5a5",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  };
}

function Pill({ on }: { on: boolean }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.08em",
        border: on ? "1px solid rgba(16,185,129,.6)" : "1px solid rgba(239,68,68,.6)",
        background: on ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
        color: on ? "#86efac" : "#fca5a5"
      }}
    >
      {on ? "ON" : "OFF"}
    </span>
  );
}

export default function EconomyPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [_channels, setChannels] = useState<Channel[]>([]);

  const [features, setFeatures] = useState<FeaturesConfig>(clone(DEFAULT_FEATURES));
  const [baseFeatures, setBaseFeatures] = useState<FeaturesConfig>(clone(DEFAULT_FEATURES));

  const featuresDirty = useMemo(
    () => JSON.stringify(features) !== JSON.stringify(baseFeatures),
    [features, baseFeatures]
  );

  useEffect(() => {
    setGuildId(getGuildIdClient());
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

        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));

        const mergedFeatures = {
          ...DEFAULT_FEATURES,
          ...(cfgJson?.config?.features || {})
        } as FeaturesConfig;

        setFeatures(mergedFeatures);
        setBaseFeatures(clone(mergedFeatures));
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed loading economy settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveFeatures() {
    const res = await fetch("/api/bot/dashboard-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch: { features } })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) throw new Error(json?.error || "Feature save failed");

    const merged = {
      ...DEFAULT_FEATURES,
      ...(json?.config?.features || features)
    } as FeaturesConfig;

    setFeatures(merged);
    setBaseFeatures(clone(merged));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      if (featuresDirty) await saveFeatures();
      setMsg("Economy settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId && !loading) {
    return <div style={{ color: "#f87171", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  }

  if (loading) {
    return <div style={{ color: "#fecaca", padding: 20 }}>Loading economy settings...</div>;
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", color: "#fecaca" }}>
      <div style={{ ...cardStyle(), padding: 14, position: "sticky", top: 8, zIndex: 20, backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Economy Center
            </div>
            <div style={{ color: "#fca5a5", marginTop: 4, fontSize: 13 }}>Guild: {guildId}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.08em",
                border: featuresDirty ? "1px solid rgba(245,158,11,.6)" : "1px solid rgba(148,163,184,.45)",
                background: featuresDirty ? "rgba(245,158,11,.14)" : "rgba(148,163,184,.12)",
                color: featuresDirty ? "#fcd34d" : "#cbd5e1"
              }}
            >
              {featuresDirty ? "UNSAVED" : "ALL SAVED"}
            </span>

            <button
              onClick={() => {
                setFeatures(clone(baseFeatures));
                setMsg("Reverted unsaved changes.");
              }}
              disabled={saving || !featuresDirty}
              style={{ ...inputStyle, width: "auto", padding: "8px 12px", cursor: "pointer" }}
            >
              Revert
            </button>

            <button
              onClick={saveAll}
              disabled={saving || !featuresDirty}
              style={{
                border: "1px solid rgba(255,0,0,.75)",
                borderRadius: 10,
                background: "rgba(255,0,0,.2)",
                color: "#fff",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontSize: 12,
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
        {msg ? <div style={{ marginTop: 8, color: "#fcd34d", fontSize: 12 }}>{msg}</div> : null}
      </div>

      <details open style={cardStyle}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
            Economy Modules
          </span>
          <Pill on={!!features.economyEnabled || !!features.birthdayEnabled} />
        </summary>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(220px,1fr))", gap: 12 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              <input
                type="checkbox"
                checked={!!features.economyEnabled}
                onChange={(e) => setFeatures((p) => ({ ...p, economyEnabled: e.target.checked }))}
              />{" "}
              Economy Enabled
            </label>

            <label style={{ ...labelStyle, marginBottom: 0 }}>
              <input
                type="checkbox"
                checked={!!features.birthdayEnabled}
                onChange={(e) => setFeatures((p) => ({ ...p, birthdayEnabled: e.target.checked }))}
              />{" "}
              Birthdays Enabled
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={async () => {
                setSaving(true);
                setMsg("");
                try {
                  await saveFeatures();
                  setMsg("Economy module toggles saved.");
                } catch (e: any) {
                  setMsg(e?.message || "Save failed.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              style={{
                border: "1px solid rgba(255,0,0,.55)",
                borderRadius: 10,
                background: "rgba(255,0,0,.12)",
                color: "#fff",
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Save Economy Modules
            </button>
          </div>
        </div>
      </details>

      <div style={{ ...cardStyle(), padding: 14 }}>
        <h3 style={{ margin: "0 0 10px", color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
          Economy Engines
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(240px,1fr))", gap: 10 }}>
          <Link href={`/dashboard/economy/store?guildId=${encodeURIComponent(guildId)}`} style={{ ...inputStyle, textDecoration: "none" }}>
            Store Engine
          </Link>
          <Link href={`/dashboard/economy/progression?guildId=${encodeURIComponent(guildId)}`} style={{ ...inputStyle, textDecoration: "none" }}>
            Progression Engine
          </Link>
          <Link href={`/dashboard/economy/leaderboard?guildId=${encodeURIComponent(guildId)}`} style={{ ...inputStyle, textDecoration: "none" }}>
            Leaderboard Engine
          </Link>
          <Link href={`/dashboard/economy/radio-birthday?guildId=${encodeURIComponent(guildId)}`} style={{ ...inputStyle, textDecoration: "none" }}>
            Birthday / Radio Engine
          </Link>
        </div>
      </div>

      <div style={{ ...cardStyle(), padding: 14 }}>
        <h3 style={{ margin: "0 0 10px", color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
          Separate Giveaways Entity
        </h3>
        <p style={{ color: "#fca5a5", fontSize: 13, marginTop: 0 }}>
          Giveaways are managed on their own page and are not mixed into Economy controls.
        </p>
        <Link href={`/dashboard/giveaways?guildId=${encodeURIComponent(guildId)}`} style={{ ...inputStyle, textDecoration: "none", display: "inline-block", width: "auto", fontWeight: 800 }}>
          Open Giveaways Engine
        </Link>
      </div>
    </div>
  );
}
