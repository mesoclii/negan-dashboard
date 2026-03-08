import type { NextApiRequest, NextApiResponse } from "next";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { requirePremiumAccess } from "@/lib/premiumGuard";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "runtime_engine_action");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many runtime actions. Please retry shortly." });
      }
    }

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.body?.guildId || "").trim();
    const engine = String(req.body?.engine || "").trim();
    const action = String(req.body?.action || "").trim();

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }
    if (!engine) {
      return res.status(400).json({ success: false, error: "engine is required" });
    }
    if (!action) {
      return res.status(400).json({ success: false, error: "action is required" });
    }

    if (isWriteBlockedForGuild(guildId)) {
      return res.status(403).json(stockLockError(guildId));
    }

    const allowed = await requirePremiumAccess(req, res, guildId, engine);
    if (allowed !== true) return allowed;

    const upstream = await fetch(`${BOT_API}/engine-runtime/action`, {
      method: "POST",
      headers: buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify({
        guildId,
        engine,
        action,
      }),
    });
    const json = await readJsonSafe(upstream);
    void auditDashboardEvent({
      guildId,
      actorUserId: String(req.headers["x-dashboard-user-id"] || req.body?.userId || "").trim() || null,
      area: "runtime_engine_action",
      action: `${engine}:${action}`,
      severity: upstream.ok ? "info" : "error",
      metadata: {
        engine,
        action,
      },
    });
    return res.status(upstream.status).json(json);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
