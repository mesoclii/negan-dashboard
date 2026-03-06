"use client";

import Link from "next/link";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type PokemonCfg = {
  enabled: boolean;
  guildAllowed: boolean;
  stage2Enabled: boolean;
  tradingEnabled: boolean;
  tradeLogChannelId: string;
};

const DEFAULT_CONFIG: PokemonCfg = {
  enabled: false,
  guildAllowed: false,
  stage2Enabled: true,
  tradingEnabled: true,
  tradeLogChannelId: "",
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1180 };
const card: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)", marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

export default function PokemonTradePage() {
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
  } = useGuildEngineEditor<PokemonCfg>("pokemon", DEFAULT_CONFIG);

  const textChannels = channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text"));

  if (!guildId) return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Pokemon Trade Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Dedicated trade page for Pokemon trading availability and trade log routing.
      </div>
      {message ? <div style={{ marginTop: 8, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div style={{ ...card, marginTop: 12 }}>Loading pokemon trade...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Engine Enabled</label>
              <label><input type="checkbox" checked={cfg.guildAllowed} onChange={(e) => setCfg((p) => ({ ...p, guildAllowed: e.target.checked }))} /> Guild Allowed</label>
              <label><input type="checkbox" checked={cfg.stage2Enabled} onChange={(e) => setCfg((p) => ({ ...p, stage2Enabled: e.target.checked }))} /> Stage 2 UI Enabled</label>
              <label><input type="checkbox" checked={cfg.tradingEnabled} onChange={(e) => setCfg((p) => ({ ...p, tradingEnabled: e.target.checked }))} /> Trading Enabled</label>
            </div>
          </section>

          <section style={card}>
            <div>
              <div style={{ marginBottom: 6 }}>Trade Log Channel</div>
              <select style={input} value={cfg.tradeLogChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, tradeLogChannelId: e.target.value }))}>
                <option value="">Select channel</option>
                {textChannels.map((channel) => <option key={channel.id} value={channel.id}>#{channel.name}</option>)}
              </select>
            </div>
          </section>

          <section style={{ ...card, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={`/dashboard/pokemon-stage2?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#ffd0d0" }}>Open Pokemon Overview</Link>
            <Link href={`/dashboard/pokemon-battle?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#ffd0d0" }}>Open Pokemon Battle</Link>
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Trade"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
