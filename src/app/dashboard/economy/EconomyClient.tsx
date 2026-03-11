"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { resolveGuildContext, fetchRuntimeEngine, saveRuntimeEngine, fetchDashboardConfig, saveDashboardConfig } from "@/lib/liveRuntime";

type EnginePayload = {
  config?: Record<string, any>;
  summary?: Array<{ label: string; value: string }>;
};

type EngineKey = "store" | "progression" | "inviteTracker" | "radio" | "giveaways";

const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.28)",
  borderRadius: 12,
  background: "rgba(38,0,0,.24)",
  marginBottom: 14,
  padding: 14,
};

const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid rgba(255,0,0,.35)",
  color: "#ffd1d1",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 14,
};

const LINKS: Array<{ engine: EngineKey; href: string; title: string; description: string }> = [
  { engine: "store", href: "/dashboard/economy/store", title: "Store", description: "Catalog, stock, pricing, and role/item grant behavior." },
  { engine: "progression", href: "/dashboard/economy/progression", title: "Progression", description: "XP intake, level rewards, multipliers, and anti-abuse." },
  { engine: "inviteTracker", href: "/dashboard/economy/leaderboard", title: "Invite Tracker", description: "Invite leaderboard routing and recruiter thresholds." },
  { engine: "radio", href: "/dashboard/economy/radio-birthday", title: "Birthdays", description: "Birthday rewards, broadcast routing, and radio profile state." },
  { engine: "giveaways", href: "/dashboard/giveaways", title: "Giveaways", description: "Giveaway lifecycle, host rules, and prize controls." },
];

export default function EconomyClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [economyEnabled, setEconomyEnabled] = useState(true);
  const [engines, setEngines] = useState<Record<EngineKey, EnginePayload>>({
    store: {},
    progression: {},
    inviteTracker: {},
    radio: {},
    giveaways: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const resolved = resolveGuildContext();
    setGuildId(resolved.guildId);
    setGuildName(resolved.guildName);
  }, []);

  async function loadAll(targetGuildId: string) {
    if (!targetGuildId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const [dashboard, ...runtimeEntries] = await Promise.all([
        fetchDashboardConfig(targetGuildId),
        ...LINKS.map(async (entry) => {
          const json = await fetchRuntimeEngine(targetGuildId, entry.engine);
          return [entry.engine, { config: json?.config || {}, summary: Array.isArray(json?.summary) ? json.summary : [] }] as const;
        }),
      ]);
      setEconomyEnabled(Boolean(dashboard?.features?.economyEnabled));
      setEngines(Object.fromEntries(runtimeEntries) as Record<EngineKey, EnginePayload>);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load economy hub.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll(guildId);
  }, [guildId]);

  async function saveFeature(next: boolean) {
    if (!guildId) return;
    try {
      setSaving(true);
      setMessage("");
      await saveDashboardConfig(guildId, { features: { economyEnabled: next } });
      setEconomyEnabled(next);
      setMessage(`Economy feature gate ${next ? "enabled" : "disabled"}.`);
    } catch (err: any) {
      setMessage(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEngine(engine: EngineKey, patch: Record<string, unknown>, okLabel: string) {
    if (!guildId) return;
    try {
      setSaving(true);
      setMessage("");
      const json = await saveRuntimeEngine(guildId, engine, patch);
      setEngines((prev) => ({
        ...prev,
        [engine]: { config: json?.config || {}, summary: Array.isArray(json?.summary) ? json.summary : [] },
      }));
      setMessage(okLabel);
    } catch (err: any) {
      setMessage(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId && !loading) {
    return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from `/guilds` first.</div>;
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", color: "#f8b4b4" }}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ff4a4a" }}>Economy Hub</h1>
            <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {guildName || guildId}</div>
            <div style={{ color: "#ffb5b5", fontSize: 12, marginTop: 8 }}>
              This hub now reads live engines directly. The old economy command/currency shadow config has been removed because it was not mapped to bot runtime.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ color: "#fff", fontWeight: 800 }}>
              <input type="checkbox" checked={economyEnabled} onChange={(event) => void saveFeature(event.target.checked)} /> Economy feature gate
            </label>
            <Link href={`/dashboard/slash-commands?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Native Commands</Link>
          </div>
        </div>
        {message ? <div style={{ marginTop: 10, color: "#ffd27a" }}>{message}</div> : null}
      </div>

      {loading ? <div style={card}>Loading live economy engines...</div> : null}

      {!loading ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 12 }}>
            {LINKS.map((entry) => (
              <div key={entry.engine} style={card}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffadad" }}>{entry.title}</div>
                <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#fff" }}>{(engines[entry.engine].summary || [])[0]?.value || "Unknown"}</div>
                <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 8 }}>{entry.description}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Engine Controls</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
              <div style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Store</div>
                <label><input type="checkbox" checked={Boolean(engines.store.config?.active)} onChange={(event) => void saveEngine("store", { active: event.target.checked }, `Store ${event.target.checked ? "enabled" : "disabled"}.`)} /> Active</label>
                <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 8 }}>{(engines.store.summary || []).map((row) => `${row.label}: ${row.value}`).join(" | ")}</div>
                <div style={{ marginTop: 10 }}><Link href={`/dashboard/economy/store?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Store</Link></div>
              </div>

              <div style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Progression</div>
                <label><input type="checkbox" checked={Boolean(engines.progression.config?.active)} onChange={(event) => void saveEngine("progression", { active: event.target.checked }, `Progression ${event.target.checked ? "enabled" : "disabled"}.`)} /> Active</label>
                <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 8 }}>{(engines.progression.summary || []).map((row) => `${row.label}: ${row.value}`).join(" | ")}</div>
                <div style={{ marginTop: 10 }}><Link href={`/dashboard/economy/progression?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Progression</Link></div>
              </div>

              <div style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Invite Tracker</div>
                <label><input type="checkbox" checked={Boolean(engines.inviteTracker.config?.enabled)} onChange={(event) => void saveEngine("inviteTracker", { enabled: event.target.checked }, `Invite Tracker ${event.target.checked ? "enabled" : "disabled"}.`)} /> Enabled</label>
                <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 8 }}>{(engines.inviteTracker.summary || []).map((row) => `${row.label}: ${row.value}`).join(" | ")}</div>
                <div style={{ marginTop: 10 }}><Link href={`/dashboard/economy/leaderboard?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Invite Leaderboard</Link></div>
              </div>

              <div style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Birthdays</div>
                <label><input type="checkbox" checked={Boolean(engines.radio.config?.birthday?.enabled)} onChange={(event) => void saveEngine("radio", { birthday: { enabled: event.target.checked } }, `Birthday rewards ${event.target.checked ? "enabled" : "disabled"}.`)} /> Birthday rewards enabled</label>
                <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 8 }}>{(engines.radio.summary || []).map((row) => `${row.label}: ${row.value}`).join(" | ")}</div>
                <div style={{ marginTop: 10 }}><Link href={`/dashboard/economy/radio-birthday?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Birthdays</Link></div>
              </div>

              <div style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12 }}>
                <div style={{ fontWeight: 900, marginBottom: 8 }}>Giveaways</div>
                <label><input type="checkbox" checked={Boolean(engines.giveaways.config?.active)} onChange={(event) => void saveEngine("giveaways", { active: event.target.checked }, `Giveaways ${event.target.checked ? "enabled" : "disabled"}.`)} /> Active</label>
                <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 8 }}>{(engines.giveaways.summary || []).map((row) => `${row.label}: ${row.value}`).join(" | ")}</div>
                <div style={{ marginTop: 10 }}><Link href={`/dashboard/giveaways?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Giveaways</Link></div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
