import type { NextApiRequest, NextApiResponse } from "next";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import {
  readGuildIdFromRequest,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readJsonSafe } from "@/lib/botApi";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";
import { requirePremiumAccess, mapPremiumFeatureKey } from "@/lib/premiumGuard";
import { deleteServerCachePrefix, readServerCache, writeServerCache } from "@/lib/serverCache";

const ENGINE_CONFIG_PROXY_TTL_MS = Math.max(1_000, Number(process.env.ENGINE_CONFIG_PROXY_TTL_MS || 10_000));

type CachedEngineConfig = {
  status: number;
  body: unknown;
};

function normalizeWriteBody(req: NextApiRequest, guildId: string) {
  const body = req.body && typeof req.body === "object" ? { ...req.body } : {};
  body.guildId = guildId;

  if (
    typeof body.engine === "string" &&
    body.engine.trim() &&
    body.config === undefined &&
    body.patch !== undefined
  ) {
    body.config = body.patch;
  }

  return body;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_engine_config");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many engine config requests. Please retry shortly." });
      }
    }

    const guildId = readGuildIdFromRequest(req);

    if (req.method === "GET") {
      const engine = String(req.query.engine || "").trim();

      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      const query = new URLSearchParams({ guildId });
      if (engine) query.set("engine", engine);
      const cacheKey = `engine-config:${guildId}:${engine || "__all__"}`;
      const cached = readServerCache<CachedEngineConfig>(cacheKey);

      try {
        const upstream = await fetchBotApi(`${BOT_API}/engine-config?${query.toString()}`, {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        });

        const data = await readJsonSafe(upstream);
        if (upstream.ok && data?.success !== false) {
          writeServerCache(cacheKey, { status: upstream.status, body: data }, ENGINE_CONFIG_PROXY_TTL_MS);
        }
        if (!upstream.ok && cached?.body) {
          return res.status(cached.status || 200).json(cached.body);
        }
        return res.status(upstream.status).json(data);
      } catch (error: any) {
        if (cached?.body) {
          return res.status(cached.status || 200).json(cached.body);
        }
        throw error;
      }
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const body = normalizeWriteBody(req, guildId);
      if (typeof body.engine === "string" && body.engine.trim()) {
        const featureKey = mapPremiumFeatureKey(body.engine);
        if (["tts", "heist", "persona", "openai-platform"].includes(featureKey)) {
          const allowed = await requirePremiumAccess(req, res, guildId, featureKey);
          if (!allowed) return;
        }
      }
      const upstream = await fetchBotApi(`${BOT_API}/engine-config`, {
        method: req.method,
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify(body),
      });

      const data = await readJsonSafe(upstream);
      deleteServerCachePrefix(`engine-config:${guildId}:`);
      void auditDashboardEvent({
        guildId,
        actorUserId: String(req.headers["x-dashboard-user-id"] || req.body?.userId || req.query?.userId || "").trim() || null,
        area: "engine_config",
        action: `${String(body.engine || "unknown")}:save`,
        severity: upstream.ok ? "info" : "error",
        metadata: {
          engine: body.engine || null,
          keys: Object.keys((body.config && typeof body.config === "object" ? body.config : {}) || {}),
        },
      });
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Bot API unreachable",
    });
  }
}
