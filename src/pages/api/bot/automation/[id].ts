import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id || "").trim();
  if (!id) return res.status(400).json({ success: false, error: "id is required" });

  try {
    if (req.method === "GET") {
      const upstream = await fetch(`${BOT_API}/api/automation/${encodeURIComponent(id)}`, {
        headers: buildBotApiHeaders(req),
        cache: "no-store",
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "PUT") {
      const upstream = await fetch(`${BOT_API}/api/automation/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify(req.body || {}),
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "DELETE") {
      const upstream = await fetch(`${BOT_API}/api/automation/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: buildBotApiHeaders(req),
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
