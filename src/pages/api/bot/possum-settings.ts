import type { NextApiRequest, NextApiResponse } from "next";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { readGuildIdFromRequest, isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_possum_settings");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many Possum AI requests. Please retry shortly." });
      }
    }

    const guildId = readGuildIdFromRequest(req);

    if (req.method === "GET") {
      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      const upstream = await fetch(`${BOT_API}/possum-settings?guildId=${encodeURIComponent(guildId)}`, {
        headers: await buildBotApiHeaders(req),
        cache: "no-store",
      });

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const body = req.body && typeof req.body === "object" ? { ...req.body, guildId } : { guildId };
      const upstream = await fetch(`${BOT_API}/possum-settings`, {
        method: "POST",
        headers: await buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify(body),
      });

      const data = await readJsonSafe(upstream);
      void auditDashboardEvent({
        guildId,
        actorUserId: String(req.headers["x-dashboard-user-id"] || req.body?.userId || req.query?.userId || "").trim() || null,
        area: "possum_ai",
        action: body.reset ? "reset" : "save",
        severity: upstream.ok ? "info" : "error",
        metadata: {
          keys: Object.keys((body.patch && typeof body.patch === "object" ? body.patch : {}) || {}),
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
