import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const guildId = String(req.body?.guildId || "").trim();
  const targetUserId = String(req.body?.targetUserId || "").trim();
  const amount = Math.floor(Number(req.body?.amount || 0));
  const reason = String(req.body?.reason || "").trim();

  if (!/^\d{16,20}$/.test(guildId)) {
    return res.status(400).json({ success: false, error: "guildId is required" });
  }
  if (!/^\d{16,20}$/.test(targetUserId)) {
    return res.status(400).json({ success: false, error: "targetUserId is required" });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: "amount must be a positive whole number" });
  }

  try {
    const upstream = await fetch(`${BOT_API}/economy/grant-coins`, {
      method: "POST",
      headers: buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify({
        guildId,
        targetUserId,
        amount,
        reason,
      }),
    });
    const json = await readJsonSafe(upstream);
    return res.status(upstream.status).json(json);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to grant coins" });
  }
}
