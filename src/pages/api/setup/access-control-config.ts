import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId =
      req.method === "GET"
        ? String(req.query.guildId || "").trim()
        : String(req.body?.guildId || "").trim();

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (req.method === "GET") {
      const upstream = await fetch(
        `${BOT_API}/dashboard-access-config?guildId=${encodeURIComponent(guildId)}`,
        {
          headers: buildBotApiHeaders(req),
          cache: "no-store",
        }
      );
      const json = await readJsonSafe(upstream);
      return res.status(upstream.status).json(json);
    }

    if (req.method === "POST" || req.method === "PUT") {
      const upstream = await fetch(`${BOT_API}/dashboard-access-config`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({
          guildId,
          patch: req.body?.patch || req.body?.config || {},
        }),
      });
      const json = await readJsonSafe(upstream);
      return res.status(upstream.status).json(json);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
