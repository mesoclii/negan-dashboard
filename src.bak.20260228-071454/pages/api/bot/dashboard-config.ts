import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) h["x-dashboard-token"] = DASHBOARD_TOKEN;
  return h;
}

async function readJsonSafe(r: Response) {
  const text = await r.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return { success: false, error: text || "Invalid upstream response" }; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const upstream = await fetch(
        `${BOT_API}/dashboard-config?guildId=${encodeURIComponent(guildId)}`,
        { headers: authHeaders(false) }
      );
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      const upstream = await fetch(`${BOT_API}/dashboard-config`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(req.body || {})
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Proxy error" });
  }
}
