"use client";

import Link from "next/link";
import EngineContractPanel from "@/components/possum/EngineContractPanel";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";
import { buildDashboardHref } from "@/lib/dashboardContext";

type RuntimeRouterCfg = {
  personaAiEnabled: boolean | null;
  adaptiveAiEnabled: boolean | null;
  personaOnlyChannelIds: string[];
  personaKeywordTriggers: string[];
};

const DEFAULT_CFG: RuntimeRouterCfg = {
  personaAiEnabled: false,
  adaptiveAiEnabled: true,
  personaOnlyChannelIds: [],
  personaKeywordTriggers: ["persona", "character", "backstory"],
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1360 };
const card: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 14,
  padding: 16,
  background: "linear-gradient(180deg, rgba(120,0,0,0.12), rgba(0,0,0,0.72))",
  marginBottom: 14,
};
const input: React.CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 10,
  padding: "10px 12px",
};
const label: React.CSSProperties = {
  color: "#ffb9b9",
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
};

function toggle(list: string[], id: string) {
  const next = new Set(list || []);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return Array.from(next);
}

export default function RuntimeRouterClient() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    channels,
    summary,
    details,
    loading,
    saving,
    message,
    save,
    runAction,
  } = useGuildEngineEditor<RuntimeRouterCfg>("runtimeRouter", DEFAULT_CFG);

  const textChannels = channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text"));

  function keywordText() {
    return (cfg.personaKeywordTriggers || []).join(", ");
  }

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={shell}>
      <EngineContractPanel
        engineKey="runtimeRouter"
        intro="Runtime Router is the live arbitration layer between adaptive Possum AI and persona-triggered routing. This page owns routing boundaries, persona-only channels, trigger keywords, and live memory resets."
        related={[
          { label: "Possum AI", route: "/dashboard/ai/learning", reason: "adaptive behavior, learning writes, and guild tone settings live there" },
          { label: "Persona AI", route: "/dashboard/ai/persona", reason: "persona-only channels and hosted persona logic must stay separate from adaptive routing" },
          { label: "Bot Personalizer", route: "/dashboard/bot-personalizer", reason: "guild identity and webhook presentation should align with whichever path is active" },
        ]}
      />

      <div style={{ color: "#ff9999", marginTop: -2, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading runtime router...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              <label style={{ color: "#ffdcdc", fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={cfg.adaptiveAiEnabled !== false}
                  onChange={(e) => setCfg((prev) => ({ ...prev, adaptiveAiEnabled: e.target.checked }))}
                />{" "}
                Adaptive Possum runtime enabled
              </label>
              <label style={{ color: "#ffdcdc", fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={!!cfg.personaAiEnabled}
                  onChange={(e) => setCfg((prev) => ({ ...prev, personaAiEnabled: e.target.checked }))}
                />{" "}
                Persona runtime enabled
              </label>
            </div>
            <div style={{ color: "#ffb8b8", fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>
              The adaptive and persona paths are intentionally separate. Adaptive handles the homemade Possum AI route; persona handles hosted persona channels, keywords, and prompt-driven interactions.
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Persona Routing Boundaries
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
              <div>
                <div style={label}>Persona Trigger Keywords</div>
                <textarea
                  style={{ ...input, minHeight: 90 }}
                  value={keywordText()}
                  onChange={(e) =>
                    setCfg((prev) => ({
                      ...prev,
                      personaKeywordTriggers: e.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="persona, character, backstory"
                />
              </div>
              <div>
                <div style={label}>Persona-Only Channels</div>
                <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #500000", borderRadius: 10, padding: 10, background: "#0a0a0a" }}>
                  {textChannels.map((channel) => (
                    <label key={channel.id} style={{ display: "block", color: "#ffdcdc", marginBottom: 6 }}>
                      <input
                        type="checkbox"
                        checked={(cfg.personaOnlyChannelIds || []).includes(channel.id)}
                        onChange={() =>
                          setCfg((prev) => ({
                            ...prev,
                            personaOnlyChannelIds: toggle(prev.personaOnlyChannelIds || [], channel.id),
                          }))
                        }
                      />{" "}
                      #{channel.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Live Memory + Learning Actions
            </div>
            <div style={{ color: "#ffb8b8", fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
              Use these carefully. They act on the real runtime and persistence for the selected guild.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => void runAction("clearReplyMemory")} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                Clear Reply Memory
              </button>
              <button onClick={() => void runAction("wipeProfiles")} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                Wipe Learned Profiles
              </button>
              <button onClick={() => void runAction("wipeKnowledge")} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                Wipe Knowledge Base
              </button>
            </div>
          </section>

          <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: "#ffb8b8", lineHeight: 1.6, maxWidth: 840 }}>
              Runtime Router now owns the actual routing boundaries and cleanup actions. Possum AI stays separate and deeper on its own page; this tab exists to control the live selection logic between adaptive and persona paths.
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link href={buildDashboardHref("/dashboard/ai/learning")} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Open Possum AI
              </Link>
              <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                {saving ? "Saving..." : "Save Runtime Router"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
