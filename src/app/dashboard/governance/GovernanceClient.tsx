"use client";



import { useEffect, useMemo, useState, type CSSProperties } from "react";

type GuildRole = { id: string; name: string };
type GuildChannel = { id: string; name: string; type?: string };

type GovernanceConfig = {
  active: boolean;
  crew: {
    enabled: boolean;
    maxCrews: number;
    creationCost: number;
    maxCrewSize: number;
    allowPublicRecruitment: boolean;
    recruitChannelId: string;
    crewRolePrefix: string;
  };
  contracts: {
    enabled: boolean;
    dailyCap: number;
    weeklyCap: number;
    baseRewardCoins: number;
    xpReward: number;
    allowStacking: boolean;
    logChannelId: string;
  };
  dominion: {
    enabled: boolean;
    seasonsEnabled: boolean;
    seasonLengthDays: number;
    raidWindows: string[];
    basePayout: number;
    territoryDecayHours: number;
    announceChannelId: string;
  };
  treasury: {
    enabled: boolean;
    taxPercent: number;
    withdrawRoleIds: string[];
    minWithdrawAmount: number;
    maxWithdrawAmount: number;
    auditChannelId: string;
  };
  raidWarfare: {
    enabled: boolean;
    preparationMinutes: number;
    activeRaidMinutes: number;
    cooldownMinutes: number;
    defenderBonusPercent: number;
    attackerBonusPercent: number;
    warManagerRoleIds: string[];
    warLogChannelId: string;
  };
  notes: string;
};

const DEFAULT_CFG: GovernanceConfig = {
  active: true,
  crew: {
    enabled: true,
    maxCrews: 25,
    creationCost: 10000,
    maxCrewSize: 25,
    allowPublicRecruitment: true,
    recruitChannelId: "",
    crewRolePrefix: "Crew",
  },
  contracts: {
    enabled: true,
    dailyCap: 5,
    weeklyCap: 20,
    baseRewardCoins: 250,
    xpReward: 50,
    allowStacking: false,
    logChannelId: "",
  },
  dominion: {
    enabled: true,
    seasonsEnabled: false,
    seasonLengthDays: 30,
    raidWindows: ["Fri 20:00-22:00", "Sat 20:00-22:00"],
    basePayout: 500,
    territoryDecayHours: 48,
    announceChannelId: "",
  },
  treasury: {
    enabled: true,
    taxPercent: 5,
    withdrawRoleIds: [],
    minWithdrawAmount: 1000,
    maxWithdrawAmount: 100000,
    auditChannelId: "",
  },
  raidWarfare: {
    enabled: true,
    preparationMinutes: 15,
    activeRaidMinutes: 45,
    cooldownMinutes: 180,
    defenderBonusPercent: 10,
    attackerBonusPercent: 5,
    warManagerRoleIds: [],
    warLogChannelId: "",
  },
  notes: "",
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function n(v: string, fallback: number, min = 0, max = 999999): number {
  const x = Number(v);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
}

function selected(e: React.ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(e.target.selectedOptions).map((o) => o.value).filter(Boolean);
}

const wrap: CSSProperties = { color: "#ff5252", padding: 24, maxWidth: 1280 };
const box: CSSProperties = {
  border: "1px solid #6f0000",
  borderRadius: 12,
  background: "rgba(120,0,0,0.08)",
  padding: 14,
  marginBottom: 14,
};
const input: CSSProperties = {
  width: "100%",
  padding: 10,
  background: "#0d0d0d",
  border: "1px solid #7a0000",
  color: "#ffd2d2",
  borderRadius: 8,
};
const btn: CSSProperties = {
  border: "1px solid #7a0000",
  borderRadius: 10,
  background: "#130707",
  color: "#ffd7d7",
  padding: "10px 12px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
};

export default function GovernancePage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [governanceEnabled, setGovernanceEnabled] = useState(false);
  const [cfg, setCfg] = useState<GovernanceConfig>(DEFAULT_CFG);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);

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
        const [dRes, gRes, uRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/setup/governance-config?guildId=${encodeURIComponent(guildId)}`),
        ]);

        const dJson = await dRes.json();
        const gJson = await gRes.json();
        const uJson = await uRes.json();

        setGovernanceEnabled(!!dJson?.config?.features?.governanceEnabled);

        const incoming = uJson?.config || {};
        setCfg({
          ...DEFAULT_CFG,
          ...incoming,
          crew: { ...DEFAULT_CFG.crew, ...(incoming.crew || {}) },
          contracts: { ...DEFAULT_CFG.contracts, ...(incoming.contracts || {}) },
          dominion: {
            ...DEFAULT_CFG.dominion,
            ...(incoming.dominion || {}),
            raidWindows: Array.isArray(incoming?.dominion?.raidWindows)
              ? incoming.dominion.raidWindows
              : DEFAULT_CFG.dominion.raidWindows,
          },
          treasury: {
            ...DEFAULT_CFG.treasury,
            ...(incoming.treasury || {}),
            withdrawRoleIds: Array.isArray(incoming?.treasury?.withdrawRoleIds)
              ? incoming.treasury.withdrawRoleIds
              : [],
          },
          raidWarfare: {
            ...DEFAULT_CFG.raidWarfare,
            ...(incoming.raidWarfare || {}),
            warManagerRoleIds: Array.isArray(incoming?.raidWarfare?.warManagerRoleIds)
              ? incoming.raidWarfare.warManagerRoleIds
              : [],
          },
        });

        setRoles(Array.isArray(gJson?.roles) ? gJson.roles : []);
        setChannels(Array.isArray(gJson?.channels) ? gJson.channels : []);
      } catch {
        setMsg("Failed to load governance config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => String(c.type || "").toLowerCase() !== "voice"),
    [channels]
  );

  async function saveAll(nextCfg?: GovernanceConfig, nextEnabled?: boolean) {
    if (!guildId) return;
    const finalCfg = nextCfg || cfg;
    const finalEnabled = typeof nextEnabled === "boolean" ? nextEnabled : governanceEnabled;

    setSaving(true);
    setMsg("");
    try {
      const dRes = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { features: { governanceEnabled: finalEnabled } } }),
      });
      const dJson = await dRes.json();
      if (!dRes.ok || dJson?.success === false) throw new Error(dJson?.error || "Failed to save governance feature.");

      const uRes = await fetch("/api/setup/governance-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config: finalCfg }),
      });
      const uJson = await uRes.json();
      if (!uRes.ok || uJson?.success === false) throw new Error(uJson?.error || "Failed to save governance config.");

      setGovernanceEnabled(finalEnabled);
      setCfg(finalCfg);
      setMsg("Governance saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function hardDisable() {
    const next: GovernanceConfig = {
      ...cfg,
      active: false,
      crew: { ...cfg.crew, enabled: false },
      contracts: { ...cfg.contracts, enabled: false },
      dominion: { ...cfg.dominion, enabled: false },
      treasury: { ...cfg.treasury, enabled: false },
      raidWarfare: { ...cfg.raidWarfare, enabled: false },
    };
    await saveAll(next, false);
  }

  function channelSelect(label: string, value: string, onChange: (v: string) => void) {
    return (
      <div>
        <label>{label}</label>
        <select style={input} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select channel</option>
          {textChannels.map((c) => (
            <option key={c.id} value={c.id}>#{c.name}</option>
          ))}
        </select>
      </div>
    );
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, letterSpacing: "0.16em", textTransform: "uppercase" }}>Governance Control</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={btn} disabled={saving} onClick={() => saveAll()}>{saving ? "Saving..." : "Save Governance"}</button>
          <button style={{ ...btn, borderColor: "#a11515", color: "#ffb2b2" }} disabled={saving} onClick={hardDisable}>Hard Disable</button>
        </div>
      </div>

      <p>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>
      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Master</h3>
        <label style={{ marginRight: 16 }}>
          <input type="checkbox" checked={governanceEnabled} onChange={(e) => setGovernanceEnabled(e.target.checked)} />
          Governance Feature Enabled
        </label>
        <label>
          <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} />
          Governance Active
        </label>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Crew Engine</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <label><input type="checkbox" checked={cfg.crew.enabled} onChange={(e) => setCfg({ ...cfg, crew: { ...cfg.crew, enabled: e.target.checked } })} /> Enabled</label>
          <label><input type="checkbox" checked={cfg.crew.allowPublicRecruitment} onChange={(e) => setCfg({ ...cfg, crew: { ...cfg.crew, allowPublicRecruitment: e.target.checked } })} /> Public Recruitment</label>
          <div><label>Max crews</label><input style={input} type="number" value={cfg.crew.maxCrews} onChange={(e) => setCfg({ ...cfg, crew: { ...cfg.crew, maxCrews: n(e.target.value, 25, 1, 500) } })} /></div>
          <div><label>Max crew size</label><input style={input} type="number" value={cfg.crew.maxCrewSize} onChange={(e) => setCfg({ ...cfg, crew: { ...cfg.crew, maxCrewSize: n(e.target.value, 25, 1, 500) } })} /></div>
          <div><label>Creation cost</label><input style={input} type="number" value={cfg.crew.creationCost} onChange={(e) => setCfg({ ...cfg, crew: { ...cfg.crew, creationCost: n(e.target.value, 10000, 0, 100000000) } })} /></div>
          <div><label>Crew role prefix</label><input style={input} value={cfg.crew.crewRolePrefix} onChange={(e) => setCfg({ ...cfg, crew: { ...cfg.crew, crewRolePrefix: e.target.value } })} /></div>
          {channelSelect("Recruit channel", cfg.crew.recruitChannelId, (v) => setCfg({ ...cfg, crew: { ...cfg.crew, recruitChannelId: v } }))}
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Contracts Engine</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <label><input type="checkbox" checked={cfg.contracts.enabled} onChange={(e) => setCfg({ ...cfg, contracts: { ...cfg.contracts, enabled: e.target.checked } })} /> Enabled</label>
          <label><input type="checkbox" checked={cfg.contracts.allowStacking} onChange={(e) => setCfg({ ...cfg, contracts: { ...cfg.contracts, allowStacking: e.target.checked } })} /> Allow stacking</label>
          <div><label>Daily cap</label><input style={input} type="number" value={cfg.contracts.dailyCap} onChange={(e) => setCfg({ ...cfg, contracts: { ...cfg.contracts, dailyCap: n(e.target.value, 5, 0, 1000) } })} /></div>
          <div><label>Weekly cap</label><input style={input} type="number" value={cfg.contracts.weeklyCap} onChange={(e) => setCfg({ ...cfg, contracts: { ...cfg.contracts, weeklyCap: n(e.target.value, 20, 0, 10000) } })} /></div>
          <div><label>Base reward coins</label><input style={input} type="number" value={cfg.contracts.baseRewardCoins} onChange={(e) => setCfg({ ...cfg, contracts: { ...cfg.contracts, baseRewardCoins: n(e.target.value, 250, 0, 10000000) } })} /></div>
          <div><label>XP reward</label><input style={input} type="number" value={cfg.contracts.xpReward} onChange={(e) => setCfg({ ...cfg, contracts: { ...cfg.contracts, xpReward: n(e.target.value, 50, 0, 1000000) } })} /></div>
          {channelSelect("Contracts log channel", cfg.contracts.logChannelId, (v) => setCfg({ ...cfg, contracts: { ...cfg.contracts, logChannelId: v } }))}
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Dominion Engine</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <label><input type="checkbox" checked={cfg.dominion.enabled} onChange={(e) => setCfg({ ...cfg, dominion: { ...cfg.dominion, enabled: e.target.checked } })} /> Enabled</label>
          <label><input type="checkbox" checked={cfg.dominion.seasonsEnabled} onChange={(e) => setCfg({ ...cfg, dominion: { ...cfg.dominion, seasonsEnabled: e.target.checked } })} /> Seasons Enabled</label>
          <div><label>Season length (days)</label><input style={input} type="number" value={cfg.dominion.seasonLengthDays} onChange={(e) => setCfg({ ...cfg, dominion: { ...cfg.dominion, seasonLengthDays: n(e.target.value, 30, 1, 3650) } })} /></div>
          <div><label>Base payout</label><input style={input} type="number" value={cfg.dominion.basePayout} onChange={(e) => setCfg({ ...cfg, dominion: { ...cfg.dominion, basePayout: n(e.target.value, 500, 0, 100000000) } })} /></div>
          <div><label>Territory decay (hours)</label><input style={input} type="number" value={cfg.dominion.territoryDecayHours} onChange={(e) => setCfg({ ...cfg, dominion: { ...cfg.dominion, territoryDecayHours: n(e.target.value, 48, 1, 10000) } })} /></div>
          {channelSelect("Dominion announce channel", cfg.dominion.announceChannelId, (v) => setCfg({ ...cfg, dominion: { ...cfg.dominion, announceChannelId: v } }))}
        </div>
        <div style={{ marginTop: 10 }}>
          <label>Raid windows (one per line)</label>
          <textarea
            style={{ ...input, minHeight: 90 }}
            value={cfg.dominion.raidWindows.join("\n")}
            onChange={(e) =>
              setCfg({
                ...cfg,
                dominion: {
                  ...cfg.dominion,
                  raidWindows: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                },
              })
            }
          />
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Treasury</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <label><input type="checkbox" checked={cfg.treasury.enabled} onChange={(e) => setCfg({ ...cfg, treasury: { ...cfg.treasury, enabled: e.target.checked } })} /> Enabled</label>
          <div><label>Tax %</label><input style={input} type="number" value={cfg.treasury.taxPercent} onChange={(e) => setCfg({ ...cfg, treasury: { ...cfg.treasury, taxPercent: n(e.target.value, 5, 0, 100) } })} /></div>
          <div><label>Min withdraw</label><input style={input} type="number" value={cfg.treasury.minWithdrawAmount} onChange={(e) => setCfg({ ...cfg, treasury: { ...cfg.treasury, minWithdrawAmount: n(e.target.value, 1000, 0, 1000000000) } })} /></div>
          <div><label>Max withdraw</label><input style={input} type="number" value={cfg.treasury.maxWithdrawAmount} onChange={(e) => setCfg({ ...cfg, treasury: { ...cfg.treasury, maxWithdrawAmount: n(e.target.value, 100000, 0, 1000000000) } })} /></div>
          {channelSelect("Treasury audit channel", cfg.treasury.auditChannelId, (v) => setCfg({ ...cfg, treasury: { ...cfg.treasury, auditChannelId: v } }))}
          <div style={{ gridColumn: "1 / span 3" }}>
            <label>Withdraw role IDs</label>
            <select
              multiple
              style={{ ...input, minHeight: 120 }}
              value={cfg.treasury.withdrawRoleIds}
              onChange={(e) => setCfg({ ...cfg, treasury: { ...cfg.treasury, withdrawRoleIds: selected(e) } })}
            >
              {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Raid Warfare</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          <label><input type="checkbox" checked={cfg.raidWarfare.enabled} onChange={(e) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, enabled: e.target.checked } })} /> Enabled</label>
          <div><label>Prep minutes</label><input style={input} type="number" value={cfg.raidWarfare.preparationMinutes} onChange={(e) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, preparationMinutes: n(e.target.value, 15, 0, 10000) } })} /></div>
          <div><label>Active raid minutes</label><input style={input} type="number" value={cfg.raidWarfare.activeRaidMinutes} onChange={(e) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, activeRaidMinutes: n(e.target.value, 45, 0, 10000) } })} /></div>
          <div><label>Cooldown minutes</label><input style={input} type="number" value={cfg.raidWarfare.cooldownMinutes} onChange={(e) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, cooldownMinutes: n(e.target.value, 180, 0, 100000) } })} /></div>
          <div><label>Defender bonus %</label><input style={input} type="number" value={cfg.raidWarfare.defenderBonusPercent} onChange={(e) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, defenderBonusPercent: n(e.target.value, 10, 0, 1000) } })} /></div>
          <div><label>Attacker bonus %</label><input style={input} type="number" value={cfg.raidWarfare.attackerBonusPercent} onChange={(e) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, attackerBonusPercent: n(e.target.value, 5, 0, 1000) } })} /></div>
          {channelSelect("War log channel", cfg.raidWarfare.warLogChannelId, (v) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, warLogChannelId: v } }))}
          <div style={{ gridColumn: "1 / span 3" }}>
            <label>War manager role IDs</label>
            <select
              multiple
              style={{ ...input, minHeight: 120 }}
              value={cfg.raidWarfare.warManagerRoleIds}
              onChange={(e) => setCfg({ ...cfg, raidWarfare: { ...cfg.raidWarfare, warManagerRoleIds: selected(e) } })}
            >
              {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Notes</h3>
        <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
      </div>

      <button style={btn} disabled={saving} onClick={() => saveAll()}>{saving ? "Saving..." : "Save Governance"}</button>
    </div>
  );
}
