import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readJsonSafe } from "@/lib/botApi";
import { readServerCache, writeServerCache } from "@/lib/serverCache";

const GUILD_DATA_PROXY_TTL_MS = Math.max(2_000, Number(process.env.GUILD_DATA_PROXY_TTL_MS || 30_000));

type CachedGuildData = {
  status: number;
  body: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const guildId = String(req.query.guildId || "").trim();
  const viewerUserId = String(req.headers["x-dashboard-user-id"] || req.query.userId || "").trim();
  if (!guildId) {
    return res.status(400).json({ success: false, error: "guildId is required" });
  }

  try {
    const cacheKey = `bot-guild-data:${guildId}:${viewerUserId || "anon"}`;
    const cached = readServerCache<CachedGuildData>(cacheKey);

    try {
      const upstream = await fetchBotApi(
        `${BOT_API}/guild-data?guildId=${encodeURIComponent(guildId)}`,
        { headers: buildBotApiHeaders(req), cache: "no-store" }
      );

      const data = await readJsonSafe(upstream);
      if (upstream.ok && data?.success !== false) {
        writeServerCache(cacheKey, { status: upstream.status, body: data }, GUILD_DATA_PROXY_TTL_MS);
      }

      if (!upstream.ok && cached?.body) {
        return res.status(cached.status || 200).json(cached.body);
      }

      return res.status(upstream.status).json(data);
    } catch (error: any) {
      if (cached?.body) {
        return res.status(cached.status || 200).json(cached.body);
      }
      throw error;
    }

  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Bot API unreachable",
    });
  }
}
