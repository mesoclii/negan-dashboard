import type { NextApiRequest, NextApiResponse } from "next";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_binding_reconciliation");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many reconciliation requests. Please retry shortly." });
      }
    }

    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.body?.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    const upstream = await fetch(`${BOT_API}/binding-reconciliation`, {
      method: "POST",
      headers: buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify({
        guildId,
        action: "apply",
      }),
    });
    const json = await readJsonSafe(upstream);

    void auditDashboardEvent({
      guildId,
      actorUserId: String(req.headers["x-dashboard-user-id"] || req.body?.userId || "").trim() || null,
      area: "binding-reconciliation",
      action: "apply",
      severity: upstream.ok ? "warn" : "error",
      metadata: {
        appliedEngines: Array.isArray((json as any)?.appliedEngines) ? (json as any).appliedEngines : [],
        appliedChangeCount: Number((json as any)?.appliedChangeCount || 0),
      },
    });

    return res.status(upstream.status).json(json);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
