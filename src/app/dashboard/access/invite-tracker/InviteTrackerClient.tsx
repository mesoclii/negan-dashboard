"use client";

import { useEffect, useMemo, useState } from "react";

type RewardTier = {
  invites: number;
  roleId: string;
  coins: number;
  label: string;
  prize: string;
  oneTime: boolean;
  stackable: boolean;
};

type Config = {
  active: boolean;
  publicEnabled: boolean;
  vanitySlug: string;
  pointsName: string;
  leaderboardType: "invites" | "referrals";
  rewardsEnabled: boolean;
  rewardTiers: RewardTier[];
  payoutMode: "manual" | "auto";
  payoutIntervalHours: number;
  minimumInvitesForReward: number;
  announceRewards: boolean;
  announceChannelId: string;
  commands: { invite: boolean; invites: boolean; leaderboard: boolean };
  fraud: { requireAccountAgeDays: number; minServerDays: number; ignoreBotInvites: boolean; lockSelfInvites: boolean };
  notes: string;
  lastSavedAt?: string;
};

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number | string };

const DEFAULT_CONFIG: Config = {
  active: false,
  publicEnabled: false,
  vanitySlug: "",
  pointsName: "Invites",
  leaderboardType: "invites",
  rewardsEnabled: true,
  rewardTiers: [
    { invites: 5, roleId: "", coins: 0, label: "", prize: "", oneTime: true, stackable: false },
    { invites: 10, roleId: "", coins: 250, label: "", prize: "", oneTime: true, stackable: false },
    { invites: 25, roleId: "", coins: 1000, label: "", prize: "", oneTime: true, stackable: false }
  ],
  payoutMode: "manual",
  payoutIntervalHours: 24,
  minimumInvitesForReward: 1,
  announceRewards: true,
  announceChannelId: "",
  commands: { invite: true, invites: true, leaderboard: true },
  fraud: { requireAccountAgeDays: 0, minServerDays: 0, ignoreBotInvites: true, lockSelfInvites: true },
  notes: "",
  lastSavedAt: "",
};

function resolveGuildId(): string {
  if (typeof window === "undefined") return "";
  const sp = new URLSearchParams(window.location.search);
  const q = sp.get("guildId") || sp.get("guildid") || "";
  const s = localStorage.getItem("activeGuildId") || localStorage.getItem("activeGuildid") || "";
  const g = (q || s).trim();
  if (g) {
    localStorage.setItem("activeGuildId", g);
    localStorage.setItem("activeGuildid", g);
  }
  return g;
}

function mergeConfig(raw?: Partial<Config>): Config {
  const incoming = raw || {};
  return {
    ...DEFAULT_CONFIG,
    ...incoming,
    rewardTiers: Array.isArray(incoming.rewardTiers) && incoming.rewardTiers.length
      ? incoming.rewardTiers
      : DEFAULT_CONFIG.rewardTiers,
    commands: { ...DEFAULT_CONFIG.commands, ...(incoming.commands || {}) },
    fraud: { ...DEFAULT_CONFIG.fraud, ...(incoming.fraud || {}) },
    leaderboardType: incoming.leaderboardType === "referrals" ? "referrals" : "invites",
    payoutMode: incoming.payoutMode === "auto" ? "auto" : "manual",
  };
}

const wrap: React.CSSProperties = { color: "#ffd0d0", padding: 16, maxWidth: 1300 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };

export default function InviteTrackerClient() {
  const [guildId, setGuildId] = useState("");
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [original, setOriginal] = useState<Config>(DEFAULT_CONFIG);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [status, setStatus] = useState("Ready");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const g = resolveGuildId();
    setGuildId(g);
  }, []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        setStatus("Loading...");
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/invite-tracker-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        const merged = mergeConfig(cfgJson?.config);
        setConfig(merged);
        setOriginal(merged);
        const roleList: Role[] = Array.isArray(gdJson?.roles) ? gdJson.roles : [];
        roleList.sort((a, b) => (Number(b.position || 0) - Number(a.position || 0)) || a.name.localeCompare(b.name));
        setRoles(roleList);
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
        setStatus("Loaded");
      } catch {
        setStatus("Load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(original), [config, original]);

  function updateTier(index: number, patch: Partial<RewardTier>) {
    setConfig((prev) => {
      const tiers = [...prev.rewardTiers];
      tiers[index] = { ...tiers[index], ...patch } as RewardTier;
      return { ...prev, rewardTiers: tiers };
    });
  }

  function addTier() {
    setConfig((prev) => ({
      ...prev,
      rewardTiers: [...prev.rewardTiers, { invites: 1, roleId: "", coins: 0, label: "", prize: "", oneTime: true, stackable: false }],
    }));
  }

  function removeTier(index: number) {
    setConfig((prev) => ({ ...prev, rewardTiers: prev.rewardTiers.filter((_, i) => i !== index) }));
  }

  function setCommand(key: keyof Config["commands"], value: boolean) {
    setConfig((prev) => ({ ...prev, commands: { ...prev.commands, [key]: value } }));
  }

  function setFraud(key: keyof Config["fraud"], value: boolean | number) {
    setConfig((prev) => ({ ...prev, fraud: { ...prev.fraud, [key]: value } }));
  }

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setStatus("Saving...");
    try {
      const r = await fetch("/api/setup/invite-tracker-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      const merged = mergeConfig(j?.config);
      setConfig(merged);
      setOriginal(merged);
      setStatus("Saved");
    } catch (e: any) {
      setStatus(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setConfig(original);
    setStatus("Reverted");
  }

  if (!guildId) {
    return <main style={{ padding: 16, color: "#ff6666" }}>Missing guildId. Open from /guilds first.</main>;
  }

  return (
    <main style={wrap}>
      <h1 style={{ marginTop: 0, color: "#ff4444", textTransform: "uppercase", letterSpacing: "0.12em" }}>Invite Tracker</h1>
      <p style={{ color: "#ff8a8a" }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>
      <p style={{ color: "#ffb3b3", fontSize: 12 }}>Full engine surface. Saves to invite-tracker-config only.</p>
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <label><input type="checkbox" checked={config.active} onChange={(e) => setConfig({ ...config, active: e.target.checked })} /> Engine Active</label>
        <label><input type="checkbox" checked={config.publicEnabled} onChange={(e) => setConfig({ ...config, publicEnabled: e.target.checked })} /> Public Leaderboard</label>
        <label><input type="checkbox" checked={config.rewardsEnabled} onChange={(e) => setConfig({ ...config, rewardsEnabled: e.target.checked })} /> Rewards Enabled</label>
        <label><input type="checkbox" checked={config.announceRewards} onChange={(e) => setConfig({ ...config, announceRewards: e.target.checked })} /> Announce Rewards</label>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{status}{dirty ? " * Unsaved" : ""}</span>
      </div>

      <section style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6 }}>Points Name</div>
            <input style={input} value={config.pointsName} onChange={(e) => setConfig({ ...config, pointsName: e.target.value })} />
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Vanity Slug</div>
            <input style={input} value={config.vanitySlug} onChange={(e) => setConfig({ ...config, vanitySlug: e.target.value.toLowerCase() })} />
            <div style={{ color: "#ffb3b3", fontSize: 11, marginTop: 4 }}>Lowercase, letters/numbers/dashes.</div>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Leaderboard Type</div>
            <select style={input} value={config.leaderboardType} onChange={(e) => setConfig({ ...config, leaderboardType: e.target.value as Config["leaderboardType"] })}>
              <option value="invites">Invites</option>
              <option value="referrals">Referrals</option>
            </select>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Announce Channel</div>
            <select style={input} value={config.announceChannelId || ""} onChange={(e) => setConfig({ ...config, announceChannelId: e.target.value })}>
              <option value="">None</option>
              {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ color: "#ffb5b5", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Reward Tiers</div>
            <div style={{ color: "#ff9c9c", fontSize: 12 }}>Invites, rewards, roles and one-time settings.</div>
          </div>
          <button onClick={addTier} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800 }}>+ Add Tier</button>
        </div>

        {config.rewardTiers.map((tier, idx) => (
          <div key={`tier_${idx}`} style={{ border: "1px solid #520000", borderRadius: 10, padding: 10, marginTop: 10, background: "#110000" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Invites Needed</div>
                <input style={input} type="number" min={1} value={tier.invites} onChange={(e) => updateTier(idx, { invites: Number(e.target.value || 0) })} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Coins</div>
                <input style={input} type="number" min={0} value={tier.coins} onChange={(e) => updateTier(idx, { coins: Number(e.target.value || 0) })} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Role Reward</div>
                <select style={input} value={tier.roleId || ""} onChange={(e) => updateTier(idx, { roleId: e.target.value })}>
                  <option value="">None</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Label</div>
                <input style={input} value={tier.label} onChange={(e) => updateTier(idx, { label: e.target.value })} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Prize (text)</div>
                <input style={input} value={tier.prize} onChange={(e) => updateTier(idx, { prize: e.target.value })} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20 }}>
                <label><input type="checkbox" checked={tier.oneTime} onChange={(e) => updateTier(idx, { oneTime: e.target.checked })} /> One-time</label>
                <label><input type="checkbox" checked={tier.stackable} onChange={(e) => updateTier(idx, { stackable: e.target.checked })} /> Stackable</label>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <button onClick={() => removeTier(idx)} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 700, borderColor: "#a00000", color: "#ff9d9d" }}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6 }}>Minimum Invites for Any Reward</div>
            <input style={input} type="number" min={1} value={config.minimumInvitesForReward} onChange={(e) => setConfig({ ...config, minimumInvitesForReward: Number(e.target.value || 0) })} />
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Payout Mode</div>
            <select style={input} value={config.payoutMode} onChange={(e) => setConfig({ ...config, payoutMode: e.target.value as Config["payoutMode"] })}>
              <option value="manual">Manual review</option>
              <option value="auto">Auto payout</option>
            </select>
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Payout Interval (hours)</div>
            <input style={input} type="number" min={1} value={config.payoutIntervalHours} onChange={(e) => setConfig({ ...config, payoutIntervalHours: Number(e.target.value || 0) })} />
          </div>
        </div>
      </section>

      <section style={card}>
        <div style={{ color: "#ffb5b5", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Commands</div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <label><input type="checkbox" checked={config.commands.invite} onChange={(e) => setCommand("invite", e.target.checked)} /> /invite</label>
          <label><input type="checkbox" checked={config.commands.invites} onChange={(e) => setCommand("invites", e.target.checked)} /> /invites</label>
          <label><input type="checkbox" checked={config.commands.leaderboard} onChange={(e) => setCommand("leaderboard", e.target.checked)} /> /leaderboard</label>
        </div>
      </section>

      <section style={card}>
        <div style={{ color: "#ffb5b5", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Fraud Controls</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6 }}>Require Account Age (days)</div>
            <input style={input} type="number" min={0} value={config.fraud.requireAccountAgeDays} onChange={(e) => setFraud("requireAccountAgeDays", Number(e.target.value || 0))} />
          </div>
          <div>
            <div style={{ marginBottom: 6 }}>Min Server Days</div>
            <input style={input} type="number" min={0} value={config.fraud.minServerDays} onChange={(e) => setFraud("minServerDays", Number(e.target.value || 0))} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
            <input type="checkbox" checked={config.fraud.ignoreBotInvites} onChange={(e) => setFraud("ignoreBotInvites", e.target.checked)} /> Ignore bot invites
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 22 }}>
            <input type="checkbox" checked={config.fraud.lockSelfInvites} onChange={(e) => setFraud("lockSelfInvites", e.target.checked)} /> Lock self-invites
          </label>
        </div>
      </section>

      <section style={card}>
        <div style={{ marginBottom: 6 }}>Notes</div>
        <textarea style={{ ...input, minHeight: 120 }} value={config.notes} onChange={(e) => setConfig({ ...config, notes: e.target.value })} />
      </section>

      <div style={{ ...card, display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={save} disabled={saving || !dirty} style={{ ...input, width: "auto", cursor: saving || !dirty ? "not-allowed" : "pointer", fontWeight: 900 }}>
          {saving ? "Saving..." : "Save"}
        </button>
        <button onClick={cancel} disabled={saving || !dirty} style={{ ...input, width: "auto", cursor: saving || !dirty ? "not-allowed" : "pointer", borderColor: "#7a0000", color: "#ff9d9d" }}>
          Cancel
        </button>
        <span style={{ color: "#ff9d9d", fontSize: 12 }}>Last saved: {config.lastSavedAt || "unknown"}</span>
      </div>

      {loading ? <div style={{ color: "#ff8a8a" }}>Loading invite tracker...</div> : null}
    </main>
  );
}