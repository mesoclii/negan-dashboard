"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import EngineContractPanel from "@/components/possum/EngineContractPanel";
import ProgressionStackShell from "@/components/possum/ProgressionStackShell";
import { buildDashboardHref } from "@/lib/dashboardContext";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number | string };

type AchRewards = {
  giveRole: boolean;
  giveRoleId: string;
  removeRole: boolean;
  removeRoleId: string;
  giveXp: boolean;
  xpAmount: number;
  giveCoins: boolean;
  coinAmount: number;
};

type AchSettings = {
  dontTrackProgress: boolean;
  setColor: string;
  sendThread: boolean;
};

type AchievementRow = {
  id: string;
  name: string;
  description: string;
  source: string;
  tier: string;
  flavor: string;
  action: string;
  count: number;
  enabled: boolean;
  overrideAnnouncement: boolean;
  announcementMessage: string;
  rewards: AchRewards;
  settings: AchSettings;
};

type AchievementsConfig = {
  active: boolean;
  announceChannelId: string;
  announcementTemplate: string;
  commands: {
    achievements: boolean;
    achievementsadmin: boolean;
    achpanel: boolean;
    badge: boolean;
  };
  catalog: AchievementRow[];
};

type TabKey = "achievements" | "configuration" | "commands";

const EMPTY_CFG: AchievementsConfig = {
  active: true,
  announceChannelId: "",
  announcementTemplate: "{{user}} unlocked {{achievement}}",
  commands: {
    achievements: true,
    achievementsadmin: true,
    achpanel: true,
    badge: true
  },
  catalog: []
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const sp = new URLSearchParams(window.location.search);
  const fromUrl = sp.get("guildId") || sp.get("guildid") || "";
  const fromStore = localStorage.getItem("activeGuildId") || localStorage.getItem("activeGuildid") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) {
    localStorage.setItem("activeGuildId", gid);
    localStorage.setItem("activeGuildid", gid);
  }
  return gid;
}

const shell: CSSProperties = { maxWidth: 1320, color: "#ffcaca" };
const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.34)",
  borderRadius: 12,
  background: "rgba(72,0,0,.14)",
  padding: 14
};
const input: CSSProperties = {
  width: "100%",
  background: "#070707",
  border: "1px solid rgba(255,0,0,.45)",
  color: "#ffd3d3",
  borderRadius: 10,
  padding: "10px 12px"
};

function tierColor(tier: string) {
  const t = String(tier || "").toLowerCase();
  if (t.includes("mythic")) return "#f97316";
  if (t.includes("diamond")) return "#22d3ee";
  if (t.includes("gold")) return "#fbbf24";
  if (t.includes("silver")) return "#cbd5e1";
  if (t.includes("bronze")) return "#d97706";
  return "#a78bfa";
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? "1px solid rgba(255,0,0,.7)" : "1px solid rgba(255,0,0,.25)",
        borderRadius: 8,
        background: active ? "rgba(255,0,0,.18)" : "rgba(0,0,0,.35)",
        color: active ? "#fff" : "#fda4af",
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        fontSize: 11,
        padding: "8px 10px",
        cursor: "pointer"
      }}
    >
      {children}
    </button>
  );
}

export default function AchievementsClient() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<AchievementsConfig>(EMPTY_CFG);
  const [base, setBase] = useState<AchievementsConfig>(EMPTY_CFG);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [tab, setTab] = useState<TabKey>("achievements");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
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
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/achievements-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" })
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));

        const merged: AchievementsConfig = {
          ...EMPTY_CFG,
          ...(cfgJson?.config || {}),
          commands: {
            ...EMPTY_CFG.commands,
            ...((cfgJson?.config?.commands || {}) as AchievementsConfig["commands"])
          },
          catalog: Array.isArray(cfgJson?.config?.catalog) ? cfgJson.config.catalog : []
        };

        setCfg(merged);
        setBase(JSON.parse(JSON.stringify(merged)));
        setRoles((Array.isArray(gdJson?.roles) ? gdJson.roles : []).sort((a: Role, b: Role) => Number(b.position || 0) - Number(a.position || 0)));
        setChannels((Array.isArray(gdJson?.channels) ? gdJson.channels : []).filter((c: Channel) => Number(c.type) === 0 || Number(c.type) === 5));
        if (merged.catalog.length) setSelectedId(merged.catalog[0].id);
      } catch (e: any) {
        setMsg(e?.message || "Failed loading achievements.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(base), [cfg, base]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cfg.catalog;
    return cfg.catalog.filter((a) =>
      String(a.name || "").toLowerCase().includes(q) ||
      String(a.description || "").toLowerCase().includes(q) ||
      String(a.action || "").toLowerCase().includes(q) ||
      String(a.id || "").toLowerCase().includes(q)
    );
  }, [search, cfg.catalog]);

  const selected = useMemo(() => cfg.catalog.find((x) => x.id === selectedId) || null, [cfg.catalog, selectedId]);

  function updateCatalogRow(id: string, patch: Partial<AchievementRow>) {
    setCfg((prev) => ({
      ...prev,
      catalog: prev.catalog.map((row) => (row.id === id ? { ...row, ...patch } : row))
    }));
  }

  function updateReward(id: string, patch: Partial<AchRewards>) {
    setCfg((prev) => ({
      ...prev,
      catalog: prev.catalog.map((row) => (row.id === id ? { ...row, rewards: { ...row.rewards, ...patch } } : row))
    }));
  }

  function updateSettings(id: string, patch: Partial<AchSettings>) {
    setCfg((prev) => ({
      ...prev,
      catalog: prev.catalog.map((row) => (row.id === id ? { ...row, settings: { ...row.settings, ...patch } } : row))
    }));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/achievements-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      const merged: AchievementsConfig = {
        ...EMPTY_CFG,
        ...(j?.config || cfg),
        commands: {
          ...EMPTY_CFG.commands,
          ...((j?.config?.commands || cfg.commands) as AchievementsConfig["commands"])
        },
        catalog: Array.isArray(j?.config?.catalog) ? j.config.catalog : cfg.catalog
      };
      setCfg(merged);
      setBase(JSON.parse(JSON.stringify(merged)));
      setMsg("Achievements saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId && !loading) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <ProgressionStackShell
        activeKey="achievements"
        title="Achievements Engine"
        subtitle="Milestone grant layer on top of progression. This page controls what unlocks, how rewards are granted, and how your badge/achievement surfaces are announced."
      />
      <EngineContractPanel
        engineKey="achievements"
        intro="Achievements are the milestone grant layer above progression. This surface should decide which actions unlock, what each unlock grants, and how the catalog is presented without collapsing into a flat badge list."
        related={[
          { label: "Progression", route: "/dashboard/economy/progression", reason: "progression events are the intake feed for achievement logic" },
          { label: "Hall Of Fame", route: "/dashboard/halloffame", reason: "Hall Of Fame is the public recognition layer for achievement output" },
          { label: "Prestige", route: "/dashboard/prestige", reason: "late-loop prestige should stay aligned with how hard achievements are to earn" },
        ]}
      />
      <div style={{ ...card, marginBottom: 12, position: "sticky", top: 8, zIndex: 20, backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900, color: "#ff2f2f" }}>Achievements</div>
            <div style={{ color: "#ff9e9e", marginTop: 4 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ color: "#fff", fontSize: 12, fontWeight: 800 }}>
              <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Active
            </label>
            <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 900, border: dirty ? "1px solid #f59e0b" : "1px solid #64748b", color: dirty ? "#fcd34d" : "#cbd5e1" }}>
              {dirty ? "UNSAVED" : "SAVED"}
            </span>
            <button onClick={saveAll} disabled={saving || !dirty} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900, padding: "8px 12px" }}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        {msg ? <div style={{ marginTop: 8, color: "#fcd34d", fontSize: 12 }}>{msg}</div> : null}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <TabButton active={tab === "achievements"} onClick={() => setTab("achievements")}>Achievements</TabButton>
        <TabButton active={tab === "configuration"} onClick={() => setTab("configuration")}>Configuration</TabButton>
        <TabButton active={tab === "commands"} onClick={() => setTab("commands")}>Commands</TabButton>
      </div>

      {loading ? <div style={{ color: "#ffd1d1", padding: 14 }}>Loading...</div> : null}

      {!loading && tab === "achievements" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 12 }}>
          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(240px,1fr))", gap: 10, marginBottom: 12 }}>
              <div style={{ border: "1px dashed rgba(255,0,0,.4)", borderRadius: 10, padding: 12 }}>
                <div style={{ color: "#fff", fontWeight: 800 }}>Single Achievement</div>
                <div style={{ color: "#fca5a5", fontSize: 12 }}>A one-time achievement with fixed criteria.</div>
              </div>
              <div style={{ border: "1px dashed rgba(255,0,0,.4)", borderRadius: 10, padding: 12 }}>
                <div style={{ color: "#fff", fontWeight: 800 }}>Timed Achievement</div>
                <div style={{ color: "#fca5a5", fontSize: 12 }}>Track limited-time event criteria in Carol set.</div>
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <input style={input} placeholder="Search for an achievement" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(180px,1fr))", gap: 10 }}>
              {filtered.map((a) => {
                const active = selectedId === a.id;
                const color = tierColor(a.tier);
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    style={{
                      textAlign: "left",
                      border: active ? "1px solid rgba(255,0,0,.75)" : "1px solid rgba(255,0,0,.24)",
                      borderRadius: 10,
                      background: "rgba(0,0,0,.28)",
                      color: "#ffdada",
                      padding: 10,
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: color, display: "inline-block" }} />
                      <input
                        type="checkbox"
                        checked={a.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateCatalogRow(a.id, { enabled: e.target.checked });
                        }}
                      />
                    </div>
                    <div style={{ marginTop: 8, color: "#fff", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                    <div style={{ color: "#fca5a5", fontSize: 11, marginTop: 4, minHeight: 28 }}>{a.description || "No description"}</div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#fde68a" }}>{a.action} ? {a.count}</div>
                    <div style={{ marginTop: 8, height: 4, borderRadius: 999, background: "rgba(255,255,255,.15)" }}>
                      <div style={{ width: "8%", height: "100%", borderRadius: 999, background: color }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section style={card}>
            {!selected ? <div style={{ color: "#ffb4b4" }}>Select an achievement.</div> : (
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>{selected.name}</div>
                  <div style={{ color: "#fca5a5", fontSize: 12, fontWeight: 700 }}>ID: {selected.id}</div>
                </div>

                <div>
                  <div style={{ color: "#ffb0b0", fontSize: 12, marginBottom: 6 }}>Action</div>
                  <select style={input} value={selected.action} onChange={(e) => updateCatalogRow(selected.id, { action: e.target.value })}>
                    {[
                      "manual",
                      "messages",
                      "messagecount",
                      "invites",
                      "coins_earned",
                      "store_purchases",
                      "heistwins",
                      "catwins",
                      "pokemon_caught_total",
                      "voice_session_180",
                      "crew_raid_wins",
                      "xp_level"
                    ].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>

                <div>
                  <div style={{ color: "#ffb0b0", fontSize: 12, marginBottom: 6 }}>Count</div>
                  <input type="number" style={input} value={selected.count} onChange={(e) => updateCatalogRow(selected.id, { count: Number(e.target.value || 1) })} />
                </div>

                <label style={{ fontSize: 12, color: "#ffd1d1" }}>
                  <input type="checkbox" checked={selected.overrideAnnouncement} onChange={(e) => updateCatalogRow(selected.id, { overrideAnnouncement: e.target.checked })} /> Override announcement message
                </label>

                <textarea
                  style={{ ...input, minHeight: 70 }}
                  value={selected.announcementMessage || ""}
                  onChange={(e) => updateCatalogRow(selected.id, { announcementMessage: e.target.value })}
                  placeholder="Custom achievement announcement message"
                />

                <div style={{ borderTop: "1px solid rgba(255,0,0,.22)", paddingTop: 10 }}>
                  <div style={{ color: "#fff", fontWeight: 800, marginBottom: 8 }}>Rewards</div>
                  <label style={{ display: "block", marginBottom: 6 }}><input type="checkbox" checked={selected.rewards.giveRole} onChange={(e) => updateReward(selected.id, { giveRole: e.target.checked })} /> Give a role for achieving</label>
                  {selected.rewards.giveRole ? (
                    <select style={input} value={selected.rewards.giveRoleId || ""} onChange={(e) => updateReward(selected.id, { giveRoleId: e.target.value })}>
                      <option value="">Select role</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
                    </select>
                  ) : null}

                  <label style={{ display: "block", marginTop: 8, marginBottom: 6 }}><input type="checkbox" checked={selected.rewards.removeRole} onChange={(e) => updateReward(selected.id, { removeRole: e.target.checked })} /> Remove a role for achieving</label>
                  {selected.rewards.removeRole ? (
                    <select style={input} value={selected.rewards.removeRoleId || ""} onChange={(e) => updateReward(selected.id, { removeRoleId: e.target.value })}>
                      <option value="">Select role</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
                    </select>
                  ) : null}

                  <label style={{ display: "block", marginTop: 8 }}><input type="checkbox" checked={selected.rewards.giveXp} onChange={(e) => updateReward(selected.id, { giveXp: e.target.checked })} /> Give XP for achieving</label>
                  {selected.rewards.giveXp ? (
                    <input type="number" style={{ ...input, marginTop: 6 }} value={selected.rewards.xpAmount || 0} onChange={(e) => updateReward(selected.id, { xpAmount: Number(e.target.value || 0) })} />
                  ) : null}

                  <label style={{ display: "block", marginTop: 8 }}><input type="checkbox" checked={selected.rewards.giveCoins} onChange={(e) => updateReward(selected.id, { giveCoins: e.target.checked })} /> Give coins for achieving</label>
                  {selected.rewards.giveCoins ? (
                    <input type="number" style={{ ...input, marginTop: 6 }} value={selected.rewards.coinAmount || 0} onChange={(e) => updateReward(selected.id, { coinAmount: Number(e.target.value || 0) })} />
                  ) : null}
                </div>

                <div style={{ borderTop: "1px solid rgba(255,0,0,.22)", paddingTop: 10 }}>
                  <div style={{ color: "#fff", fontWeight: 800, marginBottom: 8 }}>Settings</div>
                  <label style={{ display: "block", marginBottom: 6 }}><input type="checkbox" checked={selected.settings.dontTrackProgress} onChange={(e) => updateSettings(selected.id, { dontTrackProgress: e.target.checked })} /> Don&apos;t track progress</label>
                  <label style={{ display: "block", marginBottom: 6 }}><input type="checkbox" checked={selected.settings.sendThread} onChange={(e) => updateSettings(selected.id, { sendThread: e.target.checked })} /> Send thread</label>
                  <input style={input} value={selected.settings.setColor || ""} onChange={(e) => updateSettings(selected.id, { setColor: e.target.value })} placeholder="Card color override (optional)" />
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {!loading && tab === "configuration" ? (
        <section style={card}>
          <h3 style={{ margin: "0 0 10px", color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>General</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ marginBottom: 6, color: "#ffb0b0", fontSize: 12 }}>Announcement Channel</div>
              <select style={input} value={cfg.announceChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, announceChannelId: e.target.value }))}>
                <option value="">Select channel</option>
                {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ marginBottom: 6, color: "#ffb0b0", fontSize: 12 }}>Default Unlock Message</div>
              <textarea style={{ ...input, minHeight: 80 }} value={cfg.announcementTemplate || ""} onChange={(e) => setCfg((p) => ({ ...p, announcementTemplate: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginTop: 16, border: "1px solid rgba(255,0,0,.5)", borderRadius: 10, padding: 12 }}>
            <div style={{ color: "#fff", fontWeight: 800 }}>Reset Progress</div>
            <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 6 }}>
              Use `/achievementsadmin reset` to reset live Carol progress. This button only resets local dashboard filters.
            </div>
            <button onClick={() => { setSearch(""); setMsg("Local filters reset. Use /achievementsadmin reset for runtime progress reset."); }} style={{ ...input, width: "auto", marginTop: 8, cursor: "pointer", fontWeight: 800 }}>
              Reset Progress
            </button>
          </div>
        </section>
      ) : null}

      {!loading && tab === "commands" ? (
        <section style={card}>
          <h3 style={{ margin: "0 0 10px", color: "#fff", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>Native Slash Routing</h3>
          <div style={{ color: "#fca5a5", fontSize: 13, lineHeight: 1.7, maxWidth: 860 }}>
            Achievement slash-command availability now lives in the separate native Slash Command Master. This keeps
            command policy in one place and avoids overlap with the achievement catalog editor.
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {([
              ["achievements", "Display all achievement progress"],
              ["achievementsadmin", "Staff achievement management"],
              ["achpanel", "Achievement panel command"],
              ["badge", "Member badge card display"]
            ] as Array<[keyof AchievementsConfig["commands"], string]>).map(([key, desc]) => (
              <div key={key} style={{ border: "1px solid rgba(255,0,0,.22)", borderRadius: 8, padding: "10px 12px", background: "rgba(0,0,0,.28)" }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>/ {key}</div>
                <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 4 }}>{desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link
              href={buildDashboardHref("/dashboard/slash-commands")}
              style={{ ...input, display: "inline-block", width: "auto", textDecoration: "none", fontWeight: 900, cursor: "pointer" }}
            >
              Open Slash Command Master
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
