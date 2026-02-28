import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

async function readJsonSafe(resp: Response) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, error: text || "Invalid JSON response" };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!DASHBOARD_TOKEN) {
      return res.status(500).json({ success: false, error: "Missing DASHBOARD_API_TOKEN" });
    }

    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "Missing guildId" });

      const upstream = await fetch(
        `${BOT_API}/dashboard-config?guildId=${encodeURIComponent(guildId)}`,
        { headers: { "x-dashboard-token": DASHBOARD_TOKEN } }
      );

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      const upstream = await fetch(`${BOT_API}/dashboard-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-token": DASHBOARD_TOKEN
        },
        body: JSON.stringify(req.body || {})
      });

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
