"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type MasterPanelCfg = {
  enabled: boolean;
  deployChannelId: string;
  persistentMessageId: string;
  title: string;
  description: string;
  notes: string;
};

const DEFAULT_CONFIG: MasterPanelCfg = {
  enabled: true,
  deployChannelId: "",
  persistentMessageId: "",
  title: "Possum Bot Control Panel",
  description: "Select a panel to open.",
  notes: "",
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1200 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };
const linkCard: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 10, padding: 12, color: "#ffd0d0", textDecoration: "none", background: "#110000" };

export default function MasterPanelPage() {
  const [deployStatus, setDeployStatus] = useState("");
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
  } = useGuildEngineEditor<MasterPanelCfg>("masterPanel", DEFAULT_CONFIG);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  async function deploy() {
    const result = await runAction("deploy");
    if (result?.channelId && result?.messageId) {
      setDeployStatus(`Deployed to ${result.channelId} as message ${result.messageId}.`);
    } else {
      setDeployStatus("");
    }
  }

  if (!guildId) return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Master Panel Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Persistent master panel deployment for the bot. Title, description, channel, and last deployed message are all stored on the live engine config.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}
      {deployStatus ? <div style={{ color: "#9effb8", marginTop: 8 }}>{deployStatus}</div> : null}

      {loading ? (
        <div style={{ ...card, marginTop: 12 }}>Loading master panel...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Engine Enabled</label>
              <button onClick={deploy} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                {saving ? "Working..." : "Deploy Master Panel"}
              </button>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Deploy Channel</div>
                <select style={input} value={cfg.deployChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, deployChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Persistent Message ID</div>
                <input style={input} value={cfg.persistentMessageId || ""} readOnly />
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ marginBottom: 6 }}>Panel Title</div>
            <input style={input} value={cfg.title} onChange={(e) => setCfg((p) => ({ ...p, title: e.target.value }))} />
            <div style={{ marginTop: 12, marginBottom: 6 }}>Panel Description</div>
            <textarea style={{ ...input, minHeight: 120 }} value={cfg.description} onChange={(e) => setCfg((p) => ({ ...p, description: e.target.value }))} />
          </section>

          <section style={card}>
            <div style={{ marginBottom: 6 }}>Notes</div>
            <textarea style={{ ...input, minHeight: 120 }} value={cfg.notes} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} />
          </section>

          <section style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <Link href={`/dashboard/panels?guildId=${encodeURIComponent(guildId)}`} style={linkCard}>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Panel Deploy</div>
              <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 6 }}>Jump to bulk panel deployment for tickets and selfroles.</div>
            </Link>
            <Link href={`/dashboard/tickets?guildId=${encodeURIComponent(guildId)}`} style={linkCard}>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>Tickets</div>
              <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 6 }}>Edit the ticket module that users reach from the panel.</div>
            </Link>
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Master Panel"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
