import type { NextApiRequest, NextApiResponse } from "next";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { requirePremiumAccess } from "@/lib/premiumGuard";

type TtsConfig = {
  active: boolean;
  enabled: boolean;
  commandEnabled: boolean;
  maxCharsPerMessage: number;
  cooldownSeconds: number;
  allowedChannelIds: string[];
  blockedChannelIds: string[];
  allowedRoleIds: string[];
  voiceChannelOnly: boolean;
  requirePrefix: boolean;
  prefix: string;
};

const DEFAULT_TTS: TtsConfig = {
  active: false,
  enabled: false,
  commandEnabled: true,
  maxCharsPerMessage: 300,
  cooldownSeconds: 5,
  allowedChannelIds: [],
  blockedChannelIds: [],
  allowedRoleIds: [],
  voiceChannelOnly: false,
  requirePrefix: false,
  prefix: "",
};

function toArray(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}

function toBool(v: any, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function toNum(v: any, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mergeUi(features: any, engine: any): TtsConfig {
  return {
    active: toBool(features?.ttsEnabled, toBool(engine?.enabled, DEFAULT_TTS.active)),
    enabled: toBool(engine?.enabled, DEFAULT_TTS.enabled),
    commandEnabled: toBool(engine?.commandEnabled, DEFAULT_TTS.commandEnabled),
    maxCharsPerMessage: toNum(engine?.maxCharsPerMessage, DEFAULT_TTS.maxCharsPerMessage),
    cooldownSeconds: toNum(engine?.cooldownSeconds, DEFAULT_TTS.cooldownSeconds),
    allowedChannelIds: toArray(engine?.allowedChannelIds),
    blockedChannelIds: toArray(engine?.blockedChannelIds),
    allowedRoleIds: toArray(engine?.allowedRoleIds),
    voiceChannelOnly: toBool(engine?.voiceChannelOnly, DEFAULT_TTS.voiceChannelOnly),
    requirePrefix: toBool(engine?.requirePrefix, DEFAULT_TTS.requirePrefix),
    prefix: String(engine?.prefix ?? DEFAULT_TTS.prefix),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId =
      req.method === "GET"
        ? String(req.query.guildId || "").trim()
        : String(req.body?.guildId || "").trim();

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (req.method !== "GET" && isWriteBlockedForGuild(guildId)) {
      return res.status(403).json(stockLockError(guildId));
    }

    if (req.method !== "GET") {
      const allowed = await requirePremiumAccess(req, res, guildId, "tts");
      if (allowed !== true) return allowed;
    }

    if (req.method === "GET") {
      const [dashRes, ttsRes] = await Promise.all([
        fetch(`${BOT_API}/dashboard-config?guildId=${encodeURIComponent(guildId)}`, {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        }),
        fetch(`${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=tts`, {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        }),
      ]);

      const dash = await readJsonSafe(dashRes);
      const tts = await readJsonSafe(ttsRes);

      const cfg = mergeUi(dash?.config?.features || {}, tts?.config || {});
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (req.method === "POST") {
      const patch = req.body?.patch || {};

      const [dashRes0, ttsRes0] = await Promise.all([
        fetch(`${BOT_API}/dashboard-config?guildId=${encodeURIComponent(guildId)}`, {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        }),
        fetch(`${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=tts`, {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        }),
      ]);

      const dash0 = await readJsonSafe(dashRes0);
      const tts0 = await readJsonSafe(ttsRes0);

      const currentFeatures = dash0?.config?.features || {};
      const currentEngine = tts0?.config || {};

      const nextActive = typeof patch.active === "boolean" ? patch.active : currentFeatures.ttsEnabled;
      const nextEngine = {
        ...currentEngine,
        enabled: typeof patch.enabled === "boolean" ? patch.enabled : nextActive,
        commandEnabled:
          typeof patch.commandEnabled === "boolean" ? patch.commandEnabled : currentEngine.commandEnabled,
        maxCharsPerMessage:
          typeof patch.maxCharsPerMessage === "number" ? patch.maxCharsPerMessage : currentEngine.maxCharsPerMessage,
        cooldownSeconds:
          typeof patch.cooldownSeconds === "number" ? patch.cooldownSeconds : currentEngine.cooldownSeconds,
        allowedChannelIds:
          Array.isArray(patch.allowedChannelIds) ? patch.allowedChannelIds : toArray(currentEngine.allowedChannelIds),
        blockedChannelIds:
          Array.isArray(patch.blockedChannelIds) ? patch.blockedChannelIds : toArray(currentEngine.blockedChannelIds),
        allowedRoleIds:
          Array.isArray(patch.allowedRoleIds) ? patch.allowedRoleIds : toArray(currentEngine.allowedRoleIds),
        voiceChannelOnly:
          typeof patch.voiceChannelOnly === "boolean" ? patch.voiceChannelOnly : toBool(currentEngine.voiceChannelOnly, false),
        requirePrefix:
          typeof patch.requirePrefix === "boolean" ? patch.requirePrefix : toBool(currentEngine.requirePrefix, false),
        prefix: typeof patch.prefix === "string" ? patch.prefix : String(currentEngine.prefix ?? ""),
      };

      const [dashSaveRes, ttsSaveRes] = await Promise.all([
        fetch(`${BOT_API}/dashboard-config`, {
          method: "POST",
          headers: buildBotApiHeaders(req, { json: true }),
          body: JSON.stringify({
            guildId,
            patch: { features: { ttsEnabled: !!nextActive } },
          }),
        }),
        fetch(`${BOT_API}/engine-config`, {
          method: "POST",
          headers: buildBotApiHeaders(req, { json: true }),
          body: JSON.stringify({
            guildId,
            engine: "tts",
            config: nextEngine,
          }),
        }),
      ]);

      const dashSave = await readJsonSafe(dashSaveRes);
      const ttsSave = await readJsonSafe(ttsSaveRes);

      if (!dashSaveRes.ok || dashSave?.success === false) {
        return res.status(502).json({ success: false, error: dashSave?.error || "Failed to save dashboard ttsEnabled" });
      }
      if (!ttsSaveRes.ok || ttsSave?.success === false) {
        return res.status(502).json({ success: false, error: ttsSave?.error || "Failed to save tts engine config" });
      }

      const cfg = mergeUi({ ...currentFeatures, ttsEnabled: !!nextActive }, nextEngine);
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
