"use client";



import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string; type: number };

type Config = {
  active: boolean;
  welcomeEnabled: boolean;
  goodbyeEnabled: boolean;
  welcomeChannelId: string;
  goodbyeChannelId: string;
  welcomeMessage: string;
  goodbyeMessage: string;
  sendWelcomeDm: boolean;
  welcomeDmMessage: string;
  pingOnWelcome: boolean;
  cardEnabled: boolean;
  cardBackgroundUrl: string;
  cardAccentColor: string;
  autoDeleteWelcomeSeconds: number;
  autoDeleteGoodbyeSeconds: number;
  allowedChannelIds: string[];
  notes: string;
};

const DEFAULT_CONFIG: Config = {
  active: true,
  welcomeEnabled: true,
  goodbyeEnabled: false,
  welcomeChannelId: "",
  goodbyeChannelId: "",
  welcomeMessage: "Welcome {user} to {guild}.",
  goodbyeMessage: "{userTag} left {guild}.",
  sendWelcomeDm: false,
  welcomeDmMessage: "Welcome to {guild}. Read the rules and complete onboarding.",
  pingOnWelcome: true,
  cardEnabled: true,
  cardBackgroundUrl: "",
  cardAccentColor: "#ff3b3b",
  autoDeleteWelcomeSeconds: 0,
  autoDeleteGoodbyeSeconds: 0,
  allowedChannelIds: [],
  notes: ""
};

const panel: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  marginBottom: 14,
  background: "rgba(120,0,0,0.09)"
};

const input: React.CSSProperties = {
  width: "100%",
  background: "#0c0c0c",
  color: "#ffd6d6",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "9px 10px"
};

const btn: React.CSSProperties = {
  border: "1px solid #a30000",
  borderRadius: 10,
  background: "#1a0000",
  color: "#ffcccc",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function toPreview(template: string) {
  return template
    .replaceAll("{user}", "@NewMember")
    .replaceAll("{userTag}", "NewMember#0001")
    .replaceAll("{guild}", "Your Server")
    .replaceAll("{memberCount}", "452");
}

function toggleId(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export default function WelcomeGoodbyePage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<Config>(DEFAULT_CONFIG);
  const [channels, setChannels] = useState<Channel[]>([]);
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

        const [cfgRes, guildRes] = await Promise.all([
          fetch(`/api/setup/welcome-goodbye-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const guildJson = await guildRes.json().catch(() => ({}));

        setCfg({ ...DEFAULT_CONFIG, ...(cfgJson?.config || {}) });

        const ch = Array.isArray(guildJson?.channels) ? guildJson.channels : [];
        setChannels(
          ch
            .filter((x: any) => Number(x.type) === 0 || Number(x.type) === 5)
            .map((x: any) => ({
              id: String(x.id),
              name: String(x.name || x.id),
              type: Number(x.type || 0)
            }))
        );
      } catch (e: any) {
        setMsg(e?.message || "Failed to load welcome/goodbye config");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const welcomePreview = useMemo(() => toPreview(cfg.welcomeMessage || ""), [cfg.welcomeMessage]);
  const goodbyePreview = useMemo(() => toPreview(cfg.goodbyeMessage || ""), [cfg.goodbyeMessage]);
  const dmPreview = useMemo(() => toPreview(cfg.welcomeDmMessage || ""), [cfg.welcomeDmMessage]);

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      let r = await fetch("/api/setup/welcome-goodbye-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      let j = await r.json().catch(() => ({}));

      if (!r.ok || j?.success === false) {
        r = await fetch("/api/setup/welcome-goodbye-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, config: cfg })
        });
        j = await r.json().catch(() => ({}));
      }

      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Saved welcome/goodbye config.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffb3b3", padding: 18, maxWidth: 1240 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h1 style={{ margin: 0, color: "#ff3b3b", letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Welcome + Goodbye
        </h1>
        <button style={btn} onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId} {msg ? `• ${msg}` : ""}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Core</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(180px,1fr))", gap: 8 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Active</label>
              <label><input type="checkbox" checked={cfg.welcomeEnabled} onChange={(e) => setCfg({ ...cfg, welcomeEnabled: e.target.checked })} /> Welcome enabled</label>
              <label><input type="checkbox" checked={cfg.goodbyeEnabled} onChange={(e) => setCfg({ ...cfg, goodbyeEnabled: e.target.checked })} /> Goodbye enabled</label>
              <label><input type="checkbox" checked={cfg.pingOnWelcome} onChange={(e) => setCfg({ ...cfg, pingOnWelcome: e.target.checked })} /> Ping on welcome</label>
            </div>
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Channels</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Welcome channel</label>
                <select style={input} value={cfg.welcomeChannelId} onChange={(e) => setCfg({ ...cfg, welcomeChannelId: e.target.value })}>
                  <option value="">Select channel</option>
                  {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div>
                <label>Goodbye channel</label>
                <select style={input} value={cfg.goodbyeChannelId} onChange={(e) => setCfg({ ...cfg, goodbyeChannelId: e.target.value })}>
                  <option value="">Select channel</option>
                  {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Welcome Message</h3>
            <textarea style={{ ...input, minHeight: 110 }} value={cfg.welcomeMessage} onChange={(e) => setCfg({ ...cfg, welcomeMessage: e.target.value })} />
            <div style={{ marginTop: 8, color: "#ff9090" }}>Variables: {"{user} {userTag} {guild} {memberCount}"}</div>
            <div style={{ marginTop: 10, border: "1px solid #5f0000", borderRadius: 8, padding: 10, background: "#120000" }}>
              {welcomePreview || "Preview"}
            </div>
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Goodbye Message</h3>
            <textarea style={{ ...input, minHeight: 100 }} value={cfg.goodbyeMessage} onChange={(e) => setCfg({ ...cfg, goodbyeMessage: e.target.value })} />
            <div style={{ marginTop: 10, border: "1px solid #5f0000", borderRadius: 8, padding: 10, background: "#120000" }}>
              {goodbyePreview || "Preview"}
            </div>
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Welcome DM</h3>
            <label><input type="checkbox" checked={cfg.sendWelcomeDm} onChange={(e) => setCfg({ ...cfg, sendWelcomeDm: e.target.checked })} /> Send DM on join</label>
            <textarea style={{ ...input, minHeight: 90, marginTop: 8 }} value={cfg.welcomeDmMessage} onChange={(e) => setCfg({ ...cfg, welcomeDmMessage: e.target.value })} />
            <div style={{ marginTop: 10, border: "1px solid #5f0000", borderRadius: 8, padding: 10, background: "#120000" }}>
              {dmPreview || "DM Preview"}
            </div>
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Card Style</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 220px", gap: 10, alignItems: "end" }}>
              <div>
                <label>Background image URL (optional)</label>
                <input style={input} value={cfg.cardBackgroundUrl} onChange={(e) => setCfg({ ...cfg, cardBackgroundUrl: e.target.value })} />
              </div>
              <div>
                <label>Accent color</label>
                <input type="color" style={{ ...input, height: 40, padding: 6 }} value={cfg.cardAccentColor || "#ff3b3b"} onChange={(e) => setCfg({ ...cfg, cardAccentColor: e.target.value })} />
              </div>
              <div>
                <label><input type="checkbox" checked={cfg.cardEnabled} onChange={(e) => setCfg({ ...cfg, cardEnabled: e.target.checked })} /> Card enabled</label>
              </div>
            </div>
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Auto-delete + Restrictions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Auto-delete welcome (seconds, 0=off)</label>
                <input type="number" style={input} value={cfg.autoDeleteWelcomeSeconds} onChange={(e) => setCfg({ ...cfg, autoDeleteWelcomeSeconds: Number(e.target.value || 0) })} />
              </div>
              <div>
                <label>Auto-delete goodbye (seconds, 0=off)</label>
                <input type="number" style={input} value={cfg.autoDeleteGoodbyeSeconds} onChange={(e) => setCfg({ ...cfg, autoDeleteGoodbyeSeconds: Number(e.target.value || 0) })} />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ marginBottom: 6 }}>Allowed channels (empty = all)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 6, maxHeight: 220, overflowY: "auto" }}>
                {channels.map((c) => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      checked={cfg.allowedChannelIds.includes(c.id)}
                      onChange={() => setCfg({ ...cfg, allowedChannelIds: toggleId(cfg.allowedChannelIds, c.id) })}
                    />{" "}
                    #{c.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={panel}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Notes</h3>
            <textarea style={{ ...input, minHeight: 80 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
          </div>

          <button style={btn} onClick={saveAll} disabled={saving}>
            {saving ? "Saving..." : "Save All"}
          </button>
        </>
      )}
    </div>
  );
}
