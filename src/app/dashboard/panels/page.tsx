"use client";

import Link from "next/link";
import { useState } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type PanelDeployCfg = {
  enabled: boolean;
  deployChannelId: string;
  notes: string;
};

const DEFAULT_CONFIG: PanelDeployCfg = {
  enabled: true,
  deployChannelId: "",
  notes: "",
};

const PANEL_ROUTES = [
  {
    href: "/dashboard/selfroles",
    title: "Selfroles",
    description: "Owns role buttons, panel layout, button labels, emojis, and publish controls.",
  },
  {
    href: "/dashboard/tickets",
    title: "Tickets",
    description: "Owns ticket types, button text, emoji, welcome copy, transcripts, and staff routing.",
  },
];

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const button: React.CSSProperties = {
  padding: "10px 14px",
  background: "#0b0b0b",
  color: "#ffd8d8",
  border: "1px solid #7a0000",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 900,
};
const linkCard: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 10, padding: 14, color: "#ffd0d0", textDecoration: "none", background: "#110000" };

export default function PanelsPage() {
  const [deployOutput, setDeployOutput] = useState<string[]>([]);
  const {
    guildId,
    guildName,
    summary,
    details,
    loading,
    saving,
    message,
    runAction,
  } = useGuildEngineEditor<PanelDeployCfg>("panelDeploy", DEFAULT_CONFIG);

  async function deployAll() {
    const result = await runAction("deployAll");
    setDeployOutput(Array.isArray(result?.output) ? result.output.map((line: unknown) => String(line)) : []);
  }

  if (!guildId) return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Panel Hub</h1>
      <div style={{ color: "#ff9999", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Panel layouts belong to the engine that owns them. Use this page only to jump into those engine tabs and run the shared deploy action for supported panels.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={{ ...card, marginTop: 12 }}>Loading panel hub...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Shared Deploy
            </div>
            <div style={{ color: "#ffd5d5", lineHeight: 1.6, maxWidth: 780 }}>
              The bulk deploy action is only for panel-backed systems that already have their real setup finished inside their own tabs. It is not where you edit ticket flows, selfrole buttons, or future game panels.
            </div>
            <div style={{ marginTop: 14 }}>
              <button onClick={deployAll} disabled={saving} style={button}>
                {saving ? "Working..." : "Deploy Supported Panels"}
              </button>
            </div>
          </section>

          {deployOutput.length ? (
            <section style={card}>
              <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Last Deploy Output</div>
              {deployOutput.map((line, index) => (
                <div key={`${line}_${index}`} style={{ color: "#ffd3d3", padding: "6px 0", borderTop: index ? "1px solid #3a0000" : "none" }}>{line}</div>
              ))}
            </section>
          ) : null}

          <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
            {PANEL_ROUTES.map((item) => (
              <Link key={item.href} href={`${item.href}?guildId=${encodeURIComponent(guildId)}`} style={linkCard}>
                <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.title}</div>
                <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>{item.description}</div>
              </Link>
            ))}
          </section>

          <section style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
              Game Panel Rule
            </div>
            <div style={{ color: "#ffd5d5", lineHeight: 1.6, maxWidth: 820 }}>
              If a game engine needs its own panel, build and control that panel inside that game engine tab. The panel hub is not where game-panel logic or layout belongs.
            </div>
          </section>
        </>
      )}
    </div>
  );
}
