"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import AiTabs from "@/components/possum/AiTabs";
import { buildDashboardHref } from "@/lib/dashboardContext";

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

function resolveGuild() {
  if (typeof window === "undefined") return { guildId: "", guildName: "" };
  const params = new URLSearchParams(window.location.search);
  const guildId = (params.get("guildId") || localStorage.getItem("activeGuildId") || "").trim();
  const guildName = (localStorage.getItem("activeGuildName") || guildId).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return { guildId, guildName };
}

export default function LearningClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [personaEnabled, setPersonaEnabled] = useState(false);

  useEffect(() => {
    const resolved = resolveGuild();
    setGuildId(resolved.guildId);
    setGuildName(resolved.guildName);

    if (!resolved.guildId) return;
    (async () => {
      const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(resolved.guildId)}`, {
        cache: "no-store",
      }).catch(() => null);
      const json = await res?.json().catch(() => ({}));
      setAdaptiveEnabled(
        Boolean(json?.config?.aiRuntime?.adaptiveAiEnabled ?? json?.config?.features?.adaptiveAiEnabled)
      );
      setPersonaEnabled(
        Boolean(json?.config?.aiRuntime?.personaAiEnabled ?? json?.config?.features?.personaAiEnabled)
      );
    })();
  }, []);

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
              This is the full homemade adaptive assistant surface: runtime routing, learning writes, tone/topic
              profiling, knowledge storage, and handcrafted reply synthesis. It is separate from Persona AI and should
              be treated as the default non-persona message system.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={buildDashboardHref("/dashboard/bot-personalizer")} style={action}>
              Bot Personalizer
            </Link>
            <Link href={buildDashboardHref("/dashboard/ai/persona")} style={action}>
              Persona AI
            </Link>
            <Link href={buildDashboardHref("/dashboard/ai/memory")} style={action}>
              Memory
            </Link>
            <Link href={buildDashboardHref("/dashboard/ai/tone")} style={action}>
              Tone
            </Link>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 12 }}>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Adaptive Runtime</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{adaptiveEnabled ? "Enabled" : "Disabled"}</div>
        </div>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Persona Runtime</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{personaEnabled ? "Separate / Ready" : "Off"}</div>
        </div>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Primary Entry</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>runtimeRouter</div>
        </div>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Adaptive Identity</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>Bot Knowledge Base</div>
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
    </div>
  );
}
