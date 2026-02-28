"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string };

const DEFAULT_FEATURES = {
  economyEnabled: true,
  birthdayEnabled: true,
  giveawaysEnabled: true
};

const DEFAULT_GIVEAWAYS = {
  enabled: true,
  channelId: "",
  ticketChannelId: "",
  defaultImageUrl: "",
  winnerCount: 1,
  durationMinutes: 60,
  dmWinners: true,
  announcementTemplate: "Giveaway ended. Congratulations {{winners}}!"
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

async function saveEngine(guildId: string, engine: string, config: any) {
  const tries = [
    { guildId, engine, config },
    { guildId, engine, patch: config },
    { guildId, engine, data: config }
  ];

  for (const body of tries) {
    const r = await fetch("/api/bot/engine-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.success !== false) return j;
  }
  throw new Error("Failed to save engine config.");
}

export default function EconomyPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [channels, setChannels] = useState<Channel[]>([]);

  const [features, setFeatures] = useState<any>(clone(DEFAULT_FEATURES));
  const [baseFeatures, setBaseFeatures] = useState<any>(clone(DEFAULT_FEATURES));

  const [giveCfg, setGiveCfg] = useState<any>(clone(DEFAULT_GIVEAWAYS));
  const [baseGiveCfg, setBaseGiveCfg] = useState<any>(clone(DEFAULT_GIVEAWAYS));

  const channelOptions = useMemo(
    () => channels.map((c) => ({ id: c.id, name: `#${c.name}` })),
    [channels]
  );

  const featuresDirty = JSON.stringify(features) !== JSON.stringify(baseFeatures);
  const giveDirty = JSON.stringify(giveCfg) !== JSON.stringify(baseGiveCfg);
  const dirtyCount = Number(featuresDirty) + Number(giveDirty);

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

        const [cfgRes, gdRes, giveRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=giveaways`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        const giveJson = await giveRes.json().catch(() => ({}));

        const mergedFeatures = { ...DEFAULT_FEATURES, ...(cfgJson?.config?.features || {}) };
        setFeatures(mergedFeatures);
        setBaseFeatures(clone(mergedFeatures));

        const mergedGive = { ...DEFAULT_GIVEAWAYS, ...(giveJson?.config || {}) };
        setGiveCfg(mergedGive);
        setBaseGiveCfg(clone(mergedGive));

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
    const merged = { ...DEFAULT_FEATURES, ...(json?.config?.features || {}) };
    setFeatures(merged);
    setBaseFeatures(clone(merged));
  }

  async function saveGiveaways() {
    const json = await saveEngine(guildId, "giveaways", giveCfg);
    const merged = { ...DEFAULT_GIVEAWAYS, ...(json?.config || giveCfg) };
    setGiveCfg(merged);
    setBaseGiveCfg(clone(merged));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      if (featuresDirty) await saveFeatures();
      if (giveDirty) await saveGiveaways();
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
                border: dirtyCount ? "1px solid rgba(245,158,11,.6)" : "1px solid rgba(148,163,184,.45)",
                background: dirtyCount ? "rgba(245,158,11,.14)" : "rgba(148,163,184,.12)",
                color: dirtyCount ? "#fcd34d" : "#cbd5e1"
              }}
            >
              {dirtyCount ? `${dirtyCount} UNSAVED` : "ALL SAVED"}
            </span>

            <button
              onClick={() => {
                setFeatures(clone(baseFeatures));
                setGiveCfg(clone(baseGiveCfg));
                setMsg("Reverted unsaved changes.");
              }}
              disabled={saving || !dirtyCount}
              style={{ ...inputStyle(), width: "auto", padding: "8px 12px", cursor: "pointer" }}
            >
              Revert
            </button>

            <button
              onClick={saveAll}
              disabled={saving || !dirtyCount}
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

      <details open style={cardStyle()}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
            Economy Modules
          </span>
          <Pill on={!!features.economyEnabled || !!features.birthdayEnabled || !!features.giveawaysEnabled} />
        </summary>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 12 }}>
            {[
              ["economyEnabled", "Economy"],
              ["birthdayEnabled", "Birthdays"],
              ["giveawaysEnabled", "Giveaways"]
            ].map(([k, label]) => (
              <label key={k} style={{ ...labelStyle(), marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={!!features[k]}
                  onChange={(e) => setFeatures((p: any) => ({ ...p, [k]: e.target.checked }))}
                />{" "}
                {label}
              </label>
            ))}
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

      <details open style={cardStyle()}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
            Giveaways Engine
          </span>
          <Pill on={!!giveCfg.enabled} />
        </summary>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12 }}>
            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!giveCfg.enabled}
                onChange={(e) => setGiveCfg((p: any) => ({ ...p, enabled: e.target.checked }))}
              />{" "}
              Engine Enabled
            </label>

            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!giveCfg.dmWinners}
                onChange={(e) => setGiveCfg((p: any) => ({ ...p, dmWinners: e.target.checked }))}
              />{" "}
              DM Winners
            </label>

            <div>
              <span style={labelStyle()}>Giveaway Channel</span>
              <select
                value={String(giveCfg.channelId || "")}
                onChange={(e) => setGiveCfg((p: any) => ({ ...p, channelId: e.target.value }))}
                style={inputStyle()}
              >
                <option value="">Select channel</option>
                {channelOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span style={labelStyle()}>Ticket Channel</span>
              <select
                value={String(giveCfg.ticketChannelId || "")}
                onChange={(e) => setGiveCfg((p: any) => ({ ...p, ticketChannelId: e.target.value }))}
                style={inputStyle()}
              >
                <option value="">Select channel</option>
                {channelOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span style={labelStyle()}>Winner Count</span>
              <input
                type="number"
                style={inputStyle()}
                value={Number(giveCfg.winnerCount || 1)}
                onChange={(e) => setGiveCfg((p: any) => ({ ...p, winnerCount: Number(e.target.value || 1) }))}
              />
            </div>

            <div>
              <span style={labelStyle()}>Duration (minutes)</span>
              <input
                type="number"
                style={inputStyle()}
                value={Number(giveCfg.durationMinutes || 60)}
                onChange={(e) => setGiveCfg((p: any) => ({ ...p, durationMinutes: Number(e.target.value || 60) }))}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={labelStyle()}>Default Image URL</span>
            <input
              style={inputStyle()}
              value={String(giveCfg.defaultImageUrl || "")}
              onChange={(e) => setGiveCfg((p: any) => ({ ...p, defaultImageUrl: e.target.value }))}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={labelStyle()}>Announcement Template</span>
            <textarea
              style={{ ...inputStyle(), minHeight: 90 }}
              value={String(giveCfg.announcementTemplate || "")}
              onChange={(e) => setGiveCfg((p: any) => ({ ...p, announcementTemplate: e.target.value }))}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={async () => {
                setSaving(true);
                setMsg("");
                try {
                  await saveGiveaways();
                  setMsg("Giveaway settings saved.");
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
              Save Giveaways
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
