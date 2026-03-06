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
    bronze: { enabled: true, monthlyUsd: 1.74, yearlyUsd: 14.99, includedMessages: 200, includedImages: 20, includedBackstory: 20 },
    silver: { enabled: true, monthlyUsd: 3.49, yearlyUsd: 29.99, includedMessages: 500, includedImages: 50, includedBackstory: 50 },
    gold: { enabled: true, monthlyUsd: 8.74, yearlyUsd: 74.99, includedMessages: 2500, includedImages: 200, includedBackstory: 200 },
    platinum: { enabled: true, monthlyUsd: 34.99, yearlyUsd: 299.99, includedMessages: 10000, includedImages: 1000, includedBackstory: 1000 },
    diamond: { enabled: true, monthlyUsd: 13.99, yearlyUsd: 119.99, includedMessages: 5000, includedImages: 500, includedBackstory: 500 },
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

export default function AiPricingPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [aiEnabled, setAiEnabled] = useState(false);
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

        setAiEnabled(!!dJson?.config?.features?.aiEnabled);

        const incoming = pJson?.config || {};
        const next = { ...DEFAULT_CFG, ...incoming };
        for (const k of PLAN_KEYS) {
          next.plans[k] = { ...DEFAULT_CFG.plans[k], ...(incoming?.plans?.[k] || {}) };
        }
        next.overage = { ...DEFAULT_CFG.overage, ...(incoming?.overage || {}) };
        next.features = { ...DEFAULT_CFG.features, ...(incoming?.features || {}) };
        setCfg(next);
      } catch {
        setMsg("Failed to load AI config.");
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
      const dRes = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { features: { aiEnabled } } }),
      });
      const dJson = await dRes.json();
      if (!dRes.ok || dJson?.success === false) throw new Error(dJson?.error || "Failed saving AI feature toggle.");

      const pRes = await fetch("/api/setup/ai-pricing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config: cfg }),
      });
      const pJson = await pRes.json();
      if (!pRes.ok || pJson?.success === false) throw new Error(pJson?.error || "Failed saving AI pricing config.");

      setMsg("AI pricing saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={wrap}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0, letterSpacing: "0.16em", textTransform: "uppercase" }}>AI Pricing + Personas</h1>
        <button style={btn} disabled={saving} onClick={saveAll}>{saving ? "Saving..." : "Save AI Pricing"}</button>
      </div>

      <p>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>
      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Master</h3>
        <label style={{ marginRight: 16 }}>
          <input type="checkbox" checked={aiEnabled} onChange={(e) => setAiEnabled(e.target.checked)} />
          AI Engine Enabled
        </label>
        <label style={{ marginRight: 16 }}>
          <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} />
          Pricing Active
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
        <h3 style={{ marginTop: 0 }}>Plans (Owner Editable)</h3>
        {PLAN_KEYS.map((k) => {
          const p = cfg.plans[k];
          return (
            <div key={k} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
                <label><input type="checkbox" checked={p.enabled} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [k]: { ...p, enabled: e.target.checked } } })} /> {k.toUpperCase()}</label>
                <div><label>Monthly USD</label><input style={input} type="number" step="0.01" value={p.monthlyUsd} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [k]: { ...p, monthlyUsd: n(e.target.value, p.monthlyUsd, 0, 100000) } } })} /></div>
                <div><label>Yearly USD</label><input style={input} type="number" step="0.01" value={p.yearlyUsd} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [k]: { ...p, yearlyUsd: n(e.target.value, p.yearlyUsd, 0, 100000) } } })} /></div>
                <div><label>Included msgs</label><input style={input} type="number" value={p.includedMessages} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [k]: { ...p, includedMessages: n(e.target.value, p.includedMessages, 0, 100000000) } } })} /></div>
                <div><label>Included images</label><input style={input} type="number" value={p.includedImages} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [k]: { ...p, includedImages: n(e.target.value, p.includedImages, 0, 100000000) } } })} /></div>
                <div><label>Included backstory</label><input style={input} type="number" value={p.includedBackstory} onChange={(e) => setCfg({ ...cfg, plans: { ...cfg.plans, [k]: { ...p, includedBackstory: n(e.target.value, p.includedBackstory, 0, 100000000) } } })} /></div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={box}>
        <h3 style={{ marginTop: 0 }}>Overage Pricing (Owner Editable)</h3>
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

      <button style={btn} disabled={saving} onClick={saveAll}>{saving ? "Saving..." : "Save AI Pricing"}</button>
    </div>
  );
}
