import type { NextApiRequest, NextApiResponse } from "next";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.body?.guildId || "").trim();
    const engine = String(req.body?.engine || "").trim();
    const action = String(req.body?.action || "").trim();

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }
    if (!engine) {
      return res.status(400).json({ success: false, error: "engine is required" });
    }
    if (!action) {
      return res.status(400).json({ success: false, error: "action is required" });
    }

    if (isWriteBlockedForGuild(guildId)) {
      return res.status(403).json(stockLockError(guildId));
    }

    const upstream = await fetch(`${BOT_API}/engine-runtime/action`, {
      method: "POST",
      headers: buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify({
        guildId,
        engine,
        action,
      }),
    });
    const json = await readJsonSafe(upstream);
    return res.status(upstream.status).json(json);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
