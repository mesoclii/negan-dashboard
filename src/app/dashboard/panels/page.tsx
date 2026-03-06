"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };
const linkCard: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 10, padding: 12, color: "#ffd0d0", textDecoration: "none", background: "#110000" };

export default function PanelsPage() {
  const [deployOutput, setDeployOutput] = useState<string[]>([]);
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
  } = useGuildEngineEditor<PanelDeployCfg>("panelDeploy", DEFAULT_CONFIG);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  async function deployAll() {
    const result = await runAction("deployAll");
    setDeployOutput(Array.isArray(result?.output) ? result.output.map((line: unknown) => String(line)) : []);
  }

  if (!guildId) return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Panel Deploy Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Bulk deploy control for panel-backed engines. This page saves the live deploy target and can trigger a real deploy from the bot.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={{ ...card, marginTop: 12 }}>Loading panel deploy...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Engine Enabled</label>
              <button onClick={deployAll} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                {saving ? "Working..." : "Deploy All Panels"}
              </button>
            </div>
          </section>

          <section style={card}>
            <div>
              <div style={{ marginBottom: 6 }}>Deploy Channel</div>
              <select style={input} value={cfg.deployChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, deployChannelId: e.target.value }))}>
                <option value="">Select channel</option>
                {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
              </select>
            </div>
          </section>

          <section style={card}>
            <div style={{ marginBottom: 6 }}>Deployment Notes</div>
            <textarea style={{ ...input, minHeight: 120 }} value={cfg.notes} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} />
          </section>

          {deployOutput.length ? (
            <section style={card}>
              <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Last Deploy Output</div>
              {deployOutput.map((line, index) => (
                <div key={`${line}_${index}`} style={{ color: "#ffd3d3", padding: "6px 0", borderTop: index ? "1px solid #3a0000" : "none" }}>{line}</div>
              ))}
            </section>
          ) : null}

          <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <Link href={`/dashboard/selfroles?guildId=${encodeURIComponent(guildId)}`} style={linkCard}>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Selfroles</div>
              <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 6 }}>Edit button layouts before you deploy them.</div>
            </Link>
            <Link href={`/dashboard/tickets?guildId=${encodeURIComponent(guildId)}`} style={linkCard}>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tickets</div>
              <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 6 }}>Open the ticket panel editor used by deploy-all.</div>
            </Link>
            <Link href={`/dashboard/panel?guildId=${encodeURIComponent(guildId)}`} style={linkCard}>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Master Panel</div>
              <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 6 }}>Configure the persistent master panel separately.</div>
            </Link>
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Panel Deploy"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
