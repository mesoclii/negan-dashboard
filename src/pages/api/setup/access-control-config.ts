import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "access_control_config");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many access-control requests. Please retry shortly." });
      }
    }

    const guildId =
      req.method === "GET"
        ? String(req.query.guildId || "").trim()
        : String(req.body?.guildId || "").trim();

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (req.method === "GET") {
      const upstream = await fetch(
        `${BOT_API}/dashboard-access-config?guildId=${encodeURIComponent(guildId)}`,
        {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        }
      );
      const json = await readJsonSafe(upstream);
      return res.status(upstream.status).json(json);
    }

    if (req.method === "POST" || req.method === "PUT") {
      const upstream = await fetch(`${BOT_API}/dashboard-access-config`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({
          guildId,
          patch: req.body?.patch || req.body?.config || {},
        }),
      });
      const json = await readJsonSafe(upstream);
      void auditDashboardEvent({
        guildId,
        actorUserId: String(req.headers["x-dashboard-user-id"] || req.body?.userId || "").trim() || null,
        area: "bot_masters",
        action: "save_access_control",
        severity: upstream.ok ? "info" : "error",
        metadata: {
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
