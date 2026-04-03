import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readJsonSafe } from "@/lib/botApi";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_engine_backup");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many backup requests. Please retry shortly." });
      }
    }

    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      const engine = String(req.query.engine || "").trim();
      const query = new URLSearchParams();
      if (guildId) query.set("guildId", guildId);
      if (engine) query.set("engine", engine);

      const upstream = await fetchBotApi(`${BOT_API}/engine-backup?${query.toString()}`, {
        headers: buildBotApiHeaders(req),
        cache: "no-store",
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      const upstream = await fetchBotApi(`${BOT_API}/engine-backup`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify(req.body || {}),
        cache: "no-store",
      });
      const data = await readJsonSafe(upstream);

      if (upstream.ok) {
        await auditDashboardEvent({
          guildId: String(req.body?.guildId || "").trim(),
          area: "engine-backup",
          action: "restore",
          metadata: {
            appliedEngines: Array.isArray(data?.appliedEngines) ? data.appliedEngines : [],
            mode: String(req.body?.mode || "merge").trim() || "merge",
          },
        }).catch(() => {});
      }

      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot backup API unreachable" });
  }
}
