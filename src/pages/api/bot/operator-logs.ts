import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readJsonSafe } from "@/lib/botApi";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_operator_logs");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many operator log requests. Please retry shortly." });
      }
    }

    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      const engine = String(req.query.engine || "").trim();
      const level = String(req.query.level || "").trim();
      const limit = String(req.query.limit || "").trim();
      const query = new URLSearchParams();
      if (guildId) query.set("guildId", guildId);
      if (engine) query.set("engine", engine);
      if (level) query.set("level", level);
      if (limit) query.set("limit", limit);
      const upstream = await fetchBotApi(`${BOT_API}/operator-logs?${query.toString()}`, {
        headers: buildBotApiHeaders(req),
        cache: "no-store",
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      const upstream = await fetchBotApi(`${BOT_API}/operator-logs`, {
        method: "POST",
        headers: {
          ...buildBotApiHeaders(req),
          "content-type": "application/json",
        },
        body: JSON.stringify(req.body || {}),
        cache: "no-store",
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
