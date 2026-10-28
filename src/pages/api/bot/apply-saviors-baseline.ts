import type { NextApiRequest, NextApiResponse } from "next";
import {
  PRIMARY_BASELINE_GUILD_ID,
  STOCK_LOCK_NON_PRIMARY,
  readGuildIdFromRequest,
  stockLockError,
} from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const guildId = readGuildIdFromRequest(req);
  const sourceGuildId = String(req.body?.sourceGuildId || PRIMARY_BASELINE_GUILD_ID).trim();

  if (!/^\d{16,20}$/.test(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });
  if (!/^\d{16,20}$/.test(sourceGuildId)) return res.status(400).json({ success: false, error: "sourceGuildId invalid" });

  if (STOCK_LOCK_NON_PRIMARY && guildId !== PRIMARY_BASELINE_GUILD_ID) {
    return res.status(403).json(stockLockError(guildId));
  }
  if (sourceGuildId !== PRIMARY_BASELINE_GUILD_ID) {
    return res.status(400).json({
      success: false,
      error: "sourceGuildId must be the primary baseline guild",
      sourceGuildId,
      primaryGuildId: PRIMARY_BASELINE_GUILD_ID,
    });
  }

  try {
    const srcRes = await fetch(`${BOT_API}/dashboard-config?guildId=${encodeURIComponent(sourceGuildId)}`, {
      headers: await buildBotApiHeaders(req),
      cache: "no-store",
    });
    const src = await readJsonSafe(srcRes);
    if (!srcRes.ok || !src?.config) {
      return res.status(srcRes.status || 500).json({ success: false, error: src?.error || "Failed to load baseline" });
    }

    const saveRes = await fetch(`${BOT_API}/dashboard-config`, {
      method: "POST",
      headers: await buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify({ guildId, patch: src.config }),
    });
    const out = await readJsonSafe(saveRes);
    return res.status(saveRes.status).json(out);
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "apply baseline failed" });
  }
}
