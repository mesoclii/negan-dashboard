/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type { CSSProperties, ChangeEvent } from "react";
import { useMemo, useState } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";
import { buildDashboardHref } from "@/lib/dashboardContext";

type AvatarPreset = {
  url: string;
  label?: string;
};

type PersonaConfig = {
  enabled: boolean;
  guildNickname: string;
  botName: string;
  webhookName: string;
  webhookAvatarUrl: string;
  avatarLibrary: AvatarPreset[];
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
  avatarLibrary: [],
  useWebhookPersona: false,
  profileBannerUrl: "",
  activityType: "LISTENING",
  activityText: "/help",
  status: "online",
};

const MAX_AVATAR_UPLOAD_BYTES = 2_000_000;

function isImageSource(value: unknown) {
  const text = String(value || "").trim();
  return /^https?:\/\//i.test(text) || /^data:image\/[a-z0-9.+-]+;base64,/i.test(text);
}

function safePreviewUrl(value: unknown) {
  const text = String(value || "").trim();
  return isImageSource(text) ? text : "";
}

function normalizeAvatarLibrary(raw: unknown): AvatarPreset[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const output: AvatarPreset[] = [];
  for (const entry of raw) {
    const row = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const url = safePreviewUrl(row.url || row.imageUrl || "");
    if (!url) continue;
    const key = url.slice(0, 512).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      url,
      label: String(row.label || row.name || "").trim().slice(0, 120),
    });
    if (output.length >= 24) break;
  }
  return output;
}

function sanitizeConfig(rawCfg: Partial<PersonaConfig> | null | undefined): PersonaConfig {
  const src = rawCfg && typeof rawCfg === "object" ? rawCfg : {};
  return {
    enabled: src.enabled !== false,
    guildNickname: String(src.guildNickname || ""),
    botName: String(src.botName || ""),
    webhookName: String(src.webhookName || ""),
    webhookAvatarUrl: String(src.webhookAvatarUrl || ""),
    avatarLibrary: normalizeAvatarLibrary(src.avatarLibrary),
    useWebhookPersona: Boolean(src.useWebhookPersona),
    profileBannerUrl: String(src.profileBannerUrl || ""),
    activityType: String(src.activityType || "LISTENING"),
    activityText: String(src.activityText || "/help"),
    status: String(src.status || "online"),
  };
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Image load failed."));
    reader.readAsDataURL(file);
  });
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
const subAction: CSSProperties = {
  ...action,
  padding: "8px 10px",
  fontSize: 12,
};
const hint: CSSProperties = {
  color: "#ffb5b5",
  fontSize: 12,
  lineHeight: 1.7,
};

function previewName(cfg: PersonaConfig, botUser?: { globalName?: string; username?: string } | null) {
  return String(
    cfg.guildNickname ||
    cfg.botName ||
    cfg.webhookName ||
    botUser?.globalName ||
    botUser?.username ||
    "Possum"
  ).trim();
}

export default function BotPersonalizerClient() {
  const {
    guildId,
    guildName,
    config: rawCfg,
    setConfig: setCfg,
    botUser,
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
  const previewAvatar = safePreviewUrl(cfg.webhookAvatarUrl);
  const previewBanner = safePreviewUrl(cfg.profileBannerUrl);
  const liveBotAvatar = safePreviewUrl(botUser?.avatarUrl);
  const previewBotName = previewName(cfg, botUser);
  const [avatarPreviewFailedFor, setAvatarPreviewFailedFor] = useState("");
  const [bannerPreviewFailedFor, setBannerPreviewFailedFor] = useState("");
  const [avatarLibraryLabel, setAvatarLibraryLabel] = useState("");
  const [avatarLibraryMessage, setAvatarLibraryMessage] = useState("");
  const avatarPreviewFailed = Boolean(previewAvatar && avatarPreviewFailedFor === previewAvatar);
  const bannerPreviewFailed = Boolean(previewBanner && bannerPreviewFailedFor === previewBanner);
  const effectivePreviewAvatar = avatarPreviewFailed ? "" : previewAvatar;
  const displayedAvatar = effectivePreviewAvatar || liveBotAvatar;
  const usingLiveBotAvatarFallback = !effectivePreviewAvatar && Boolean(liveBotAvatar);

  function updateCfg(patch: Partial<PersonaConfig>) {
    setCfg((prev) => sanitizeConfig({ ...(prev || {}), ...patch }));
  }

  function setAvatarSource(url: string, notice: string) {
    updateCfg({ webhookAvatarUrl: url });
    setAvatarPreviewFailedFor("");
    setAvatarLibraryMessage(notice);
  }

  function saveAvatarToLibrary(url: string, preferredLabel = "") {
    const source = safePreviewUrl(url);
    if (!source) {
      setAvatarLibraryMessage("Chat avatar source must be an image URL or an uploaded image.");
      return;
    }
    setCfg((prev) => {
      const current = sanitizeConfig(prev);
      const existing = current.avatarLibrary.find((entry) => entry.url === source);
      const label = String(preferredLabel || avatarLibraryLabel || existing?.label || "").trim().slice(0, 120);
      return sanitizeConfig({
        ...current,
        webhookAvatarUrl: source,
        avatarLibrary: normalizeAvatarLibrary([
          { url: source, label },
          ...current.avatarLibrary.filter((entry) => entry.url !== source),
        ]),
      });
    });
    setAvatarLibraryLabel("");
    setAvatarPreviewFailedFor("");
    setAvatarLibraryMessage("Saved avatar added for this guild and selected for webhook replies.");
  }

  function removeSavedAvatar(url: string) {
    setCfg((prev) => {
      const current = sanitizeConfig(prev);
      return sanitizeConfig({
        ...current,
        webhookAvatarUrl: current.webhookAvatarUrl === url ? "" : current.webhookAvatarUrl,
        avatarLibrary: current.avatarLibrary.filter((entry) => entry.url !== url),
      });
    });
    setAvatarLibraryMessage("Saved avatar removed.");
  }

  async function handleAvatarUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!String(file.type || "").toLowerCase().startsWith("image/")) {
      setAvatarLibraryMessage("Please upload an image file.");
      return;
    }
    if (file.size > MAX_AVATAR_UPLOAD_BYTES) {
      setAvatarLibraryMessage("Saved avatar upload is too large. Keep it under 2 MB.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const fileLabel = String(file.name || "").replace(/\.[^.]+$/, "");
      saveAvatarToLibrary(dataUrl, avatarLibraryLabel || fileLabel);
    } catch (err: any) {
      setAvatarLibraryMessage(err?.message || "Avatar upload failed.");
    }
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
              Guild nickname applies live in this guild. Presence applies live across the bot account. Chat avatar can now use a direct image link,
              the live bot avatar fallback, or a saved guild image library for webhook-backed Possum replies.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => void applyLiveNow()} disabled={saving} style={action}>
              {saving ? "Applying..." : "Apply Live Now"}
            </button>
            <button type="button" onClick={() => void saveAndApply()} disabled={saving} style={action}>
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
                  <label>Chat avatar source</label>
                  <input
                    style={input}
                    value={cfg.webhookAvatarUrl || ""}
                    onChange={(e) => updateCfg({ webhookAvatarUrl: e.target.value })}
                    placeholder="https://... or leave blank to use the live bot avatar"
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

              <div style={{ ...card, marginBottom: 0, marginTop: 12, background: "rgba(25, 0, 0, 0.45)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 900, color: "#ff8b8b", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      Saved Avatar Library
                    </div>
                    <div style={hint}>
                      Save per-guild avatar art here and reuse it instead of pasting links every time. Webhook replies can use these saved avatars per guild.
                      These webhook avatars stay guild-scoped and do not overwrite the shared bot account avatar.
                    </div>
                  </div>
                  <button
                    type="button"
                    style={subAction}
                    onClick={() => {
                      updateCfg({ webhookAvatarUrl: "" });
                      setAvatarPreviewFailedFor("");
                      setAvatarLibraryMessage("Webhook replies will use the live bot avatar until you choose a custom source again.");
                    }}
                  >
                    Use Live Bot Avatar
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) auto", gap: 12, marginTop: 12, alignItems: "end" }}>
                  <div>
                    <label>Saved avatar label</label>
                    <input
                      style={input}
                      value={avatarLibraryLabel}
                      onChange={(e) => setAvatarLibraryLabel(e.target.value)}
                      placeholder="Server default, Halloween, VIP, ..."
                    />
                  </div>
                  <button
                    type="button"
                    style={subAction}
                    onClick={() => saveAvatarToLibrary(cfg.webhookAvatarUrl)}
                  >
                    Save Current Source
                  </button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label>Upload saved avatar</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => void handleAvatarUpload(event)}
                    style={{ ...input, padding: 8 }}
                  />
                </div>

                {avatarLibraryMessage ? <div style={{ color: "#ffd27a", marginTop: 10 }}>{avatarLibraryMessage}</div> : null}

                <div style={{ marginTop: 14 }}>
                  <div style={{ fontWeight: 800, marginBottom: 8, color: "#ffb5b5" }}>
                    Saved avatars for {guildName || guildId}
                  </div>
                  {cfg.avatarLibrary.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                      {cfg.avatarLibrary.map((entry, index) => {
                        const selected = String(entry.url || "").trim() === String(cfg.webhookAvatarUrl || "").trim();
                        const src = safePreviewUrl(entry.url);
                        return (
                          <div
                            key={`${index}-${entry.label || "avatar"}`}
                            style={{
                              border: `1px solid ${selected ? "#ff7a7a" : "rgba(255,0,0,.28)"}`,
                              borderRadius: 12,
                              overflow: "hidden",
                              background: "rgba(18, 0, 0, 0.72)",
                            }}
                          >
                            <div style={{ aspectRatio: "1 / 1", background: "linear-gradient(135deg, #511111 0%, #160808 100%)" }}>
                              {src ? (
                                <img
                                  src={src}
                                  alt={entry.label || `Saved avatar ${index + 1}`}
                                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                              ) : null}
                            </div>
                            <div style={{ padding: 10 }}>
                              <div style={{ fontWeight: 800, color: "#ffe2e2" }}>{entry.label || `Saved Avatar ${index + 1}`}</div>
                              <div style={hint}>{selected ? "Selected for webhook replies in this guild." : "Saved and ready to reuse."}</div>
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                                <button
                                  type="button"
                                  style={subAction}
                                  onClick={() => setAvatarSource(entry.url, "Saved avatar selected for webhook replies.")}
                                >
                                  {selected ? "Selected" : "Use This"}
                                </button>
                                <button
                                  type="button"
                                  style={subAction}
                                  onClick={() => removeSavedAvatar(entry.url)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={hint}>No saved avatars yet. Upload one or save the current chat avatar source.</div>
                  )}
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
                    <img
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
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {displayedAvatar ? (
                      <img
                        src={displayedAvatar}
                        alt="Avatar preview"
                        referrerPolicy="no-referrer"
                        onError={() => {
                          if (previewAvatar && displayedAvatar === previewAvatar) {
                            setAvatarPreviewFailedFor(previewAvatar);
                          }
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 26, fontWeight: 900, color: "#ffd2d2" }}>
                        {(previewBotName || "P").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div style={{ paddingTop: 42 }}>
                    <div style={{ fontSize: 22, fontWeight: 900 }}>{previewBotName}</div>
                    <div style={{ color: "#ffb7b7", fontSize: 13, marginTop: 4 }}>
                      {String(cfg.status || "online").toUpperCase()} | {String(cfg.activityType || "LISTENING").toUpperCase()} {String(cfg.activityText || "/help")}
                    </div>
                    <div style={{ color: "#ff9797", fontSize: 12, marginTop: 8 }}>
                      {cfg.useWebhookPersona
                        ? usingLiveBotAvatarFallback
                          ? "Webhook identity is using the live bot avatar fallback until a custom guild avatar source is selected."
                          : "Webhook identity will use the selected custom avatar for Possum AI replies where supported."
                        : "Default bot identity remains active until webhook mode is enabled."}
                    </div>
                    {(avatarPreviewFailed || bannerPreviewFailed) ? (
                      <div style={{ color: "#ffb0b0", fontSize: 11, marginTop: 8 }}>
                        One or more preview images could not be loaded. The runtime will fall back to the live bot avatar if the chat avatar link is dead.
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
                This page controls naming, presence, avatar source selection, and webhook identity. Possum AI still owns the guild backstory and adaptive identity notes.
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
