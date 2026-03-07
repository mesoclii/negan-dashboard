import type { NextApiRequest, NextApiResponse } from "next";
import {
  readGuildIdFromRequest,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

function normalizeMode(value: unknown) {
  const raw = String(value || "builtIn").trim().toLowerCase();
  return raw === "stock" || raw === "off" ? "stock" : "builtIn";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = readGuildIdFromRequest(req);
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (isWriteBlockedForGuild(guildId)) {
      return res.status(403).json(stockLockError(guildId));
    }

    const body = req.body && typeof req.body === "object" ? { ...req.body } : {};
    body.guildId = guildId;
    body.mode = normalizeMode((body as Record<string, unknown>).mode);

    const upstream = await fetch(`${BOT_API}/guild-baseline`, {
      method: "POST",
      headers: buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify(body),
    });

    const data = await readJsonSafe(upstream);
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Bot baseline API unreachable",
    });
  }
}
