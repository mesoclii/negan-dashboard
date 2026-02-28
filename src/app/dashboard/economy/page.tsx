"use client";

import { useEffect, useState } from "react";

type DashboardConfig = { features?: Record<string, boolean> };
type GiveawaysCfg = {
  enabled?: boolean;
  defaultChannelId?: string | null;
  channelId?: string | null;
  ticketChannelId?: string | null;
  defaultImageUrl?: string | null;
};

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

export default function EconomyPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [economyEnabled, setEconomyEnabled] = useState(false);
  const [birthdayEnabled, setBirthdayEnabled] = useState(false);

  const [giveaways, setGiveaways] = useState<GiveawaysCfg>({
    enabled: true,
    defaultChannelId: "",
    ticketChannelId: "",
    defaultImageUrl: ""
  });

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

        const [dcRes, gwRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=giveaways`)
        ]);

        const dcJson: { config?: DashboardConfig } = await dcRes.json();
        const gwJson: { config?: GiveawaysCfg } = await gwRes.json();

        const f = dcJson?.config?.features || {};
        setEconomyEnabled(!!f.economyEnabled);
        setBirthdayEnabled(!!f.birthdayEnabled);

        setGiveaways({
          enabled: gwJson?.config?.enabled !== false,
          defaultChannelId: gwJson?.config?.defaultChannelId || gwJson?.config?.channelId || "",
          ticketChannelId: gwJson?.config?.ticketChannelId || "",
          defaultImageUrl: gwJson?.config?.defaultImageUrl || ""
        });
      } catch {
        setMsg("Failed to load economy config.");
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
      const r1 = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            features: {
              economyEnabled,
              birthdayEnabled
            }
          }
        })
      });
      const j1 = await r1.json();
      if (!r1.ok || j1?.success === false) {
        throw new Error(j1?.error || "Failed saving economy features");
      }

      const r2 = await fetch("/api/bot/engine-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          engine: "giveaways",
          config: {
            enabled: giveaways.enabled !== false,
            defaultChannelId: (giveaways.defaultChannelId || "").trim() || null,
            ticketChannelId: (giveaways.ticketChannelId || "").trim() || null,
            defaultImageUrl: (giveaways.defaultImageUrl || "").trim() || null
          }
        })
      });
      const j2 = await r2.json();
      if (!r2.ok || j2?.success === false) {
        throw new Error(j2?.error || "Failed saving giveaways config");
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
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Economy Command</h1>
      <p>Guild: {guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 12px", color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Economy Features</h3>
            <label style={{ marginRight: 20 }}>
              <input type="checkbox" checked={economyEnabled} onChange={(e) => setEconomyEnabled(e.target.checked)} /> economyEnabled
            </label>
            <label>
              <input type="checkbox" checked={birthdayEnabled} onChange={(e) => setBirthdayEnabled(e.target.checked)} /> birthdayEnabled
            </label>
          </div>

          <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ margin: "0 0 12px", color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Giveaways Engine</h3>
            <label style={{ display: "block", marginBottom: 10 }}>
              <input
                type="checkbox"
                checked={giveaways.enabled !== false}
                onChange={(e) => setGiveaways((v) => ({ ...v, enabled: e.target.checked }))}
              /> giveaways.enabled
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input
                style={inputStyle}
                placeholder="defaultChannelId"
                value={String(giveaways.defaultChannelId || "")}
                onChange={(e) => setGiveaways((v) => ({ ...v, defaultChannelId: e.target.value }))}
              />
              <input
                style={inputStyle}
                placeholder="ticketChannelId"
                value={String(giveaways.ticketChannelId || "")}
                onChange={(e) => setGiveaways((v) => ({ ...v, ticketChannelId: e.target.value }))}
              />
            </div>

            <input
              style={inputStyle}
              placeholder="defaultImageUrl (supports image links)"
              value={String(giveaways.defaultImageUrl || "")}
              onChange={(e) => setGiveaways((v) => ({ ...v, defaultImageUrl: e.target.value }))}
            />
            <p style={{ opacity: 0.85, marginTop: 10 }}>
              Custom giveaway image links remain supported.
            </p>
          </div>

          <button onClick={saveAll} disabled={saving} style={{ ...inputStyle, width: 190, cursor: "pointer" }}>
            {saving ? "Saving..." : "Save Economy + Giveaways"}
          </button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
