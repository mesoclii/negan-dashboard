"use client";

import { useEffect, useMemo, useState } from "react";

type TtsConfig = {
  active: boolean;
  enabled: boolean;
  commandEnabled: boolean;
  maxCharsPerMessage: number;
  cooldownSeconds: number;
  allowedChannelIds: string[];
  blockedChannelIds: string[];
  allowedRoleIds: string[];
  voiceChannelOnly: boolean;
  requirePrefix: boolean;
  prefix: string;
};

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number | string };

const DEFAULT_CONFIG: TtsConfig = {
  active: false,
  enabled: false,
  commandEnabled: true,
  maxCharsPerMessage: 300,
  cooldownSeconds: 5,
  allowedChannelIds: [],
  blockedChannelIds: [],
  allowedRoleIds: [],
  voiceChannelOnly: false,
  requirePrefix: true,
  prefix: "??",
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function toCsv(v: string[]) {
  return (v || []).join(", ");
}
function fromCsv(v: string) {
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

const shell: React.CSSProperties = { color: "#ff5959", maxWidth: 1200, padding: 16 };
const card: React.CSSProperties = {
  border: "1px solid #5a0000",
  borderRadius: 12,
  padding: 16,
  background: "rgba(90,0,0,0.12)",
  marginBottom: 14,
};
const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: "#0b0b0b",
  color: "#ffd1d1",
  border: "1px solid #6f0000",
  borderRadius: 8,
};
const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };

function toggle(list: string[], id: string) {
  const set = new Set(list || []);
  if (set.has(id)) set.delete(id); else set.add(id);
  return Array.from(set);
}

export default function TtsAccessPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<TtsConfig>(DEFAULT_CONFIG);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
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
      try {
        setLoading(true);
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/tts-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        if (!cfgRes.ok || cfgJson?.success === false) throw new Error(cfgJson?.error || "Failed to load TTS config");
        setCfg({ ...DEFAULT_CONFIG, ...(cfgJson?.config || {}) });
        const roleList: Role[] = Array.isArray(gdJson?.roles) ? gdJson.roles : [];
        roleList.sort((a, b) => (Number(b.position || 0) - Number(a.position || 0)) || a.name.localeCompare(b.name));
        setRoles(roleList);
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textAndVoice = useMemo(() => channels.filter((c) => [0, 2, 5].includes(Number(c?.type)) || String(c?.type || "").toLowerCase().includes("text")), [channels]);

  async function save(next?: Partial<TtsConfig>) {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const patch = { ...cfg, ...(next || {}) };
      const r = await fetch("/api/setup/tts-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch }),
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...DEFAULT_CONFIG, ...(j?.config || patch) });
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={shell}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>TTS Control</h1>
      <p>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      {msg ? <p style={{ color: "#ffd27a" }}>{msg}</p> : null}

      {loading ? <p>Loading...</p> : (
        <>
          <div style={card}>
            <div style={{ ...row2, marginBottom: 10 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Feature Active (dashboard toggle)</label>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine Enabled</label>
              <label><input type="checkbox" checked={cfg.commandEnabled} onChange={(e) => setCfg({ ...cfg, commandEnabled: e.target.checked })} /> Command Enabled</label>
              <label><input type="checkbox" checked={cfg.voiceChannelOnly} onChange={(e) => setCfg({ ...cfg, voiceChannelOnly: e.target.checked })} /> Voice Channel Only</label>
              <label><input type="checkbox" checked={cfg.requirePrefix} onChange={(e) => setCfg({ ...cfg, requirePrefix: e.target.checked })} /> Require Prefix</label>
            </div>

            <div style={row2}>
              <input style={input} type="number" value={cfg.maxCharsPerMessage} onChange={(e) => setCfg({ ...cfg, maxCharsPerMessage: Number(e.target.value || 0) })} placeholder="Max chars per message" />
              <input style={input} type="number" value={cfg.cooldownSeconds} onChange={(e) => setCfg({ ...cfg, cooldownSeconds: Number(e.target.value || 0) })} placeholder="Cooldown seconds" />
            </div>

            <div style={{ marginTop: 10 }}>
              <input style={input} value={cfg.prefix} onChange={(e) => setCfg({ ...cfg, prefix: e.target.value })} placeholder="Command prefix for TTS" />
            </div>
          </div>

          <div style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Allowed Channels</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                  {textAndVoice.map((c) => {
                    const selected = cfg.allowedChannelIds.includes(c.id);
                    return (
                      <label key={`allow_${c.id}`} style={{ display: "block", marginBottom: 4 }}>
                        <input type="checkbox" checked={selected} onChange={() => setCfg((p) => ({ ...p, allowedChannelIds: toggle(p.allowedChannelIds, c.id) }))} /> #{c.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Allowed channel IDs (comma-separated)</div>
                <input style={input} value={toCsv(cfg.allowedChannelIds)} onChange={(e) => setCfg({ ...cfg, allowedChannelIds: fromCsv(e.target.value) })} />
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Blocked Channels</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                  {textAndVoice.map((c) => {
                    const selected = cfg.blockedChannelIds.includes(c.id);
                    return (
                      <label key={`block_${c.id}`} style={{ display: "block", marginBottom: 4 }}>
                        <input type="checkbox" checked={selected} onChange={() => setCfg((p) => ({ ...p, blockedChannelIds: toggle(p.blockedChannelIds, c.id) }))} /> #{c.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Blocked channel IDs (comma-separated)</div>
                <input style={input} value={toCsv(cfg.blockedChannelIds)} onChange={(e) => setCfg({ ...cfg, blockedChannelIds: fromCsv(e.target.value) })} />
              </div>
            </div>
          </div>

          <div style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Allowed Roles</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                  {roles.map((r) => {
                    const selected = cfg.allowedRoleIds.includes(r.id);
                    return (
                      <label key={`role_${r.id}`} style={{ display: "block", marginBottom: 4 }}>
                        <input type="checkbox" checked={selected} onChange={() => setCfg((p) => ({ ...p, allowedRoleIds: toggle(p.allowedRoleIds, r.id) }))} /> @{r.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Allowed role IDs (comma-separated)</div>
                <input style={input} value={toCsv(cfg.allowedRoleIds)} onChange={(e) => setCfg({ ...cfg, allowedRoleIds: fromCsv(e.target.value) })} />
              </div>
            </div>
          </div>

          <div style={{ ...card, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save TTS"}
            </button>
            <button
              onClick={() => save({ active: false, enabled: false, commandEnabled: false })}
              disabled={saving}
              style={{ ...input, width: "auto", cursor: "pointer", borderColor: "#a00000", color: "#ff8a8a" }}
            >
              Emergency OFF
            </button>
          </div>
        </>
      )}
    </div>
  );
}