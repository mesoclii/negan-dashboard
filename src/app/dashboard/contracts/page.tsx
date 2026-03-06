"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string; type?: number | string };

type ContractsCfg = {
  enabled: boolean;
  dailyCap: number;
  weeklyCap: number;
  baseRewardCoins: number;
  xpReward: number;
  allowStacking: boolean;
  logChannelId: string;
};

const DEFAULT_CONTRACTS: ContractsCfg = {
  enabled: true,
  dailyCap: 5,
  weeklyCap: 20,
  baseRewardCoins: 250,
  xpReward: 50,
  allowStacking: false,
  logChannelId: "",
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };

export default function ContractsEnginePage() {
  const [guildId, setGuildId] = useState("");
  const [active, setActive] = useState(true);
  const [cfg, setCfg] = useState<ContractsCfg>(DEFAULT_CONTRACTS);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const [govRes, gdRes] = await Promise.all([
          fetch(`/api/setup/governance-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const govJson = await govRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        setActive(govJson?.config?.active ?? true);
        setCfg({ ...DEFAULT_CONTRACTS, ...(govJson?.config?.contracts || {}) });
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load contracts config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/setup/governance-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { active, contracts: cfg } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setActive(json?.config?.active ?? active);
      setCfg({ ...DEFAULT_CONTRACTS, ...(json?.config?.contracts || cfg) });
      setMsg("Contracts engine settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Contracts Engine</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {typeof window !== "undefined" ? (localStorage.getItem("activeGuildName") || guildId) : guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>Dedicated controls for contract progression and payouts. Saves to governance-config without touching crew/dominion.</div>
      {msg ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{msg}</div> : null}

      {loading ? (
        <div style={card}>Loading contracts...</div>
      ) : (
        <>
          <section style={card}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Governance Active</label>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Contracts Enabled</label>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ marginBottom: 6 }}>Log Channel</div>
                <select style={input} value={cfg.logChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, logChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Daily Contract Cap</div>
                <input style={input} type="number" min={0} value={cfg.dailyCap} onChange={(e) => setCfg((p) => ({ ...p, dailyCap: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Weekly Contract Cap</div>
                <input style={input} type="number" min={0} value={cfg.weeklyCap} onChange={(e) => setCfg((p) => ({ ...p, weeklyCap: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Base Reward (coins)</div>
                <input style={input} type="number" min={0} value={cfg.baseRewardCoins} onChange={(e) => setCfg((p) => ({ ...p, baseRewardCoins: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>XP Reward</div>
                <input style={input} type="number" min={0} value={cfg.xpReward} onChange={(e) => setCfg((p) => ({ ...p, xpReward: Number(e.target.value || 0) }))} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <input id="stacking" type="checkbox" checked={cfg.allowStacking} onChange={(e) => setCfg((p) => ({ ...p, allowStacking: e.target.checked }))} />
                <label htmlFor="stacking">Allow stacking multiple contracts</label>
              </div>
            </div>
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}
            >
              {saving ? "Saving..." : "Save Contracts"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}