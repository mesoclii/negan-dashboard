"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";
import { buildDashboardHref } from "@/lib/dashboardContext";

type JedConfig = {
  enabled: boolean;
  batchLimit: number;
  publicTTL: number;
  tempTTL: number;
  maxFileSizeMb: number;
  allowedDomains: string[];
  auditChannelId: string;
  notes: string;
};

const DEFAULT_CONFIG: JedConfig = {
  enabled: true,
  batchLimit: 1,
  publicTTL: 45,
  tempTTL: 60,
  maxFileSizeMb: 5,
  allowedDomains: ["cdn.discordapp.com", "media.discordapp.net", "discordapp.net", "i.imgur.com", "media.tenor.com", "tenor.com"],
  auditChannelId: "",
  notes: "",
};

const shell: CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1440 };
const box: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 14,
  padding: 16,
  background: "linear-gradient(180deg, rgba(120,0,0,0.12), rgba(0,0,0,0.72))",
  marginTop: 12,
};
const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 10,
  padding: "10px 12px",
};
const button: CSSProperties = {
  ...input,
  width: "auto",
  cursor: "pointer",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const label: CSSProperties = {
  color: "#ffb9b9",
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
};
const miniCard: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(255,0,0,0.07)",
};

function lines(value: string) {
  return value
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function JedPage() {
  const { guildId, guildName, config, setConfig, channels, summary, details, loading, saving, message, save, runAction } =
    useGuildEngineEditor<JedConfig>("jed", DEFAULT_CONFIG);

  const textChannels = channels.filter((channel) => Number(channel?.type) === 0 || Number(channel?.type) === 5);

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <section style={shell}>
      <h1 style={{ margin: 0, color: "#ff4f4f", letterSpacing: "0.10em", textTransform: "uppercase" }}>JED Sticker + Emoji + GIF Theft</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffbcbc", lineHeight: 1.7, maxWidth: 1120 }}>
        This is the live control surface for <strong>/jed grab</strong> and the <strong>Possum Bot This</strong> message action. JED steals approved sticker,
        emoji, GIF/media URLs, uploaded files, and custom emoji tokens, converts them when needed, and deploys the result into the guild. This page only tunes
        the live guild-level grab rules layered on top of your existing bot logic.
      </div>

      <section style={box}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
          <div style={miniCard}>
            <div style={label}>What JED Does</div>
            <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
              Pulls approved asset URLs, converts them into guild-ready emojis or stickers, and handles public or private delivery without changing the
              existing slash command runtime.
            </div>
          </div>
          <div style={miniCard}>
            <div style={label}>Slash Flow</div>
            <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
              <strong>/jed grab</strong> accepts source URLs, target type, and visibility. Target stays <strong>emoji</strong> or <strong>sticker</strong>;
              GIF/media handling still runs through the same deployed conversion path.
            </div>
          </div>
          <div style={miniCard}>
            <div style={label}>Guild Tuning Only</div>
            <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
              Batch size, TTL, file-size guardrails, allowed steal sources, audit routing, and temp cleanup are adjustable here. Core JED command logic is
              not being rewritten.
            </div>
          </div>
        </div>
      </section>

      {message ? <div style={{ marginTop: 12, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div style={box}>Loading JED runtime...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={label}>Live Theft Actions</div>
                <div style={{ color: "#ffbcbc", lineHeight: 1.7 }}>
                  Refresh the merged runtime rules from the bot or clear this guild&apos;s temporary JED conversion files without leaving the dashboard.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={button} disabled={saving} onClick={() => void runAction("refreshConfig")}>
                  Refresh Runtime Config
                </button>
                <button style={button} disabled={saving} onClick={() => void runAction("cleanupTemp")}>
                  Delete Grab Temp Files
                </button>
              </div>
            </div>
          </section>

          <section style={box}>
            <div style={label}>Grab Limits + Deployment Rules</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))} />
                JED Enabled
              </label>
              <div>
                <div style={label}>Items Per Grab</div>
                <input
                  style={input}
                  type="number"
                  min={1}
                  max={25}
                  value={config.batchLimit}
                  onChange={(e) => setConfig((prev) => ({ ...prev, batchLimit: Math.max(1, Number(e.target.value || 1)) }))}
                />
              </div>
              <div>
                <div style={label}>Public Result Lifetime (sec)</div>
                <input
                  style={input}
                  type="number"
                  min={5}
                  max={600}
                  value={config.publicTTL}
                  onChange={(e) => setConfig((prev) => ({ ...prev, publicTTL: Math.max(5, Number(e.target.value || 45)) }))}
                />
              </div>
              <div>
                <div style={label}>Temp File Cleanup (sec)</div>
                <input
                  style={input}
                  type="number"
                  min={5}
                  max={3600}
                  value={config.tempTTL}
                  onChange={(e) => setConfig((prev) => ({ ...prev, tempTTL: Math.max(5, Number(e.target.value || 60)) }))}
                />
              </div>
              <div>
                <div style={label}>Max Download Size (MB)</div>
                <input
                  style={input}
                  type="number"
                  min={1}
                  max={100}
                  value={config.maxFileSizeMb}
                  onChange={(e) => setConfig((prev) => ({ ...prev, maxFileSizeMb: Math.max(1, Number(e.target.value || 5)) }))}
                />
              </div>
              <div>
                <div style={label}>Audit Channel</div>
                <select style={input} value={config.auditChannelId || ""} onChange={(e) => setConfig((prev) => ({ ...prev, auditChannelId: e.target.value }))}>
                  <option value="">Not set</option>
                  {textChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section style={box}>
            <div style={label}>Approved Steal Sources</div>
            <textarea
              style={{ ...input, minHeight: 120 }}
              value={config.allowedDomains.join("\n")}
              onChange={(e) => setConfig((prev) => ({ ...prev, allowedDomains: lines(e.target.value) }))}
            />
            <div style={{ marginTop: 10, color: "#ffbcbc", lineHeight: 1.7 }}>
              Only these hostnames can be grabbed by JED in this guild. If a source is not on this list, the live slash runtime will reject it.
            </div>
          </section>

          <section style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, marginBottom: 16 }}>
              <div style={miniCard}>
                <div style={label}>Target Modes</div>
                <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
                  <strong>Emoji</strong> creates server emoji entries.
                  <br />
                  <strong>Sticker</strong> creates guild sticker entries.
                  <br />
                  GIF/media URLs, uploaded files, and custom emoji tokens all flow through the same conversion path before deploy.
                </div>
              </div>
              <div style={miniCard}>
                <div style={label}>Visibility</div>
                <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
                  Public results respect the public TTL above. Private result handling still follows the already-built JED command logic and cooldown model.
                </div>
              </div>
              <div style={miniCard}>
                <div style={label}>Tier Behavior</div>
                <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
                  Global tier rules still apply for cooldowns and capability limits. The batch limit on this page is the guild-level cap layered on top.
                </div>
              </div>
            </div>
            <div style={label}>Operator Notes</div>
            <textarea
              style={{ ...input, minHeight: 140 }}
              value={config.notes}
              onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </section>

          <section style={{ ...box, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: "#ffbcbc" }}>
              Shared links:
              <span style={{ marginLeft: 10 }}>
                <Link href={buildDashboardHref("/dashboard/system-health")} style={{ color: "#ffd0d0" }}>
                  System Health
                </Link>
              </span>
              <span style={{ marginLeft: 10 }}>
                <Link href={buildDashboardHref("/dashboard/runtime-router")} style={{ color: "#ffd0d0" }}>
                  Runtime Router
                </Link>
              </span>
            </div>
            <button style={button} disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save JED Theft Controls"}
            </button>
          </section>
        </>
      )}
    </section>
  );
}
