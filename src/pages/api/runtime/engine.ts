import type { NextApiRequest, NextApiResponse } from "next";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { requirePremiumAccess } from "@/lib/premiumGuard";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";
import { normalizeEngineKey } from "@/lib/engineKeys";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "runtime_engine");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many runtime-engine requests. Please retry shortly." });
      }
    }

    const guildId =
      req.method === "GET"
        ? String(req.query.guildId || "").trim()
        : String(req.body?.guildId || "").trim();
    const engine =
      req.method === "GET"
        ? String(req.query.engine || "").trim()
        : String(req.body?.engine || "").trim();
    const normalizedEngine = normalizeEngineKey(engine);

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }
    if (!normalizedEngine) {
      return res.status(400).json({ success: false, error: "engine is required" });
    }

    if (req.method !== "GET" && isWriteBlockedForGuild(guildId)) {
      return res.status(403).json(stockLockError(guildId));
    }

    if (req.method !== "GET") {
      const allowed = await requirePremiumAccess(req, res, guildId, normalizedEngine);
      if (allowed !== true) return allowed;
    }

    if (req.method === "GET") {
      const upstream = await fetch(
        `${BOT_API}/engine-runtime?guildId=${encodeURIComponent(guildId)}&engine=${encodeURIComponent(normalizedEngine)}`,
        {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        }
      );
      const json = await readJsonSafe(upstream);
      return res.status(upstream.status).json(json);
    }

    if (req.method === "POST" || req.method === "PUT") {
      const upstream = await fetch(`${BOT_API}/engine-runtime`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({
          guildId,
          engine: normalizedEngine,
          patch: req.body?.patch || req.body?.config || {},
        }),
      });
      const json = await readJsonSafe(upstream);
      void auditDashboardEvent({
        guildId,
        actorUserId: String(req.headers["x-dashboard-user-id"] || req.body?.userId || "").trim() || null,
        area: "runtime_engine",
        action: `${normalizedEngine}:save`,
        severity: upstream.ok ? "info" : "error",
        metadata: {
          engine: normalizedEngine,
          keys: Object.keys(req.body?.patch || req.body?.config || {}),
        },
      });
      return res.status(upstream.status).json(json);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
