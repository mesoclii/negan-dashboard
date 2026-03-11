import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.query.guildId || "").trim();
    const query = guildId ? `?guildId=${encodeURIComponent(guildId)}` : "";
    const upstream = await fetch(`${BOT_API}/openai-runtime${query}`, {
      headers: buildBotApiHeaders(req),
      cache: "no-store",
    });
    const data = await readJsonSafe(upstream);
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
