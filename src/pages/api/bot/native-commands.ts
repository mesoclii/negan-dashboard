import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, fetchBotApi, readJsonSafe } from "@/lib/botApi";
import { readOrCreateServerCache } from "@/lib/serverCache";

const NATIVE_COMMANDS_PROXY_TTL_MS = Math.max(5_000, Number(process.env.NATIVE_COMMANDS_PROXY_TTL_MS || 30_000));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.query.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    const cacheKey = `native-commands:${guildId}`;
    const cached = await readOrCreateServerCache<{ status: number; body: unknown }>(
      cacheKey,
      NATIVE_COMMANDS_PROXY_TTL_MS,
      async () => {
        const upstream = await fetchBotApi(
          `${BOT_API}/api/native-commands/${encodeURIComponent(guildId)}`,
          { headers: buildBotApiHeaders(req), cache: "no-store" }
        );

        const data = await readJsonSafe(upstream);
        return { status: upstream.status, body: data };
      }
    );

    return res.status(cached.status).json(cached.body);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
