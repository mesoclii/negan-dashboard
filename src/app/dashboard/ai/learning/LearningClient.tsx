"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { buildDashboardHref } from "@/lib/dashboardContext";

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
      const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(resolved.guildId)}`, { cache: "no-store" }).catch(() => null);
      const json = await res?.json().catch(() => ({}));
      setAdaptiveEnabled(Boolean(json?.config?.aiRuntime?.adaptiveAiEnabled ?? json?.config?.features?.adaptiveAiEnabled ?? json?.config?.features?.aiEnabled));
      setPersonaEnabled(Boolean(json?.config?.aiRuntime?.personaAiEnabled ?? json?.config?.features?.personaAiEnabled ?? json?.config?.features?.aiEnabled));
    })();
  }, []);

  if (!guildId) {
    return <div style={{ color: "#ff8585", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={wrap}>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, color: "#ff4a4a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Bot Knowledge Base
            </h1>
            <div style={{ color: "#ff9f9f", marginTop: 8 }}>Guild: {guildName || guildId}</div>
            <div style={{ color: "#ffb5b5", fontSize: 12, marginTop: 8, maxWidth: 900 }}>
              This is the handcrafted assistant path driven by runtime routing, learned tone and topic profiles, and
              adaptive synthesis. It is the default non-persona reply pipeline now. The persona engine only claims
              messages that hit the persona routing rules instead of sharing the same ambient path.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href={buildDashboardHref("/dashboard/ai/persona")} style={action}>
              Open Persona Engine
            </Link>
          </div>
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginBottom: 12 }}>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Primary Runtime</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{adaptiveEnabled ? "Enabled" : "Disabled"}</div>
        </div>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Fallback Runtime</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{personaEnabled ? "Persona Ready" : "Persona Off"}</div>
        </div>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Core Path</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>runtimeRouter</div>
        </div>
        <div style={card}>
          <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Identity</div>
          <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>Possum Bot Knowledge Base</div>
        </div>
      </section>

      <section style={card}>
        <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Runtime Distinction
        </div>
        <div style={{ color: "#ffdcdc", fontWeight: 700 }}>Handcrafted learning AI</div>
        <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 4 }}>
          Learns tone and topics, updates persistent profiles, stores knowledge, and builds adaptive replies from your
          own routing and synthesis code.
        </div>
        <div style={{ color: "#ffdcdc", fontWeight: 700, marginTop: 12 }}>Persona engine</div>
        <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 4 }}>
          Uses direct model completions with persona prompts, triggers, mention rules, access lists, and image-backed
          persona identities.
        </div>
      </section>

      <section style={card}>
        <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Next Controls
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={buildDashboardHref("/dashboard/ai/persona")} style={action}>
            Persona Engine
          </Link>
          <Link href={buildDashboardHref("/dashboard/ai/openai-platform")} style={action}>
            OpenAI Platform
          </Link>
          <Link href={buildDashboardHref("/dashboard/ai/memory")} style={action}>
            Memory
          </Link>
        </div>
      </section>
    </div>
  );
}
