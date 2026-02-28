"use client";

import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string };
type Channel = { id: string; name: string };

const DEFAULT_FEATURES = { heistEnabled: true };

const DEFAULT_HEIST = {
  enabled: true,
  queueChannelId: "",
  announcementChannelId: "",
  transcriptChannelId: "",
  hostRoleId: "",
  staffRoleIds: [] as string[],
  minCrewSize: 2,
  maxCrewSize: 6,
  signupTimeoutMinutes: 20,
  cooldownMinutes: 15,
  allowMultipleSessions: false,
  autoCloseOnTimeout: true,
  openTemplate: "Heist queue is OPEN. React to join.",
  closeTemplate: "Heist queue closed."
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

export default function HeistPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  const [features, setFeatures] = useState<any>(clone(DEFAULT_FEATURES));
  const [baseFeatures, setBaseFeatures] = useState<any>(clone(DEFAULT_FEATURES));

  const [cfg, setCfg] = useState<any>(clone(DEFAULT_HEIST));
  const [baseCfg, setBaseCfg] = useState<any>(clone(DEFAULT_HEIST));

  const roleOptions = useMemo(() => roles.map((r) => ({ id: r.id, name: `@${r.name}` })), [roles]);
  const channelOptions = useMemo(() => channels.map((c) => ({ id: c.id, name: `#${c.name}` })), [channels]);

  const featuresDirty = JSON.stringify(features) !== JSON.stringify(baseFeatures);
  const cfgDirty = JSON.stringify(cfg) !== JSON.stringify(baseCfg);
  const dirtyCount = Number(featuresDirty) + Number(cfgDirty);

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

        const [cfgRes, gdRes, heistRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=heist`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        const heistJson = await heistRes.json().catch(() => ({}));

        const mergedFeatures = { ...DEFAULT_FEATURES, ...(cfgJson?.config?.features || {}) };
        setFeatures(mergedFeatures);
        setBaseFeatures(clone(mergedFeatures));

        const mergedCfg = { ...DEFAULT_HEIST, ...(heistJson?.config || {}) };
        setCfg(mergedCfg);
        setBaseCfg(clone(mergedCfg));

        setRoles(Array.isArray(gdJson?.roles) ? gdJson.roles : []);
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed loading heist settings.");
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

  async function saveHeist() {
    const json = await saveEngine(guildId, "heist", cfg);
    const merged = { ...DEFAULT_HEIST, ...(json?.config || cfg) };
    setCfg(merged);
    setBaseCfg(clone(merged));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      if (featuresDirty) await saveFeatures();
      if (cfgDirty) await saveHeist();
      setMsg("GTA Ops settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId && !loading) return <div style={{ color: "#f87171", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  if (loading) return <div style={{ color: "#fecaca", padding: 20 }}>Loading GTA Ops settings...</div>;

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", color: "#fecaca" }}>
      <div style={{ ...cardStyle(), padding: 14, position: "sticky", top: 8, zIndex: 20, backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              GTA Ops / Heist
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
                setCfg(clone(baseCfg));
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
          <span style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>Engine Toggle</span>
          <Pill on={!!features.heistEnabled && !!cfg.enabled} />
        </summary>
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12 }}>
          <label style={labelStyle()}>
            <input type="checkbox" checked={!!features.heistEnabled} onChange={(e) => setFeatures((p: any) => ({ ...p, heistEnabled: e.target.checked }))} /> Feature Enabled
          </label>
          <label style={labelStyle()}>
            <input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg((p: any) => ({ ...p, enabled: e.target.checked }))} /> Engine Active
          </label>
          <label style={labelStyle()}>
            <input type="checkbox" checked={!!cfg.allowMultipleSessions} onChange={(e) => setCfg((p: any) => ({ ...p, allowMultipleSessions: e.target.checked }))} /> Allow Multiple Sessions
          </label>
          <label style={labelStyle()}>
            <input type="checkbox" checked={!!cfg.autoCloseOnTimeout} onChange={(e) => setCfg((p: any) => ({ ...p, autoCloseOnTimeout: e.target.checked }))} /> Auto Close On Timeout
          </label>
        </div>
      </details>

      <details open style={cardStyle()}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
          Channels & Staff
        </summary>
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12 }}>
          <div>
            <span style={labelStyle()}>Queue Channel</span>
            <select style={inputStyle()} value={cfg.queueChannelId || ""} onChange={(e) => setCfg((p: any) => ({ ...p, queueChannelId: e.target.value }))}>
              <option value="">Select channel</option>
              {channelOptions.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          </div>
          <div>
            <span style={labelStyle()}>Announcement Channel</span>
            <select style={inputStyle()} value={cfg.announcementChannelId || ""} onChange={(e) => setCfg((p: any) => ({ ...p, announcementChannelId: e.target.value }))}>
              <option value="">Select channel</option>
              {channelOptions.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          </div>
          <div>
            <span style={labelStyle()}>Transcript Channel</span>
            <select style={inputStyle()} value={cfg.transcriptChannelId || ""} onChange={(e) => setCfg((p: any) => ({ ...p, transcriptChannelId: e.target.value }))}>
              <option value="">Select channel</option>
              {channelOptions.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
            </select>
          </div>
          <div>
            <span style={labelStyle()}>Host Role</span>
            <select style={inputStyle()} value={cfg.hostRoleId || ""} onChange={(e) => setCfg((p: any) => ({ ...p, hostRoleId: e.target.value }))}>
              <option value="">Select role</option>
              {roleOptions.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle()}>Staff Roles (multi-select)</span>
            <select
              multiple
              value={Array.isArray(cfg.staffRoleIds) ? cfg.staffRoleIds : []}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                setCfg((p: any) => ({ ...p, staffRoleIds: vals }));
              }}
              style={{ ...inputStyle(), minHeight: 140 }}
            >
              {roleOptions.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.id})</option>)}
            </select>
          </div>
        </div>
      </details>

      <details open style={cardStyle()}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
          Queue Rules
        </summary>
        <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12 }}>
          <div><span style={labelStyle()}>Min Crew Size</span><input type="number" style={inputStyle()} value={Number(cfg.minCrewSize || 2)} onChange={(e) => setCfg((p: any) => ({ ...p, minCrewSize: Number(e.target.value || 2) }))} /></div>
          <div><span style={labelStyle()}>Max Crew Size</span><input type="number" style={inputStyle()} value={Number(cfg.maxCrewSize || 6)} onChange={(e) => setCfg((p: any) => ({ ...p, maxCrewSize: Number(e.target.value || 6) }))} /></div>
          <div><span style={labelStyle()}>Signup Timeout (minutes)</span><input type="number" style={inputStyle()} value={Number(cfg.signupTimeoutMinutes || 20)} onChange={(e) => setCfg((p: any) => ({ ...p, signupTimeoutMinutes: Number(e.target.value || 20) }))} /></div>
          <div><span style={labelStyle()}>Cooldown (minutes)</span><input type="number" style={inputStyle()} value={Number(cfg.cooldownMinutes || 15)} onChange={(e) => setCfg((p: any) => ({ ...p, cooldownMinutes: Number(e.target.value || 15) }))} /></div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle()}>Open Template</span>
            <textarea style={{ ...inputStyle(), minHeight: 70 }} value={String(cfg.openTemplate || "")} onChange={(e) => setCfg((p: any) => ({ ...p, openTemplate: e.target.value }))} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle()}>Close Template</span>
            <textarea style={{ ...inputStyle(), minHeight: 70 }} value={String(cfg.closeTemplate || "")} onChange={(e) => setCfg((p: any) => ({ ...p, closeTemplate: e.target.value }))} />
          </div>
        </div>
      </details>
    </div>
  );
}
