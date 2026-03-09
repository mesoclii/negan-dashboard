"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import AiTabs from "@/components/possum/AiTabs";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";
import { buildDashboardHref } from "@/lib/dashboardContext";

type PersonaConfig = {
  enabled: boolean;
  guildNickname: string;
  botName: string;
  webhookName: string;
  webhookAvatarUrl: string;
  useWebhookPersona: boolean;
  profileBannerUrl: string;
  activityType: string;
  activityText: string;
  status: string;
  backstory: string;
};

const DEFAULT_CFG: PersonaConfig = {
  enabled: true,
  guildNickname: "",
  botName: "",
  webhookName: "",
  webhookAvatarUrl: "",
  useWebhookPersona: false,
  profileBannerUrl: "",
  activityType: "LISTENING",
  activityText: "/help",
  status: "online",
  backstory: "",
};

const wrap: CSSProperties = { color: "#ffd0d0", maxWidth: 1320 };
const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.36)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(100,0,0,.10)",
  marginBottom: 12,
};
const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid rgba(255,0,0,.45)",
  color: "#ffd5d5",
  borderRadius: 8,
  padding: "10px 12px",
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
};

function previewName(cfg: PersonaConfig) {
  return String(cfg.guildNickname || cfg.botName || cfg.webhookName || "Possum").trim();
}

export default function BotPersonalizerClient() {
  const {
    guildId,
    guildName,
    config: rawCfg,
    setConfig: setCfg,
    summary,
    details,
    loading,
    saving,
    message,
    save,
    runAction,
  } = useGuildEngineEditor<PersonaConfig>("botPersonalizer", DEFAULT_CFG);

  const cfg = useMemo(() => ({ ...DEFAULT_CFG, ...(rawCfg || {}) }), [rawCfg]);
  const possumAiHref = buildDashboardHref("/dashboard/ai/learning");
  const previewAvatar = String(cfg.webhookAvatarUrl || "").trim();
  const previewBanner = String(cfg.profileBannerUrl || "").trim();
  const previewBotName = previewName(cfg);

  async function saveAndApply() {
    const saved = await save(cfg);
    if (saved) {
      await runAction("applyProfile");
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff8585", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={wrap}>
      <AiTabs current="personalizer" />

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0, color: "#ff4a4a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Bot Personalizer
            </h1>
            <div style={{ color: "#ff9f9f", marginBottom: 8 }}>Guild: {guildName || guildId}</div>
            <div style={{ color: "#ffb5b5", fontSize: 12, maxWidth: 760 }}>
              Guild nickname applies live in this guild. Presence applies live across the bot account. Avatar, banner,
              and backstory are stored per guild for webhook-backed Possum AI replies and guild identity presentation where supported.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => void runAction("applyProfile")} disabled={saving} style={action}>
              {saving ? "Applying..." : "Apply Live Now"}
            </button>
            <button onClick={() => void saveAndApply()} disabled={saving} style={action}>
              {saving ? "Saving..." : "Save + Apply Live"}
            </button>
          </div>
        </div>
        {message ? <div style={{ color: "#ffd27a", marginTop: 10 }}>{message}</div> : null}
      </div>

      {loading ? <div style={card}>Loading bot personalization...</div> : null}

      {!loading ? (
        <>
          <EngineInsights summary={summary} details={details} />

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(320px,0.8fr)", gap: 12 }}>
            <section style={card}>
              <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Basics
              </h3>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
                <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, enabled: e.target.checked }))} /> Personalizer enabled</label>
                <label><input type="checkbox" checked={cfg.useWebhookPersona} onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, useWebhookPersona: e.target.checked }))} /> Use webhook identity</label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                <div>
                  <label>Guild nickname</label>
                  <input
                    style={input}
                    value={cfg.guildNickname || ""}
                    onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, guildNickname: e.target.value }))}
                    placeholder="Possum"
                  />
                </div>
                <div>
                  <label>Bot display name</label>
                  <input
                    style={input}
                    value={cfg.botName || ""}
                    onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, botName: e.target.value }))}
                    placeholder="Possum"
                  />
                </div>
                <div>
                  <label>Webhook chat name</label>
                  <input
                    style={input}
                    value={cfg.webhookName || ""}
                    onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, webhookName: e.target.value }))}
                    placeholder="Possum"
                  />
                </div>
                <div>
                  <label>Chat avatar URL</label>
                  <input
                    style={input}
                    value={cfg.webhookAvatarUrl || ""}
                    onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, webhookAvatarUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Banner URL</label>
                  <input
                    style={input}
                    value={cfg.profileBannerUrl || ""}
                    onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, profileBannerUrl: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </section>

            <aside style={card}>
              <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Preview
              </h3>
              <div style={{ border: "1px solid #510000", borderRadius: 12, overflow: "hidden", background: "#140909" }}>
                <div
                  style={{
                    height: 84,
                    background: previewBanner
                      ? `center / cover no-repeat url(${previewBanner})`
                      : "linear-gradient(135deg, #3b0f0f 0%, #1a1a1a 100%)",
                  }}
                />
                <div style={{ padding: 16, position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: -38,
                      left: 16,
                      width: 76,
                      height: 76,
                      borderRadius: 999,
                      border: "3px solid #140909",
                      background: previewAvatar
                        ? `center / cover no-repeat url(${previewAvatar})`
                        : "linear-gradient(135deg, #661111 0%, #240000 100%)",
                    }}
                  />
                  <div style={{ paddingTop: 42 }}>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{previewBotName}</div>
                    <div style={{ color: "#ffb7b7", fontSize: 13, marginTop: 4 }}>
                      {String(cfg.status || "online").toUpperCase()} | {String(cfg.activityType || "LISTENING").toUpperCase()} {String(cfg.activityText || "/help")}
                    </div>
                    <div style={{ color: "#ff9797", fontSize: 12, marginTop: 8 }}>
                      {cfg.useWebhookPersona ? "Webhook identity will be used for Possum AI replies where supported." : "Default bot identity remains active until webhook mode is enabled."}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Presence + Backstory
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div>
                <label>Status</label>
                <select style={input} value={cfg.status || "online"} onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, status: e.target.value }))}>
                  <option value="online">Online</option>
                  <option value="idle">Idle</option>
                  <option value="dnd">Do Not Disturb</option>
                  <option value="invisible">Invisible</option>
                </select>
              </div>
              <div>
                <label>Activity type</label>
                <select style={input} value={cfg.activityType || "LISTENING"} onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, activityType: e.target.value }))}>
                  <option value="PLAYING">Playing</option>
                  <option value="LISTENING">Listening To</option>
                  <option value="WATCHING">Watching</option>
                  <option value="COMPETING">Competing In</option>
                  <option value="STREAMING">Streaming</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Activity text</label>
                <input
                  style={input}
                  value={cfg.activityText || ""}
                  onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, activityText: e.target.value }))}
                  placeholder="/help"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label>Backstory</label>
                <textarea
                  style={{ ...input, minHeight: 180 }}
                  value={cfg.backstory || ""}
                  onChange={(e) => setCfg((prev) => ({ ...DEFAULT_CFG, ...prev, backstory: e.target.value }))}
                  placeholder="Describe how this guild wants the bot to feel, speak, and present itself."
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <div style={{ color: "#ffb5b5", fontSize: 12, maxWidth: 760 }}>
                This page controls Possum AI identity, naming, webhook branding, and guild-facing presentation for this guild.
              </div>
              <Link href={possumAiHref} style={{ ...action, textDecoration: "none" }}>
                Open Possum AI
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
