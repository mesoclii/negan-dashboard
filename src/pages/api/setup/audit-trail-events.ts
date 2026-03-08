import type { NextApiRequest, NextApiResponse } from "next";
import { listDashboardAuditEvents } from "@/lib/dashboardAudit";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await enforceDashboardRateLimit(req, "audit_trail_events");
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return res.status(429).json({ success: false, error: "Too many audit requests. Please retry shortly." });
    }
  }

  const guildId = String(req.query.guildId || "").trim();
  const limit = Math.max(20, Math.min(500, Number(req.query.limit || 200)));
  const events = await listDashboardAuditEvents({ guildId, limit });
  return res.status(200).json({ success: true, events });
}
