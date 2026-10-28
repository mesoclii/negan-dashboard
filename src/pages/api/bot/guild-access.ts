import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readActorUserId, readJsonSafe } from "@/lib/botApi";
import { readServerCache, writeServerCache } from "@/lib/serverCache";

const GUILD_ACCESS_PROXY_TTL_MS = Math.max(1_000, Number(process.env.GUILD_ACCESS_PROXY_TTL_MS || 300_000));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const guildId = String(req.query.guildId || "").trim();
  const userId = await readActorUserId(req);
  const routePath = String(req.query.routePath || req.query.route || "").trim();

  if (!guildId || !userId) {
    return res.status(401).json({ success: false, error: "A valid dashboard session and guildId are required" });
  }

  try {
    const cacheKey = `bot-guild-access:${guildId}:${userId}:${routePath || "/"}`;
    const cached = readServerCache<{ status: number; body: unknown }>(cacheKey);
    if (cached) {
      return res.status(cached.status).json(cached.body);
    }

    const query = new URLSearchParams();
    query.set("guildId", guildId);
    query.set("userId", userId);
    if (routePath) query.set("routePath", routePath);
    const upstream = await fetchBotApi(
      `${BOT_API}/guild-access?${query.toString()}`,
      {
        headers: await buildBotApiHeaders(req),
        cache: "no-store",
      }
    );

    const data = await readJsonSafe(upstream);
    if (upstream.ok) {
      writeServerCache(cacheKey, { status: upstream.status, body: data }, GUILD_ACCESS_PROXY_TTL_MS);
    }
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Bot API unreachable",
    });
  }
}
