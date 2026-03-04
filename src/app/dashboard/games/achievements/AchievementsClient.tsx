"use client";

import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number | string };
type BadgeRole = { badge: string; roleId: string };

type AchievementsConfig = {
  active: boolean;
  achievementsEnabled: boolean;
  badgesEnabled: boolean;
  prestigeEnabled: boolean;
  archetypeRoleSync: boolean;
  xpCurve: "slow" | "normal" | "fast" | string;
  levelMilestones: number[];
  badgeRoleMap: BadgeRole[];
  announceChannelId: string;
};

const EMPTY: AchievementsConfig = {
  active: true,
  achievementsEnabled: true,
  badgesEnabled: true,
  prestigeEnabled: false,
  archetypeRoleSync: true,
  xpCurve: "normal",
  levelMilestones: [5, 10, 20, 35, 50],
  badgeRoleMap: [],
  announceChannelId: ""
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function parseMilestones(text: string): number[] {
  return [...new Set(
    text
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .map((n) => Math.floor(n))
  )].sort((a, b) => a - b).slice(0, 50);
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#070707",
  border: "1px solid rgba(255,0,0,.45)",
  color: "#ffd3d3",
  borderRadius: 10,
  padding: "10px 12px"
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.35)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(90,0,0,.10)"
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#ffdada",
  letterSpacing: "0.10em",
  textTransform: "uppercase"
};

export default function AchievementsClient() {
  const [guildId, setGuildId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [cfg, setCfg] = useState<AchievementsConfig>(EMPTY);
  const [milestonesText, setMilestonesText] = useState("5,10,20,35,50");
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
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/achievements-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));

        const merged = { ...EMPTY, ...(cfgJson?.config || {}) };
        setCfg(merged);
        setMilestonesText((Array.isArray(merged.levelMilestones) ? merged.levelMilestones : []).join(","));

        setRoles((Array.isArray(gdJson?.roles) ? gdJson.roles : []).sort((a: Role, b: Role) => Number(b.position || 0) - Number(a.position || 0)));
        setChannels((Array.isArray(gdJson?.channels) ? gdJson.channels : []).filter((c: Channel) => Number(c.type) === 0 || Number(c.type) === 5));
      } catch (e: any) {
        setMsg(e?.message || "Failed loading achievements config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const roleNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of roles) map[r.id] = r.name;
    return map;
  }, [roles]);

  function addBadgeRole() {
    setCfg((p) => ({ ...p, badgeRoleMap: [...(p.badgeRoleMap || []), { badge: "", roleId: "" }] }));
  }

  function removeBadgeRole(i: number) {
    setCfg((p) => ({ ...p, badgeRoleMap: p.badgeRoleMap.filter((_, idx) => idx !== i) }));
  }

  function updateBadgeRole(i: number, patch: Partial<BadgeRole>) {
    setCfg((p) => {
      const next = [...p.badgeRoleMap];
      next[i] = { ...next[i], ...patch };
      return { ...p, badgeRoleMap: next };
    });
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const patch: AchievementsConfig = {
        ...cfg,
        levelMilestones: parseMilestones(milestonesText)
      };

      const r = await fetch("/api/setup/achievements-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      const merged = { ...EMPTY, ...(j?.config || patch) };
      setCfg(merged);
      setMilestonesText((Array.isArray(merged.levelMilestones) ? merged.levelMilestones : []).join(","));
      setMsg("Achievements settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ maxWidth: 1280, color: "#ffcaca" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900, color: "#ff2f2f" }}>Achievements Engine</div>
          <div style={{ color: "#ff9e9e", marginTop: 4 }}>Guild: {guildId}</div>
        </div>
        <button onClick={saveAll} disabled={saving} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontWeight: 900 }}>
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}
      {loading ? <div>Loading...</div> : null}

      {!loading ? (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={cardStyle}>
            <h3 style={titleStyle}>Core Toggles</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(240px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Engine active</label>
              <label><input type="checkbox" checked={cfg.achievementsEnabled} onChange={(e) => setCfg((p) => ({ ...p, achievementsEnabled: e.target.checked }))} /> Achievements enabled</label>
              <label><input type="checkbox" checked={cfg.badgesEnabled} onChange={(e) => setCfg((p) => ({ ...p, badgesEnabled: e.target.checked }))} /> Badges enabled</label>
              <label><input type="checkbox" checked={cfg.prestigeEnabled} onChange={(e) => setCfg((p) => ({ ...p, prestigeEnabled: e.target.checked }))} /> Prestige enabled</label>
              <label><input type="checkbox" checked={cfg.archetypeRoleSync} onChange={(e) => setCfg((p) => ({ ...p, archetypeRoleSync: e.target.checked }))} /> Archetype role sync</label>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={titleStyle}>Progression Curve</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ marginBottom: 6, color: "#ffb0b0", fontSize: 12 }}>XP Curve</div>
                <select value={cfg.xpCurve || "normal"} onChange={(e) => setCfg((p) => ({ ...p, xpCurve: e.target.value }))} style={inputStyle}>
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6, color: "#ffb0b0", fontSize: 12 }}>Announce Channel</div>
                <select value={cfg.announceChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, announceChannelId: e.target.value }))} style={inputStyle}>
                  <option value="">None</option>
                  {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ marginBottom: 6, color: "#ffb0b0", fontSize: 12 }}>Level Milestones (comma-separated)</div>
              <input value={milestonesText} onChange={(e) => setMilestonesText(e.target.value)} style={inputStyle} placeholder="5,10,20,35,50" />
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={titleStyle}>Badge Role Mapping</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {cfg.badgeRoleMap.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr auto", gap: 8 }}>
                  <input
                    value={row.badge || ""}
                    onChange={(e) => updateBadgeRole(i, { badge: e.target.value })}
                    style={inputStyle}
                    placeholder="Badge name"
                  />
                  <select value={row.roleId || ""} onChange={(e) => updateBadgeRole(i, { roleId: e.target.value })} style={inputStyle}>
                    <option value="">No role</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
                  </select>
                  <button onClick={() => removeBadgeRole(i)} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontWeight: 800 }}>Remove</button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={addBadgeRole} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontWeight: 800 }}>+ Add Badge Role</button>
              <div style={{ fontSize: 12, color: "#ffb0b0" }}>
                {cfg.badgeRoleMap.length} mapping(s)
              </div>
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: "#ff9e9e" }}>
              Active role targets: {cfg.badgeRoleMap.filter((x) => !!x.roleId).map((x) => roleNameById[x.roleId] || x.roleId).join(", ") || "none"}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
