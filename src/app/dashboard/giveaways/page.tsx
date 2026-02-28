"use client";

import { useEffect, useMemo, useState } from "react";

type GuildChannel = {
  id: string;
  name: string;
  type?: number;
  parentId?: string | null;
};

type GiveawaysConfig = {
  channelId: string;
  ticketChannelId: string;
  defaultImageUrl: string;
};

const EMPTY_CFG: GiveawaysConfig = {
  channelId: "",
  ticketChannelId: "",
  defaultImageUrl: ""
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: 10,
    background: "#0d0d0d",
    border: "1px solid #7a0000",
    color: "#ffd2d2",
    borderRadius: 8
  };
}

export default function GiveawaysPage() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [cfg, setCfg] = useState<GiveawaysConfig>(EMPTY_CFG);
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
      setLoading(true);
      setMsg("");

      try {
        const [guildRes, configRes] = await Promise.all([
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const guildData = await guildRes.json();
        const dashData = await configRes.json();

        const rawChannels: GuildChannel[] = Array.isArray(guildData?.channels) ? guildData.channels : [];
        const textChannels = rawChannels.filter((c) => [0, 5].includes(Number(c.type)));
        setChannels(textChannels);
        setGuildName(String(guildData?.guild?.name || guildId));

        const g = dashData?.config?.giveaways || {};
        setCfg({
          channelId: String(g.channelId || ""),
          ticketChannelId: String(g.ticketChannelId || ""),
          defaultImageUrl: String(g.defaultImageUrl || "")
        });
      } catch {
        setMsg("Failed to load giveaways settings.");
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
            giveaways: {
              channelId: cfg.channelId || null,
              ticketChannelId: cfg.ticketChannelId || null,
              defaultImageUrl: String(cfg.defaultImageUrl || "").trim()
            }
          }
        })
      });

      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Save failed");
      }

      setMsg("Giveaways settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const imagePreview = useMemo(() => String(cfg.defaultImageUrl || "").trim(), [cfg.defaultImageUrl]);

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 1100 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Giveaways Control</h1>
      <p style={{ marginBottom: 16 }}>Guild: <strong>{guildName}</strong> ({guildId})</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div style={{ border: "1px solid #7a0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Core Settings</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label>Default Giveaway Channel</label>
                <select
                  value={cfg.channelId}
                  onChange={(e) => setCfg((p) => ({ ...p, channelId: e.target.value }))}
                  style={inputStyle()}
                >
                  <option value="">Select channel</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Winner Claim Ticket Channel</label>
                <select
                  value={cfg.ticketChannelId}
                  onChange={(e) => setCfg((p) => ({ ...p, ticketChannelId: e.target.value }))}
                  style={inputStyle()}
                >
                  <option value="">Select channel</option>
                  {channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label>Default Giveaway Image URL</label>
              <input
                value={cfg.defaultImageUrl}
                onChange={(e) => setCfg((p) => ({ ...p, defaultImageUrl: e.target.value }))}
                placeholder="https://..."
                style={inputStyle()}
              />
            </div>

            <details style={{ marginTop: 8 }}>
              <summary style={{ cursor: "pointer" }}>Advanced IDs</summary>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <input
                  value={cfg.channelId}
                  onChange={(e) => setCfg((p) => ({ ...p, channelId: e.target.value.trim() }))}
                  placeholder="channelId"
                  style={inputStyle()}
                />
                <input
                  value={cfg.ticketChannelId}
                  onChange={(e) => setCfg((p) => ({ ...p, ticketChannelId: e.target.value.trim() }))}
                  placeholder="ticketChannelId"
                  style={inputStyle()}
                />
              </div>
            </details>

            <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #ff2a2a",
                  background: "#1a0000",
                  color: "#ffd2d2",
                  cursor: "pointer"
                }}
              >
                {saving ? "Saving..." : "Save Giveaways Settings"}
              </button>
              {msg ? <span>{msg}</span> : null}
            </div>
          </div>

          <div style={{ border: "1px solid #7a0000", borderRadius: 12, padding: 16, background: "rgba(120,0,0,0.05)" }}>
            <h3 style={{ marginTop: 0, marginBottom: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>Image Preview</h3>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Giveaway preview"
                style={{ maxWidth: "100%", maxHeight: 280, borderRadius: 8, border: "1px solid #7a0000" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <p>No default image set.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
