"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type FeaturesConfig = {
  economyEnabled: boolean;
  birthdayEnabled: boolean;
};

type StoreItem = {
  id: string;
  name: string;
  description: string;
  type: "role" | "item" | "perk";
  priceCoins: number;
  stock: number;
  enabled: boolean;
};

type StoreConfig = {
  active: boolean;
  panel: {
    title: string;
    description: string;
    buttonLabel: string;
  };
  items: StoreItem[];
};

type ProgressionConfig = {
  active: boolean;
  xp: {
    enabled: boolean;
    xpPerMessageMin: number;
    xpPerMessageMax: number;
  };
  achievements: {
    enabled: boolean;
    categoriesEnabled: {
      messages: boolean;
      invites: boolean;
      economy: boolean;
      games: boolean;
      governance: boolean;
    };
  };
  rewards: {
    levelCoinRewards: Array<{ level: number; coins: number; oneTime: boolean }>;
  };
};

type EconomyCommand = {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
};

type EconomyCommandConfig = {
  active: boolean;
  currency: {
    name: string;
    symbol: string;
    startingBalance: number;
    notes: string;
  };
  commands: EconomyCommand[];
};

const DEFAULT_FEATURES: FeaturesConfig = {
  economyEnabled: true,
  birthdayEnabled: true
};

const DEFAULT_STORE: StoreConfig = {
  active: true,
  panel: { title: "Server Store", description: "", buttonLabel: "Open Store" },
  items: []
};

const DEFAULT_PROGRESSION: ProgressionConfig = {
  active: true,
  xp: { enabled: true, xpPerMessageMin: 5, xpPerMessageMax: 15 },
  achievements: {
    enabled: true,
    categoriesEnabled: { messages: true, invites: true, economy: true, games: true, governance: true }
  },
  rewards: { levelCoinRewards: [] }
};

const DEFAULT_COMMANDS: EconomyCommandConfig = {
  active: true,
  currency: {
    name: "Meso's Coins",
    symbol: "??",
    startingBalance: 2500,
    notes: "Coins are earned through progression and games, then spent in Store."
  },
  commands: []
};

function getGuildIdClient(): string {
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

function asStore(raw: any): StoreConfig {
  return {
    active: !!raw?.active,
    panel: {
      title: String(raw?.panel?.title || "Server Store"),
      description: String(raw?.panel?.description || ""),
      buttonLabel: String(raw?.panel?.buttonLabel || "Open Store")
    },
    items: Array.isArray(raw?.items)
      ? raw.items.map((it: any) => ({
          id: String(it?.id || ""),
          name: String(it?.name || "Unnamed Item"),
          description: String(it?.description || ""),
          type: ["role", "item", "perk"].includes(String(it?.type)) ? (it.type as "role" | "item" | "perk") : "item",
          priceCoins: Number(it?.priceCoins || 0),
          stock: Number(it?.stock ?? -1),
          enabled: !!it?.enabled
        }))
      : []
  };
}

function asProgression(raw: any): ProgressionConfig {
  return {
    active: !!raw?.active,
    xp: {
      enabled: !!raw?.xp?.enabled,
      xpPerMessageMin: Number(raw?.xp?.xpPerMessageMin || 5),
      xpPerMessageMax: Number(raw?.xp?.xpPerMessageMax || 15)
    },
    achievements: {
      enabled: !!raw?.achievements?.enabled,
      categoriesEnabled: {
        messages: !!raw?.achievements?.categoriesEnabled?.messages,
        invites: !!raw?.achievements?.categoriesEnabled?.invites,
        economy: !!raw?.achievements?.categoriesEnabled?.economy,
        games: !!raw?.achievements?.categoriesEnabled?.games,
        governance: !!raw?.achievements?.categoriesEnabled?.governance
      }
    },
    rewards: {
      levelCoinRewards: Array.isArray(raw?.rewards?.levelCoinRewards)
        ? raw.rewards.levelCoinRewards.map((r: any) => ({
            level: Number(r?.level || 1),
            coins: Number(r?.coins || 0),
            oneTime: !!r?.oneTime
          }))
        : []
    }
  };
}

function asCommands(raw: any): EconomyCommandConfig {
  return {
    active: !!raw?.active,
    currency: {
      name: String(raw?.currency?.name || "Meso's Coins"),
      symbol: String(raw?.currency?.symbol || "??"),
      startingBalance: Number(raw?.currency?.startingBalance || 0),
      notes: String(raw?.currency?.notes || "")
    },
    commands: Array.isArray(raw?.commands)
      ? raw.commands
          .map((c: any) => ({
            id: String(c?.id || ""),
            label: String(c?.label || c?.id || ""),
            description: String(c?.description || ""),
            enabled: !!c?.enabled
          }))
          .filter((c: EconomyCommand) => !!c.id)
      : []
  };
}

const shell: CSSProperties = { maxWidth: 1280, margin: "0 auto", color: "#f8b4b4" };
const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.28)",
  borderRadius: 12,
  background: "rgba(38,0,0,.24)",
  marginBottom: 14
};
const body: CSSProperties = { padding: 14 };
const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid rgba(255,0,0,.35)",
  color: "#ffd1d1",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open style={card}>
      <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
        {title}
      </summary>
      <div style={body}>{children}</div>
    </details>
  );
}

export default function EconomyClient() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const [features, setFeatures] = useState<FeaturesConfig>(DEFAULT_FEATURES);
  const [store, setStore] = useState<StoreConfig>(DEFAULT_STORE);
  const [progression, setProgression] = useState<ProgressionConfig>(DEFAULT_PROGRESSION);
  const [ecoCmd, setEcoCmd] = useState<EconomyCommandConfig>(DEFAULT_COMMANDS);

  const [baseFeatures, setBaseFeatures] = useState<FeaturesConfig>(DEFAULT_FEATURES);
  const [baseProgression, setBaseProgression] = useState<ProgressionConfig>(DEFAULT_PROGRESSION);
  const [baseEcoCmd, setBaseEcoCmd] = useState<EconomyCommandConfig>(DEFAULT_COMMANDS);

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

        const [dashRes, storeRes, progRes, cmdRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/setup/store-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/setup/progression-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/setup/economy-command-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" })
        ]);

        const dashJson = await dashRes.json().catch(() => ({}));
        const storeJson = await storeRes.json().catch(() => ({}));
        const progJson = await progRes.json().catch(() => ({}));
        const cmdJson = await cmdRes.json().catch(() => ({}));

        const nextFeatures: FeaturesConfig = {
          economyEnabled: !!dashJson?.config?.features?.economyEnabled,
          birthdayEnabled: !!dashJson?.config?.features?.birthdayEnabled
        };

        const nextStore = asStore(storeJson?.config || {});
        const nextProg = asProgression(progJson?.config || {});
        const nextCmd = asCommands(cmdJson?.config || {});

        setFeatures(nextFeatures);
        setBaseFeatures(nextFeatures);
        setStore(nextStore);
        setProgression(nextProg);
        setBaseProgression(nextProg);
        setEcoCmd(nextCmd);
        setBaseEcoCmd(nextCmd);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load economy center.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const dirty = useMemo(() => {
    return (
      JSON.stringify(features) !== JSON.stringify(baseFeatures) ||
      JSON.stringify(progression) !== JSON.stringify(baseProgression) ||
      JSON.stringify(ecoCmd) !== JSON.stringify(baseEcoCmd)
    );
  }, [features, baseFeatures, progression, baseProgression, ecoCmd, baseEcoCmd]);

  const filteredCommands = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ecoCmd.commands;
    return ecoCmd.commands.filter((c) =>
      c.label.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [search, ecoCmd.commands]);

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const [dashRes, progRes, cmdRes] = await Promise.all([
        fetch("/api/bot/dashboard-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, patch: { features } })
        }),
        fetch("/api/setup/progression-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guildId,
            patch: {
              active: progression.active,
              xp: progression.xp,
              achievements: progression.achievements,
              rewards: progression.rewards
            }
          })
        }),
        fetch("/api/setup/economy-command-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, patch: ecoCmd })
        })
      ]);

      const [dashJson, progJson, cmdJson] = await Promise.all([
        dashRes.json().catch(() => ({})),
        progRes.json().catch(() => ({})),
        cmdRes.json().catch(() => ({}))
      ]);

      if (!dashRes.ok || dashJson?.success === false) throw new Error(dashJson?.error || "Failed saving dashboard features");
      if (!progRes.ok || progJson?.success === false) throw new Error(progJson?.error || "Failed saving progression");
      if (!cmdRes.ok || cmdJson?.success === false) throw new Error(cmdJson?.error || "Failed saving economy commands");

      setBaseFeatures(features);
      setBaseProgression(progression);
      setBaseEcoCmd(ecoCmd);
      setMsg("Economy center saved.");
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
    return <div style={{ color: "#fecaca", padding: 20 }}>Loading economy center...</div>;
  }

  return (
    <div style={shell}>
      <div style={{ ...card, padding: 14, position: "sticky", top: 8, zIndex: 15, backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: "0.12em", textTransform: "uppercase" }}>Economy</div>
            <div style={{ color: "#fca5a5", marginTop: 4, fontSize: 13 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
            <div style={{ color: "#fca5a5", marginTop: 4, fontSize: 12 }}>
              Economy + progression feed coins into Store purchases.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", border: dirty ? "1px solid rgba(245,158,11,.6)" : "1px solid rgba(148,163,184,.45)", background: dirty ? "rgba(245,158,11,.14)" : "rgba(148,163,184,.12)", color: dirty ? "#fcd34d" : "#cbd5e1" }}>
              {dirty ? "UNSAVED" : "ALL SAVED"}
            </span>
            <button
              onClick={() => {
                setFeatures(baseFeatures);
                setProgression(baseProgression);
                setEcoCmd(baseEcoCmd);
                setMsg("Reverted unsaved changes.");
              }}
              disabled={saving || !dirty}
              style={{ ...input, width: "auto", cursor: "pointer", padding: "8px 12px" }}
            >
              Revert
            </button>
            <button
              onClick={saveAll}
              disabled={saving || !dirty}
              style={{ border: "1px solid rgba(255,0,0,.75)", borderRadius: 10, background: "rgba(255,0,0,.2)", color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, padding: "8px 12px", cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Economy"}
            </button>
          </div>
        </div>
        {msg ? <div style={{ marginTop: 8, color: "#fcd34d", fontSize: 12 }}>{msg}</div> : null}
      </div>

      <Section title="Economy Engine State">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(260px,1fr))", gap: 12 }}>
          <label style={{ display: "block" }}>
            <input type="checkbox" checked={features.economyEnabled} onChange={(e) => setFeatures((p) => ({ ...p, economyEnabled: e.target.checked }))} /> Economy Enabled
          </label>
          <label style={{ display: "block" }}>
            <input type="checkbox" checked={features.birthdayEnabled} onChange={(e) => setFeatures((p) => ({ ...p, birthdayEnabled: e.target.checked }))} /> Birthday Enabled
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(180px,1fr))", gap: 10, marginTop: 12 }}>
          <Link href={`/dashboard/economy/store?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, textDecoration: "none" }}>Open Store Engine</Link>
          <Link href={`/dashboard/economy/progression?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, textDecoration: "none" }}>Open Progression Engine</Link>
          <Link href={`/dashboard/economy/leaderboard?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, textDecoration: "none" }}>Open Leaderboard</Link>
          <Link href={`/dashboard/economy/radio-birthday?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, textDecoration: "none" }}>Open Birthdays</Link>
        </div>
      </Section>

      <Section title="Store Snapshot (Read From Store Engine)">
        <div style={{ color: "#ffd1d1", marginBottom: 8 }}>
          <strong>{store.panel.title}</strong> | Active: {store.active ? "Yes" : "No"} | Items: {store.items.length}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(160px,1fr))", gap: 10 }}>
          {store.items.slice(0, 10).map((it) => (
            <div key={it.id} style={{ border: "1px solid rgba(255,0,0,.28)", borderRadius: 10, padding: 10, background: "rgba(0,0,0,.35)" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name || "Unnamed"}</div>
              <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>{it.type.toUpperCase()}</div>
              <div style={{ marginTop: 8, color: "#fde68a", fontWeight: 800 }}>{ecoCmd.currency.symbol} {Number(it.priceCoins || 0).toLocaleString()}</div>
              <div style={{ marginTop: 6, fontSize: 11, color: it.enabled ? "#86efac" : "#fca5a5" }}>{it.enabled ? "Enabled" : "Disabled"}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Progression And Game Reward Feed">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 12 }}>
          <label><input type="checkbox" checked={progression.active} onChange={(e) => setProgression((p) => ({ ...p, active: e.target.checked }))} /> Progression Active</label>
          <label><input type="checkbox" checked={progression.xp.enabled} onChange={(e) => setProgression((p) => ({ ...p, xp: { ...p.xp, enabled: e.target.checked } }))} /> XP Enabled</label>
          <label><input type="checkbox" checked={progression.achievements.enabled} onChange={(e) => setProgression((p) => ({ ...p, achievements: { ...p.achievements, enabled: e.target.checked } }))} /> Achievements Enabled</label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(160px,1fr))", gap: 10, marginTop: 12 }}>
          <label><input type="checkbox" checked={progression.achievements.categoriesEnabled.messages} onChange={(e) => setProgression((p) => ({ ...p, achievements: { ...p.achievements, categoriesEnabled: { ...p.achievements.categoriesEnabled, messages: e.target.checked } } }))} /> Messages</label>
          <label><input type="checkbox" checked={progression.achievements.categoriesEnabled.invites} onChange={(e) => setProgression((p) => ({ ...p, achievements: { ...p.achievements, categoriesEnabled: { ...p.achievements.categoriesEnabled, invites: e.target.checked } } }))} /> Invites</label>
          <label><input type="checkbox" checked={progression.achievements.categoriesEnabled.economy} onChange={(e) => setProgression((p) => ({ ...p, achievements: { ...p.achievements, categoriesEnabled: { ...p.achievements.categoriesEnabled, economy: e.target.checked } } }))} /> Economy</label>
          <label><input type="checkbox" checked={progression.achievements.categoriesEnabled.games} onChange={(e) => setProgression((p) => ({ ...p, achievements: { ...p.achievements, categoriesEnabled: { ...p.achievements.categoriesEnabled, games: e.target.checked } } }))} /> Games</label>
          <label><input type="checkbox" checked={progression.achievements.categoriesEnabled.governance} onChange={(e) => setProgression((p) => ({ ...p, achievements: { ...p.achievements, categoriesEnabled: { ...p.achievements.categoriesEnabled, governance: e.target.checked } } }))} /> Governance</label>
        </div>

        <div style={{ marginTop: 12, color: "#fca5a5", fontSize: 12 }}>
          Level coin reward milestones: {progression.rewards.levelCoinRewards.length}
        </div>
      </Section>

      <Section title="Currency Profile">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
          <div>
            <div style={{ marginBottom: 6, color: "#fca5a5", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Currency Name</div>
            <input style={input} value={ecoCmd.currency.name} onChange={(e) => setEcoCmd((p) => ({ ...p, currency: { ...p.currency, name: e.target.value } }))} />
          </div>
          <div>
            <div style={{ marginBottom: 6, color: "#fca5a5", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Symbol</div>
            <input style={input} value={ecoCmd.currency.symbol} onChange={(e) => setEcoCmd((p) => ({ ...p, currency: { ...p.currency, symbol: e.target.value } }))} />
          </div>
          <div>
            <div style={{ marginBottom: 6, color: "#fca5a5", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Starting Balance</div>
            <input type="number" style={input} value={ecoCmd.currency.startingBalance} onChange={(e) => setEcoCmd((p) => ({ ...p, currency: { ...p.currency, startingBalance: Number(e.target.value || 0) } }))} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ marginBottom: 6, color: "#fca5a5", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</div>
          <textarea style={{ ...input, minHeight: 70 }} value={ecoCmd.currency.notes} onChange={(e) => setEcoCmd((p) => ({ ...p, currency: { ...p.currency, notes: e.target.value } }))} />
        </div>
      </Section>

      <Section title="Economy Commands">
        <div style={{ marginBottom: 10 }}>
          <input style={input} placeholder="Search commands" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {filteredCommands.map((cmd) => (
            <div key={cmd.id} style={{ border: "1px solid rgba(255,0,0,.22)", borderRadius: 8, padding: "10px 12px", background: "rgba(0,0,0,.28)", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>/ {cmd.label}</div>
                <div style={{ color: "#fca5a5", fontSize: 12 }}>{cmd.description}</div>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={cmd.enabled}
                  onChange={(e) => {
                    const next = ecoCmd.commands.map((x) => (x.id === cmd.id ? { ...x, enabled: e.target.checked } : x));
                    setEcoCmd((p) => ({ ...p, commands: next }));
                  }}
                />
                {cmd.enabled ? "ON" : "OFF"}
              </label>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
