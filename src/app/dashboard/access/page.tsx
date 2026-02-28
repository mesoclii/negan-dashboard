"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string };
type GuildData = { channels?: Channel[] };

const DEFAULT_FEATURES = {
  ticketsEnabled: true,
  ttsEnabled: true,
  governanceEnabled: true
};

const DEFAULT_TTS = {
  enabled: true,
  allowedChannelIds: [] as string[],
  blockedChannelIds: [] as string[],
  cooldownSeconds: 2,
  defaultVoice: "en-US",
  announceInChannel: true,
  deleteTrigger: false,
  denyMessage: "TTS is not allowed in this channel."
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

export default function AccessPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [channels, setChannels] = useState<Channel[]>([]);

  const [features, setFeatures] = useState<any>(clone(DEFAULT_FEATURES));
  const [baseFeatures, setBaseFeatures] = useState<any>(clone(DEFAULT_FEATURES));

  const [ttsCfg, setTtsCfg] = useState<any>(clone(DEFAULT_TTS));
  const [baseTtsCfg, setBaseTtsCfg] = useState<any>(clone(DEFAULT_TTS));

  const channelsList = useMemo(
    () => channels.map((c) => ({ id: c.id, name: `#${c.name}` })),
    [channels]
  );

  const featuresDirty = JSON.stringify(features) !== JSON.stringify(baseFeatures);
  const ttsDirty = JSON.stringify(ttsCfg) !== JSON.stringify(baseTtsCfg);
  const dirtyCount = Number(featuresDirty) + Number(ttsDirty);

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

        const [cfgRes, gdRes, ttsRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=tts`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson: GuildData = await gdRes.json().catch(() => ({}));
        const ttsJson = await ttsRes.json().catch(() => ({}));

        const mergedFeatures = {
          ...DEFAULT_FEATURES,
          ...(cfgJson?.config?.features || {})
        };
        setFeatures(mergedFeatures);
        setBaseFeatures(clone(mergedFeatures));

        const mergedTts = {
          ...DEFAULT_TTS,
          ...(ttsJson?.config || {})
        };
        setTtsCfg(mergedTts);
        setBaseTtsCfg(clone(mergedTts));

        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed loading access settings.");
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

  async function saveTts() {
    const json = await saveEngine(guildId, "tts", ttsCfg);
    const merged = { ...DEFAULT_TTS, ...(json?.config || ttsCfg) };
    setTtsCfg(merged);
    setBaseTtsCfg(clone(merged));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      if (featuresDirty) await saveFeatures();
      if (ttsDirty) await saveTts();
      setMsg("Access settings saved.");
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
    return <div style={{ color: "#fecaca", padding: 20 }}>Loading access settings...</div>;
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", color: "#fecaca" }}>
      <div style={{ ...cardStyle(), padding: 14, position: "sticky", top: 8, zIndex: 20, backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Access Center
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
                setTtsCfg(clone(baseTtsCfg));
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
            Core Access Controls
          </span>
          <Pill on={!!features.ticketsEnabled || !!features.ttsEnabled || !!features.governanceEnabled} />
        </summary>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 12 }}>
            {[
              ["ticketsEnabled", "Ticketing"],
              ["ttsEnabled", "TTS"],
              ["governanceEnabled", "Governance"]
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
                  setMsg("Access core saved.");
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
              Save Core Access
            </button>
          </div>
        </div>
      </details>

      <details open style={cardStyle()}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
            TTS Engine Controls
          </span>
          <Pill on={!!ttsCfg.enabled} />
        </summary>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12 }}>
            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!ttsCfg.enabled}
                onChange={(e) => setTtsCfg((p: any) => ({ ...p, enabled: e.target.checked }))}
              />{" "}
              Engine Enabled
            </label>

            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!ttsCfg.announceInChannel}
                onChange={(e) => setTtsCfg((p: any) => ({ ...p, announceInChannel: e.target.checked }))}
              />{" "}
              Announce In Channel
            </label>

            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!ttsCfg.deleteTrigger}
                onChange={(e) => setTtsCfg((p: any) => ({ ...p, deleteTrigger: e.target.checked }))}
              />{" "}
              Delete Trigger Message
            </label>

            <div>
              <span style={labelStyle()}>Cooldown (seconds)</span>
              <input
                type="number"
                style={inputStyle()}
                value={Number(ttsCfg.cooldownSeconds || 0)}
                onChange={(e) => setTtsCfg((p: any) => ({ ...p, cooldownSeconds: Number(e.target.value || 0) }))}
              />
            </div>

            <div>
              <span style={labelStyle()}>Default Voice</span>
              <input
                style={inputStyle()}
                value={String(ttsCfg.defaultVoice || "")}
                onChange={(e) => setTtsCfg((p: any) => ({ ...p, defaultVoice: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={labelStyle()}>Allowed Channels</span>
            <select
              multiple
              value={Array.isArray(ttsCfg.allowedChannelIds) ? ttsCfg.allowedChannelIds : []}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                setTtsCfg((p: any) => ({ ...p, allowedChannelIds: vals }));
              }}
              style={{ ...inputStyle(), minHeight: 140 }}
            >
              {channelsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={labelStyle()}>Blocked Channels</span>
            <select
              multiple
              value={Array.isArray(ttsCfg.blockedChannelIds) ? ttsCfg.blockedChannelIds : []}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                setTtsCfg((p: any) => ({ ...p, blockedChannelIds: vals }));
              }}
              style={{ ...inputStyle(), minHeight: 140 }}
            >
              {channelsList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={labelStyle()}>Denied Message</span>
            <textarea
              style={{ ...inputStyle(), minHeight: 90 }}
              value={String(ttsCfg.denyMessage || "")}
              onChange={(e) => setTtsCfg((p: any) => ({ ...p, denyMessage: e.target.value }))}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={async () => {
                setSaving(true);
                setMsg("");
                try {
                  await saveTts();
                  setMsg("TTS settings saved.");
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
              Save TTS
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
