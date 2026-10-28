import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_event_reactor_failures");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many event reactor requests. Please retry shortly." });
      }
    }

    const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (req.method === "GET") {
      const limit = String(req.query.limit || "").trim();
      const query = new URLSearchParams({ guildId });
      if (limit) query.set("limit", limit);

      const upstream = await fetch(`${BOT_API}/event-reactor-failures?${query.toString()}`, {
        headers: await buildBotApiHeaders(req),
        cache: "no-store",
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      const upstream = await fetch(`${BOT_API}/event-reactor-failures`, {
        method: "POST",
        headers: await buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({
          guildId,
          action: req.body?.action || "",
        }),
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
