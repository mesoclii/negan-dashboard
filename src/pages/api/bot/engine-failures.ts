import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_engine_failures");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many engine failure requests. Please retry shortly." });
      }
    }

    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.query.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    const upstream = await fetch(`${BOT_API}/engine-failures?guildId=${encodeURIComponent(guildId)}`, {
      headers: await buildBotApiHeaders(req),
      cache: "no-store",
    });
    const data = await readJsonSafe(upstream);
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
