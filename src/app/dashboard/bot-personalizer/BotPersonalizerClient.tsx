"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
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
};

function sanitizeConfig(rawCfg: Partial<PersonaConfig> | null | undefined): PersonaConfig {
  const src = rawCfg && typeof rawCfg === "object" ? rawCfg : {};
  return {
    enabled: src.enabled !== false,
    guildNickname: String(src.guildNickname || ""),
    botName: String(src.botName || ""),
    webhookName: String(src.webhookName || ""),
    webhookAvatarUrl: String(src.webhookAvatarUrl || ""),
    useWebhookPersona: Boolean(src.useWebhookPersona),
    profileBannerUrl: String(src.profileBannerUrl || ""),
    activityType: String(src.activityType || "LISTENING"),
    activityText: String(src.activityText || "/help"),
    status: String(src.status || "online"),
  };
}

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

  const cfg = useMemo(() => sanitizeConfig(rawCfg), [rawCfg]);
  const possumAiHref = buildDashboardHref("/dashboard/ai/learning");
  const previewAvatar = String(cfg.webhookAvatarUrl || "").trim();
  const previewBanner = String(cfg.profileBannerUrl || "").trim();
  const previewBotName = previewName(cfg);
  const [avatarPreviewFailedFor, setAvatarPreviewFailedFor] = useState("");
  const [bannerPreviewFailedFor, setBannerPreviewFailedFor] = useState("");
  const avatarPreviewFailed = Boolean(previewAvatar && avatarPreviewFailedFor === previewAvatar);
  const bannerPreviewFailed = Boolean(previewBanner && bannerPreviewFailedFor === previewBanner);

  function updateCfg(patch: Partial<PersonaConfig>) {
    setCfg((prev) => sanitizeConfig({ ...(prev || {}), ...patch }));
  }

  async function applyLiveNow() {
    await runAction("applyProfile", { patch: cfg });
  }

  async function saveAndApply() {
    const saved = await save(cfg);
    if (saved) {
      await runAction("applyProfile", { patch: cfg });
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff8585", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h1 style={{ marginTop: 0, color: "#ff4a4a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Bot Personalizer
            </h1>
            <div style={{ color: "#ff9f9f", marginBottom: 8 }}>Guild: {guildName || guildId}</div>
            <div style={{ color: "#ffb5b5", fontSize: 12, maxWidth: 760 }}>
              Guild nickname applies live in this guild. Presence applies live across the bot account. Avatar, banner,
              webhook chat name, and webhook identity stay on the free Bot Personalizer layer for Possum AI replies where supported.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => void applyLiveNow()} disabled={saving} style={action}>
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
                <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => updateCfg({ enabled: e.target.checked })} /> Personalizer enabled</label>
                <label><input type="checkbox" checked={cfg.useWebhookPersona} onChange={(e) => updateCfg({ useWebhookPersona: e.target.checked })} /> Use webhook identity</label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
                <div>
                  <label>Guild nickname</label>
                  <input
                    style={input}
                    value={cfg.guildNickname || ""}
                    onChange={(e) => updateCfg({ guildNickname: e.target.value })}
                    placeholder="Possum"
                  />
                </div>
                <div>
                  <label>Bot display name</label>
                  <input
                    style={input}
                    value={cfg.botName || ""}
                    onChange={(e) => updateCfg({ botName: e.target.value })}
                    placeholder="Possum"
                  />
                </div>
                <div>
                  <label>Webhook chat name</label>
                  <input
                    style={input}
                    value={cfg.webhookName || ""}
                    onChange={(e) => updateCfg({ webhookName: e.target.value })}
                    placeholder="Possum"
                  />
                </div>
                <div>
                  <label>Chat avatar URL</label>
                  <input
                    style={input}
                    value={cfg.webhookAvatarUrl || ""}
                    onChange={(e) => updateCfg({ webhookAvatarUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label>Banner URL</label>
                  <input
                    style={input}
                    value={cfg.profileBannerUrl || ""}
                    onChange={(e) => updateCfg({ profileBannerUrl: e.target.value })}
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
                    position: "relative",
                    background: "linear-gradient(135deg, #3b0f0f 0%, #1a1a1a 100%)",
                  }}
                >
                  {previewBanner && !bannerPreviewFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={previewBanner}
                      src={previewBanner}
                      alt="Banner preview"
                      referrerPolicy="no-referrer"
                      onError={() => setBannerPreviewFailedFor(previewBanner)}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : null}
                </div>
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
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #661111 0%, #240000 100%)",
                    }}
                  >
                    {previewAvatar && !avatarPreviewFailed ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={previewAvatar}
                        src={previewAvatar}
                        alt="Avatar preview"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarPreviewFailedFor(previewAvatar)}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : null}
                  </div>
                  <div style={{ paddingTop: 42 }}>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{previewBotName}</div>
                    <div style={{ color: "#ffb7b7", fontSize: 13, marginTop: 4 }}>
                      {String(cfg.status || "online").toUpperCase()} | {String(cfg.activityType || "LISTENING").toUpperCase()} {String(cfg.activityText || "/help")}
                    </div>
                    <div style={{ color: "#ff9797", fontSize: 12, marginTop: 8 }}>
                      {cfg.useWebhookPersona ? "Webhook identity will be used for Possum AI replies where supported." : "Default bot identity remains active until webhook mode is enabled."}
                    </div>
                    {(avatarPreviewFailed || bannerPreviewFailed) ? (
                      <div style={{ color: "#ffb0b0", fontSize: 11, marginTop: 8 }}>
                        One or more preview images could not be loaded from the configured URL.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Presence
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
              <div>
                <label>Status</label>
                <select style={input} value={cfg.status || "online"} onChange={(e) => updateCfg({ status: e.target.value })}>
                  <option value="online">Online</option>
                  <option value="idle">Idle</option>
                  <option value="dnd">Do Not Disturb</option>
                  <option value="invisible">Invisible</option>
                </select>
              </div>
              <div>
                <label>Activity type</label>
                <select style={input} value={cfg.activityType || "LISTENING"} onChange={(e) => updateCfg({ activityType: e.target.value })}>
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
                  onChange={(e) => updateCfg({ activityText: e.target.value })}
                  placeholder="/help"
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <div style={{ color: "#ffb5b5", fontSize: 12, maxWidth: 760 }}>
                This page controls naming, presence, and webhook identity only. Possum AI now owns the guild backstory and adaptive identity notes.
              </div>
              <Link href={possumAiHref} style={{ ...action, textDecoration: "none" }}>
                Open Possum AI
              </Link>
            </div>
          </section>

          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Possum AI Backstory
            </h3>
            <div style={{ color: "#ffb5b5", fontSize: 12, maxWidth: 860, lineHeight: 1.7 }}>
              Guild backstory is no longer edited here. It belongs to the free Possum AI path so each server can tune its own adaptive identity without
              tying that behavior to Persona AI or paid provider controls.
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href={possumAiHref} style={{ ...action, textDecoration: "none" }}>
                Edit Backstory In Possum AI
              </Link>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
