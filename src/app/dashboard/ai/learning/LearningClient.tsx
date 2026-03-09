"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import AiTabs from "@/components/possum/AiTabs";
import EngineInsights from "@/components/possum/EngineInsights";
import type { EngineDetails, EngineSummaryItem } from "@/components/possum/useGuildEngineEditor";
import { buildDashboardHref } from "@/lib/dashboardContext";

type PossumSettings = {
  mode: string;
  autoReplies: boolean;
  toneIntensity: number;
  sarcasmLevel: number;
  seriousness: number;
  verbosity: number;
  gamerMode: boolean;
  regionAware: boolean;
  escalationOn: boolean;
};

const DEFAULT_SETTINGS: PossumSettings = {
  mode: "savage",
  autoReplies: true,
  toneIntensity: 5,
  sarcasmLevel: 5,
  seriousness: 5,
  verbosity: 5,
  gamerMode: false,
  regionAware: true,
  escalationOn: true,
};

const wrap: CSSProperties = { color: "#ffd0d0", maxWidth: 1360 };
const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.36)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(100,0,0,.10)",
  marginBottom: 12,
};
const action: CSSProperties = {
  border: "1px solid #7a0000",
  borderRadius: 10,
  background: "#130707",
  color: "#ffd7d7",
  padding: "10px 12px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  cursor: "pointer",
  textDecoration: "none",
};
const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid rgba(255,0,0,.45)",
  color: "#ffd5d5",
  borderRadius: 8,
  padding: "10px 12px",
};

const PIPELINE_STEPS = [
  {
    title: "Runtime Router",
    detail:
      "Guild messages enter engine/runtimeRouter.js, where the adaptive path checks the Possum AI runtime flag, runs learning writes, and decides whether to answer ambiently or directly.",
  },
  {
    title: "Tone + Topic Learning",
    detail:
      "engine/possumIntelligence.js scores profanity/aggression, detects topic families like gta, tech, moderation, economy, and community, then updates persistent user and channel profiles.",
  },
  {
    title: "Adaptive Core",
    detail:
      "core/possumEngine.js and core/possum/possumEngine.js handle intent, routing, region, escalation, and response-bank selection for the homemade assistant path.",
  },
  {
    title: "Synthesis",
    detail:
      "core/possum/possumSynthesisEngine.js reads learned profiles and stored knowledge to build replies that feel adaptive instead of static.",
  },
  {
    title: "Outbound Delivery",
    detail:
      "Adaptive replies are sent through guildAdaptiveWebhookService first when possible, then fall back to normal message replies if the webhook route is unavailable.",
  },
];

const ACTIVE_MODULES = [
  "engine/runtimeRouter.js",
  "engine/possumIntelligence.js",
  "engine/aiIntelligenceEngine.js",
  "core/assistantEngine.js",
  "core/possumEngine.js",
  "core/possumIntent.js",
  "core/possumToneResolver.js",
  "core/possum/possumEngine.js",
  "core/possum/possumRouter.js",
  "core/possum/possumSelector.js",
  "core/possum/possumRegion.js",
  "core/possum/possumBanks.js",
  "core/possum/possumControl.js",
  "core/possum/possumEscalation.js",
  "core/possum/possumSynthesisEngine.js",
];

const DATA_ASSETS = [
  "data/negan/authority.*",
  "data/negan/ambient.*",
  "data/negan/gta.*",
  "data/negan/tech.*",
  "data/negan/regions.*",
  "data/negan/monologues.*",
  "data/negan/rockstar/*",
];

const PERSISTENCE_MODELS = [
  "PossumGuildConfig -> @@map(\"NeganGuildConfig\")",
  "PossumSettings -> @@map(\"NeganSettings\")",
  "PossumUserProfile -> @@map(\"NeganUserProfile\")",
  "PossumChannelProfile -> @@map(\"NeganChannelProfile\")",
  "PossumKnowledge -> @@map(\"NeganKnowledge\")",
  "PossumGovernor -> @@map(\"NeganGovernor\")",
  "PossumProfile -> @@map(\"NeganProfile\")",
];

const LEARNING_WRITES = [
  "User profile updates: rolling tone averages, interaction count, dominant topics",
  "Channel profile updates: average profanity, dominant topics, activity score",
  "Knowledge storage: snippets of longer messages stored by topic and source user",
  "No Persona AI writes into these adaptive profile tables",
];

const SLIDER_FIELDS: Array<{
  key: keyof Pick<PossumSettings, "toneIntensity" | "sarcasmLevel" | "seriousness" | "verbosity">;
  label: string;
  description: string;
}> = [
  { key: "toneIntensity", label: "Tone Intensity", description: "How hard the adaptive tone resolver pushes the Possum response profile." },
  { key: "sarcasmLevel", label: "Sarcasm Level", description: "Stored per guild for the Possum AI response profile." },
  { key: "seriousness", label: "Seriousness", description: "How grounded vs playful the adaptive profile should feel." },
  { key: "verbosity", label: "Verbosity", description: "How short or long adaptive replies should trend." },
];

function resolveGuild() {
  if (typeof window === "undefined") return { guildId: "", guildName: "" };
  const params = new URLSearchParams(window.location.search);
  const guildId = (params.get("guildId") || localStorage.getItem("activeGuildId") || "").trim();
  const guildName = (localStorage.getItem("activeGuildName") || guildId).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return { guildId, guildName };
}

async function readJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

export default function LearningClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [personaEnabled, setPersonaEnabled] = useState(false);
  const [settings, setSettings] = useState<PossumSettings>(DEFAULT_SETTINGS);
  const [summary, setSummary] = useState<EngineSummaryItem[]>([]);
  const [details, setDetails] = useState<EngineDetails>({});

  async function loadAll(targetGuildId: string, targetGuildName: string) {
    if (!targetGuildId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const [runtimeRes, settingsRes] = await Promise.all([
        fetch(`/api/setup/runtime-engine?guildId=${encodeURIComponent(targetGuildId)}&engine=runtimeRouter`, {
          cache: "no-store",
        }),
        fetch(`/api/bot/possum-settings?guildId=${encodeURIComponent(targetGuildId)}`, {
          cache: "no-store",
        }),
      ]);

      const runtimeJson = await readJsonOrThrow(runtimeRes);
      const settingsJson = await readJsonOrThrow(settingsRes);

      setGuildName(targetGuildName);
      setAdaptiveEnabled(runtimeJson?.config?.adaptiveAiEnabled !== false);
      setPersonaEnabled(Boolean(runtimeJson?.config?.personaAiEnabled));
      setSummary(Array.isArray(runtimeJson?.summary) ? runtimeJson.summary : []);
      setDetails((runtimeJson?.details && typeof runtimeJson.details === "object") ? runtimeJson.details : {});
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(settingsJson?.config || {}),
      });
    } catch (err: any) {
      setMessage(err?.message || "Failed to load Possum AI.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const resolved = resolveGuild();
    setGuildId(resolved.guildId);
    setGuildName(resolved.guildName);
    void loadAll(resolved.guildId, resolved.guildName);
  }, []);

  async function setAdaptiveRuntime(next: boolean) {
    if (!guildId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/setup/runtime-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          engine: "runtimeRouter",
          patch: { adaptiveAiEnabled: next },
        }),
      });
      const json = await readJsonOrThrow(res);
      setAdaptiveEnabled(next);
      setSummary(Array.isArray(json?.summary) ? json.summary : []);
      setDetails((json?.details && typeof json.details === "object") ? json.details : {});
      setMessage(`Possum AI ${next ? "enabled" : "disabled"} for this guild.`);
    } catch (err: any) {
      setMessage(err?.message || "Failed to update Possum AI runtime.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSettings() {
    if (!guildId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/bot/possum-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: settings,
        }),
      });
      const json = await readJsonOrThrow(res);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(json?.config || {}),
      });
      setMessage("Saved Possum AI guild settings.");
      await loadAll(guildId, guildName);
    } catch (err: any) {
      setMessage(err?.message || "Failed to save Possum AI.");
    } finally {
      setSaving(false);
    }
  }

  async function resetSettings() {
    if (!guildId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/bot/possum-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          reset: true,
        }),
      });
      const json = await readJsonOrThrow(res);
      setSettings({
        ...DEFAULT_SETTINGS,
        ...(json?.config || {}),
      });
      setMessage("Reset Possum AI guild settings to defaults.");
      await loadAll(guildId, guildName);
    } catch (err: any) {
      setMessage(err?.message || "Failed to reset Possum AI.");
    } finally {
      setSaving(false);
    }
  }

  async function runtimeAction(actionName: "clearReplyMemory" | "wipeProfiles" | "wipeKnowledge") {
    if (!guildId) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/setup/runtime-engine-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          engine: "runtimeRouter",
          action: actionName,
        }),
      });
      const json = await readJsonOrThrow(res);
      setSummary(Array.isArray(json?.summary) ? json.summary : []);
      setDetails((json?.details && typeof json.details === "object") ? json.details : {});
      setMessage("Possum AI runtime action completed.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to run runtime action.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff8585", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={wrap}>
      <AiTabs current="possum" />

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, color: "#ff4a4a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Possum AI
            </h1>
            <div style={{ color: "#ff9f9f", marginTop: 8 }}>Guild: {guildName || guildId}</div>
            <div style={{ color: "#ffb5b5", fontSize: 12, marginTop: 8, maxWidth: 980 }}>
              Possum AI is the homemade adaptive assistant path. These controls are guild-scoped and write into the live
              bot runtime, not a dashboard-only stub. Persona AI remains a separate premium surface.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={buildDashboardHref("/dashboard/bot-personalizer")} style={action}>
              Bot Personalizer
            </Link>
            <Link href={buildDashboardHref("/dashboard/runtime-router")} style={action}>
              Runtime Router
            </Link>
            <Link href={buildDashboardHref("/dashboard/ai/memory")} style={action}>
              Memory
            </Link>
            <Link href={buildDashboardHref("/dashboard/ai/tone")} style={action}>
              Tone
            </Link>
            <Link href={buildDashboardHref("/dashboard/ai/persona")} style={action}>
              Persona AI
            </Link>
          </div>
        </div>
        {message ? <div style={{ color: "#ffd27a", marginTop: 10 }}>{message}</div> : null}
      </section>

      {loading ? <div style={card}>Loading Possum AI...</div> : null}

      {!loading ? (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 12 }}>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Possum Runtime</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{adaptiveEnabled ? "Enabled" : "Disabled"}</div>
            </div>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Auto Replies</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{settings.autoReplies ? "On" : "Off"}</div>
            </div>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tone Intensity</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{settings.toneIntensity}/10</div>
            </div>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Adaptive Identity</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>Bot Knowledge Base</div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Guild Runtime Controls
                </div>
                <div style={{ color: "#ffbdbd", fontSize: 12, maxWidth: 900 }}>
                  These settings are specific to the selected guild. They control the adaptive Possum runtime, reply behavior,
                  tone intensity, and stored guild profile for the homemade assistant path.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void setAdaptiveRuntime(!adaptiveEnabled)}
                  disabled={saving}
                  style={action}
                >
                  {adaptiveEnabled ? "Turn Off Runtime" : "Turn On Runtime"}
                </button>
                <button
                  type="button"
                  onClick={() => void resetSettings()}
                  disabled={saving}
                  style={action}
                >
                  Reset Defaults
                </button>
                <button
                  type="button"
                  onClick={() => void saveSettings()}
                  disabled={saving}
                  style={action}
                >
                  {saving ? "Saving..." : "Save Possum AI"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
              <div>
                <label>Adaptive preset label</label>
                <input
                  style={input}
                  value={settings.mode || ""}
                  onChange={(e) => setSettings((prev) => ({ ...prev, mode: e.target.value }))}
                  placeholder="savage"
                />
                <div style={{ color: "#ff9c9c", fontSize: 11, marginTop: 6 }}>
                  Stored per guild as the Possum profile label.
                </div>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={settings.autoReplies}
                    onChange={(e) => setSettings((prev) => ({ ...prev, autoReplies: e.target.checked }))}
                  />{" "}
                  Auto replies enabled
                </label>
                <label style={{ display: "block", marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={settings.gamerMode}
                    onChange={(e) => setSettings((prev) => ({ ...prev, gamerMode: e.target.checked }))}
                  />{" "}
                  Gamer mode enabled
                </label>
                <label style={{ display: "block", marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    checked={settings.regionAware}
                    onChange={(e) => setSettings((prev) => ({ ...prev, regionAware: e.target.checked }))}
                  />{" "}
                  Region-aware replies enabled
                </label>
                <label style={{ display: "block" }}>
                  <input
                    type="checkbox"
                    checked={settings.escalationOn}
                    onChange={(e) => setSettings((prev) => ({ ...prev, escalationOn: e.target.checked }))}
                  />{" "}
                  Escalation logic enabled
                </label>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginTop: 14 }}>
              {SLIDER_FIELDS.map((field) => (
                <div key={field.key} style={{ borderTop: "1px solid #330000", paddingTop: 10 }}>
                  <div style={{ color: "#ffdcdc", fontWeight: 800 }}>{field.label}</div>
                  <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 4 }}>{field.description}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={settings[field.key]}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          [field.key]: Number(e.target.value || 5),
                        }))
                      }
                      style={{ flex: 1 }}
                    />
                    <div style={{ minWidth: 38, textAlign: "right", fontWeight: 900 }}>{settings[field.key]}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ color: "#ff9c9c", fontSize: 12, marginTop: 12 }}>
              Persona AI is currently {personaEnabled ? "enabled" : "disabled"} in this guild, but it stays fully separate from these Possum AI controls.
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Knowledge Base Operations
                </div>
                <div style={{ color: "#ffbdbd", fontSize: 12, maxWidth: 900 }}>
                  These actions hit the live adaptive runtime for this guild. Use them when you need to clear reply memory, reset learned profiles, or wipe the Possum AI knowledge base before retesting.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => void runtimeAction("clearReplyMemory")} disabled={saving} style={action}>
                  Clear Reply Memory
                </button>
                <button type="button" onClick={() => void runtimeAction("wipeProfiles")} disabled={saving} style={action}>
                  Wipe Profiles
                </button>
                <button type="button" onClick={() => void runtimeAction("wipeKnowledge")} disabled={saving} style={action}>
                  Wipe Knowledge
                </button>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Runtime Pipeline
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              {PIPELINE_STEPS.map((step, index) => (
                <div key={step.title} style={{ borderTop: "1px solid #330000", paddingTop: 10 }}>
                  <div style={{ color: "#ffdcdc", fontWeight: 800 }}>
                    {index + 1}. {step.title}
                  </div>
                  <div style={{ color: "#ffbdbd", fontSize: 12, lineHeight: 1.7, marginTop: 6 }}>{step.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Learning Writes
              </div>
              {LEARNING_WRITES.map((item) => (
                <div key={item} style={{ color: "#ffbdbd", fontSize: 12, lineHeight: 1.7, marginBottom: 8 }}>
                  {item}
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Live Separation Rules
              </div>
              <div style={{ color: "#ffbdbd", fontSize: 12, lineHeight: 1.7 }}>
                Possum AI owns the adaptive route only. Persona AI owns persona-only channels, persona keywords, and hosted
                persona prompts. Possum AI stays tied to Bot Personalizer and the guild identity layer, and Persona AI
                should never write into Possum adaptive profile tables.
              </div>
            </div>
          </section>

          <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12 }}>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Active Adaptive Modules
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {ACTIVE_MODULES.map((item) => (
                  <div key={item} style={{ color: "#ffdcdc", fontSize: 12 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Data Assets + Memory
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {DATA_ASSETS.map((item) => (
                  <div key={item} style={{ color: "#ffdcdc", fontSize: 12 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Persistence Models
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
              {PERSISTENCE_MODELS.map((item) => (
                <div key={item} style={{ color: "#ffdcdc", fontSize: 12, lineHeight: 1.7, borderTop: "1px solid #330000", paddingTop: 8 }}>
                  {item}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
