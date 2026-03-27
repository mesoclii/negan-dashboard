import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readJsonSafe } from "@/lib/botApi";
import { readOrCreateServerCache } from "@/lib/serverCache";

const GUILD_DATA_PROXY_TTL_MS = Math.max(500, Number(process.env.GUILD_DATA_PROXY_TTL_MS || 2_000));

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
    const cached = await readOrCreateServerCache<{ status: number; body: unknown }>(
      cacheKey,
      GUILD_DATA_PROXY_TTL_MS,
      async () => {
        const upstream = await fetchBotApi(
          `${BOT_API}/guild-data?guildId=${encodeURIComponent(guildId)}`,
          { headers: buildBotApiHeaders(req), cache: "no-store" }
        );

        const data = await readJsonSafe(upstream);
        return { status: upstream.status, body: data };
      }
    );

    return res.status(cached.status).json(cached.body);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Bot API unreachable",
    });
  }
}
