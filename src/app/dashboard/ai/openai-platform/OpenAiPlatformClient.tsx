"use client";

import { useEffect, useState, type CSSProperties } from "react";

type PlanKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";
type Plan = {
  enabled: boolean;
  monthlyUsd: number;
  yearlyUsd: number;
  includedMessages: number;
  includedImages: number;
  includedBackstory: number;
};
type AiPricingConfig = {
  active: boolean;
  publicCatalogEnabled: boolean;
  nsfwAllowed: boolean;
  plans: Record<PlanKey, Plan>;
  overage: {
    per1kTextTokensUsd: number;
    perImageUsd: number;
    per1kTtsCharsUsd: number;
  };
  features: {
    writeEnabled: boolean;
    imagineEnabled: boolean;
    backstoryEnabled: boolean;
    charactersEnabled: boolean;
  };
  notes: string;
};

const PLAN_KEYS: PlanKey[] = ["bronze", "silver", "gold", "platinum", "diamond"];

const DEFAULT_CFG: AiPricingConfig = {
  active: true,
  publicCatalogEnabled: false,
  nsfwAllowed: false,
  plans: {
    bronze: { enabled: true, monthlyUsd: 1.15, yearlyUsd: 9.99, includedMessages: 200, includedImages: 20, includedBackstory: 20 },
    silver: { enabled: true, monthlyUsd: 2.29, yearlyUsd: 19.99, includedMessages: 500, includedImages: 50, includedBackstory: 50 },
    gold: { enabled: true, monthlyUsd: 5.79, yearlyUsd: 49.99, includedMessages: 2500, includedImages: 200, includedBackstory: 200 },
    platinum: { enabled: true, monthlyUsd: 22.99, yearlyUsd: 199.99, includedMessages: 10000, includedImages: 1000, includedBackstory: 1000 },
    diamond: { enabled: true, monthlyUsd: 9.19, yearlyUsd: 79.99, includedMessages: 5000, includedImages: 500, includedBackstory: 500 },
  },
  overage: { per1kTextTokensUsd: 0.02, perImageUsd: 0.05, per1kTtsCharsUsd: 0.01 },
  features: { writeEnabled: true, imagineEnabled: true, backstoryEnabled: true, charactersEnabled: true },
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

function n(v: string, fallback: number, min = 0, max = 100000000): number {
  const x = Number(v);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
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

export default function OpenAiPlatformClient() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [legacyAiEnabled, setLegacyAiEnabled] = useState(false);
  const [cfg, setCfg] = useState<AiPricingConfig>(DEFAULT_CFG);

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
        const [dRes, pRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/setup/ai-pricing-config?guildId=${encodeURIComponent(guildId)}`),
        ]);

        const dJson = await dRes.json();
        const pJson = await pRes.json();

        setLegacyAiEnabled(!!dJson?.config?.features?.aiEnabled);

        const incoming = pJson?.config || {};
        const next = { ...DEFAULT_CFG, ...incoming };
        for (const key of PLAN_KEYS) {
          next.plans[key] = { ...DEFAULT_CFG.plans[key], ...(incoming?.plans?.[key] || {}) };
        }
        next.overage = { ...DEFAULT_CFG.overage, ...(incoming?.overage || {}) };
        next.features = { ...DEFAULT_CFG.features, ...(incoming?.features || {}) };
        setCfg(next);
      } catch {
        setMsg("Failed to load OpenAI platform config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const pRes = await fetch("/api/setup/ai-pricing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config: cfg }),
      });
      const pJson = await pRes.json();
      if (!pRes.ok || pJson?.success === false) throw new Error(pJson?.error || "Failed saving OpenAI platform config.");

      setMsg("OpenAI platform saved.");
    } catch (err: any) {
      setMsg(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, letterSpacing: "0.16em", textTransform: "uppercase" }}>OpenAI Platform</h1>
        <button style={btn} disabled={saving} onClick={saveAll}>{saving ? "Saving..." : "Save OpenAI Platform"}</button>
      </div>

      <p>Guild: {typeof window !== "undefined" ? (localStorage.getItem("activeGuildName") || guildId) : guildId}</p>
      <p style={{ color: "#ffb0b0" }}>
        This page is the provider and pricing side of AI. It is separate from the Bot Knowledge Base and from the persona roster trigger system.
      </p>
      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Master</h3>
        <div style={{ color: "#ffbdbd", marginBottom: 10 }}>
          Legacy AI fallback: <strong>{legacyAiEnabled ? "On" : "Off"}</strong>
        </div>
        <label style={{ marginRight: 16 }}>
          <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} />
          Platform Active
        </label>
        <label style={{ marginRight: 16 }}>
          <input type="checkbox" checked={cfg.publicCatalogEnabled} onChange={(e) => setCfg({ ...cfg, publicCatalogEnabled: e.target.checked })} />
          Public Character Catalog
        </label>
        <label>
          <input type="checkbox" checked={cfg.nsfwAllowed} onChange={(e) => setCfg({ ...cfg, nsfwAllowed: e.target.checked })} />
          NSFW Allowed
        </label>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Feature Gates</h3>
        <label style={{ marginRight: 14 }}><input type="checkbox" checked={cfg.features.writeEnabled} onChange={(e) => setCfg({ ...cfg, features: { ...cfg.features, writeEnabled: e.target.checked } })} /> Write</label>
        <label style={{ marginRight: 14 }}><input type="checkbox" checked={cfg.features.imagineEnabled} onChange={(e) => setCfg({ ...cfg, features: { ...cfg.features, imagineEnabled: e.target.checked } })} /> Imagine</label>
        <label style={{ marginRight: 14 }}><input type="checkbox" checked={cfg.features.backstoryEnabled} onChange={(e) => setCfg({ ...cfg, features: { ...cfg.features, backstoryEnabled: e.target.checked } })} /> Backstory</label>
        <label><input type="checkbox" checked={cfg.features.charactersEnabled} onChange={(e) => setCfg({ ...cfg, features: { ...cfg.features, charactersEnabled: e.target.checked } })} /> Characters</label>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Plans</h3>
        {PLAN_KEYS.map((key) => {
          const plan = cfg.plans[key];
          return (
            <div key={key} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                <label><input type="checkbox" checked={plan.enabled} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [key]: { ...plan, enabled: e.target.checked } } })} /> {key.toUpperCase()}</label>
                <div><label>Monthly USD</label><input style={input} type="number" step="0.01" value={plan.monthlyUsd} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [key]: { ...plan, monthlyUsd: n(e.target.value, plan.monthlyUsd, 0, 100000) } } })} /></div>
                <div><label>Yearly USD</label><input style={input} type="number" step="0.01" value={plan.yearlyUsd} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [key]: { ...plan, yearlyUsd: n(e.target.value, plan.yearlyUsd, 0, 100000) } } })} /></div>
                <div><label>Included msgs</label><input style={input} type="number" value={plan.includedMessages} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [key]: { ...plan, includedMessages: n(e.target.value, plan.includedMessages, 0, 100000000) } } })} /></div>
                <div><label>Included images</label><input style={input} type="number" value={plan.includedImages} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [key]: { ...plan, includedImages: n(e.target.value, plan.includedImages, 0, 100000000) } } })} /></div>
                <div><label>Included backstory</label><input style={input} type="number" value={plan.includedBackstory} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [key]: { ...plan, includedBackstory: n(e.target.value, plan.includedBackstory, 0, 100000000) } } })} /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Overage Pricing</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div>
            <label>Per 1k text tokens (USD)</label>
            <input style={input} type="number" step="0.0001" value={cfg.overage.per1kTextTokensUsd} onChange={(e) => setCfg({ ...cfg, overage: { ...cfg.overage, per1kTextTokensUsd: n(e.target.value, cfg.overage.per1kTextTokensUsd, 0, 1000) } })} />
          </div>
          <div>
            <label>Per image (USD)</label>
            <input style={input} type="number" step="0.0001" value={cfg.overage.perImageUsd} onChange={(e) => setCfg({ ...cfg, overage: { ...cfg.overage, perImageUsd: n(e.target.value, cfg.overage.perImageUsd, 0, 1000) } })} />
          </div>
          <div>
            <label>Per 1k TTS chars (USD)</label>
            <input style={input} type="number" step="0.0001" value={cfg.overage.per1kTtsCharsUsd} onChange={(e) => setCfg({ ...cfg, overage: { ...cfg.overage, per1kTtsCharsUsd: n(e.target.value, cfg.overage.per1kTtsCharsUsd, 0, 1000) } })} />
          </div>
        </div>
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Notes</h3>
        <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
      </div>

      <button style={btn} disabled={saving} onClick={saveAll}>{saving ? "Saving..." : "Save OpenAI Platform"}</button>
    </div>
  );
}
