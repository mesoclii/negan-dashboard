import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readJsonSafe } from "@/lib/botApi";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";
import { readOrCreateServerCache } from "@/lib/serverCache";

const ENGINE_CATALOG_PROXY_TTL_MS = Math.max(5_000, Number(process.env.ENGINE_CATALOG_PROXY_TTL_MS || 30_000));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    try {
      await enforceDashboardRateLimit(req, "bot_engine_catalog");
    } catch (error: any) {
      if (isRateLimitError(error)) {
        return res.status(429).json({ success: false, error: "Too many engine catalog requests. Please retry shortly." });
      }
    }

    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const params = new URLSearchParams();
    const guildId = String(req.query.guildId || "").trim();
    const engine = String(req.query.engine || "").trim();

    if (guildId) params.set("guildId", guildId);
    if (engine) params.set("engine", engine);

    const cacheKey = `engine-catalog:${guildId || "global"}:${engine || "all"}`;
    const cached = await readOrCreateServerCache<{ status: number; body: unknown }>(
      cacheKey,
      ENGINE_CATALOG_PROXY_TTL_MS,
      async () => {
        const upstream = await fetchBotApi(`${BOT_API}/engine-catalog${params.toString() ? `?${params.toString()}` : ""}`, {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        });

        const data = await readJsonSafe(upstream);
        return { status: upstream.status, body: data };
      }
    );
    return res.status(cached.status).json(cached.body);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot engine catalog unreachable" });
  }
}
