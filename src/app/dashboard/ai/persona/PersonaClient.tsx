"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import AiTabs from "@/components/possum/AiTabs";
import { useDashboardSessionState } from "@/components/possum/useDashboardSessionState";
import { buildDashboardHref } from "@/lib/dashboardContext";

type PersonaRow = {
  key: string;
  name: string;
  enabled: boolean;
  bio: string;
  triggerCount: number;
  mentionRequired: boolean;
  imageConfigured: boolean;
  allowedRoleCount: number;
  allowedChannelCount: number;
};

type PersonaRuntimeConfig = {
  settings: {
    autoReplyEnabled: boolean;
    mentionOnly: boolean;
  };
  personaCount: number;
  personas: PersonaRow[];
};

const EMPTY_CONFIG: PersonaRuntimeConfig = {
  settings: {
    autoReplyEnabled: false,
    mentionOnly: true,
  },
  personaCount: 0,
  personas: [],
};

const wrap: CSSProperties = { color: "#ffd0d0", maxWidth: 1320 };
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

function resolveGuild() {
  if (typeof window === "undefined") return { guildId: "", guildName: "" };
  const params = new URLSearchParams(window.location.search);
  const guildId = (params.get("guildId") || localStorage.getItem("activeGuildId") || "").trim();
  const guildName = (localStorage.getItem("activeGuildName") || guildId).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return { guildId, guildName };
}

export default function PersonaClient() {
  const { isMasterOwner } = useDashboardSessionState();
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [personaEnabled, setPersonaEnabled] = useState(false);
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [config, setConfig] = useState<PersonaRuntimeConfig>(EMPTY_CONFIG);

  useEffect(() => {
    const resolved = resolveGuild();
    setGuildId(resolved.guildId);
    setGuildName(resolved.guildName);

    if (!resolved.guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMessage("");

        const [runtimeRes, dashRes] = await Promise.all([
          fetch(`/api/ai/persona-runtime?guildId=${encodeURIComponent(resolved.guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(resolved.guildId)}`, { cache: "no-store" }),
        ]);

        const runtimeJson = await runtimeRes.json().catch(() => ({}));
        const dashJson = await dashRes.json().catch(() => ({}));

        if (!runtimeRes.ok || runtimeJson?.success === false) {
          throw new Error(runtimeJson?.error || "Failed to load persona engine runtime.");
        }

        setConfig(runtimeJson.config || EMPTY_CONFIG);
        setPersonaEnabled(Boolean(dashJson?.config?.aiRuntime?.personaAiEnabled ?? dashJson?.config?.features?.personaAiEnabled));
        setAdaptiveEnabled(Boolean(dashJson?.config?.aiRuntime?.adaptiveAiEnabled ?? dashJson?.config?.features?.adaptiveAiEnabled));
      } catch (err: any) {
        setMessage(err?.message || "Failed to load persona engine.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!guildId) {
    return <div style={{ color: "#ff8585", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={wrap}>
      <AiTabs current="persona" />

      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, color: "#ff4a4a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Persona Engine
            </h1>
            <div style={{ color: "#ff9f9f", marginTop: 8 }}>Guild: {guildName || guildId}</div>
            <div style={{ color: "#ffb5b5", fontSize: 12, marginTop: 8, maxWidth: 880 }}>
              This is the local persona system backed by <code>modules/data/personas.json</code> and <code>engine/personaEngine.js</code>.
              It is separate from Possum AI and from the provider/pricing surface. Use this page to inspect the real persona roster and runtime mode.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={buildDashboardHref("/dashboard/bot-personalizer")} style={action}>
              Bot Personalizer
            </Link>
            <Link href={buildDashboardHref("/dashboard/ai/learning")} style={action}>
              Possum AI
            </Link>
            {isMasterOwner ? (
              <Link href={buildDashboardHref("/dashboard/ai/openai-platform")} style={action}>
                Creator AI Platform
              </Link>
            ) : null}
          </div>
        </div>
        {message ? <div style={{ color: "#ffd27a", marginTop: 10 }}>{message}</div> : null}
      </section>

      {loading ? <div style={card}>Loading persona engine...</div> : null}

      {!loading ? (
        <>
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 12 }}>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Persona Runtime</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{personaEnabled ? "Enabled" : "Disabled"}</div>
            </div>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Auto Reply</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{config.settings.autoReplyEnabled ? "On" : "Off"}</div>
            </div>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Mention Mode</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{config.settings.mentionOnly ? "Mention Only" : "Triggers Allowed"}</div>
            </div>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Persona Count</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{config.personaCount}</div>
            </div>
            <div style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Possum AI</div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{adaptiveEnabled ? "Enabled" : "Disabled"}</div>
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Runtime Notes
            </div>
            <div style={{ color: "#ffdada", fontWeight: 700 }}>Persona AI is separate from Possum AI.</div>
            <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 4 }}>
              The persona roster uses its own trigger rules, persona-only channels, access lists, photos, and direct OpenAI calls from the persona engine.
              The handcrafted Possum AI runs separately on the non-persona path and stays linked to Bot Personalizer, while provider pricing,
              public catalog, and billing belong to the OpenAI platform page instead.
              Persona AI does not inherit Bot Personalizer webhook identity or the guild backstory.
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              Persona Roster
            </div>
            {config.personas.length ? (
              config.personas.map((persona) => (
                <div key={persona.key} style={{ padding: "10px 0", borderTop: "1px solid #330000" }}>
                  <div style={{ color: "#ffdcdc", fontWeight: 700 }}>
                    {persona.name} <span style={{ color: "#ff9c9c", fontWeight: 400 }}>({persona.key})</span>
                  </div>
                  <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 4 }}>
                    {persona.bio || "No bio set."}
                  </div>
                  <div style={{ color: "#ff9c9c", fontSize: 11, marginTop: 6 }}>
                    {persona.enabled ? "Enabled" : "Disabled"} | Triggers {persona.triggerCount} | Mention Required {persona.mentionRequired ? "Yes" : "No"} | Photo {persona.imageConfigured ? "Yes" : "No"} | Allowed Roles {persona.allowedRoleCount} | Allowed Channels {persona.allowedChannelCount}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: "#ffbdbd", fontSize: 12 }}>No personas are configured yet.</div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
