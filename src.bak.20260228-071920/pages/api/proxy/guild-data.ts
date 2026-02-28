import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function readParam(req: NextApiRequest, key: string): string {
  const v = req.query[key];
  return String(Array.isArray(v) ? v[0] : v || "").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = readParam(req, "guildId");
    const userId = readParam(req, "userId");

    if (!guildId) {
      return res.status(400).json({ success: false, error: "Missing guildId" });
    }

    const url = new URL(`${BOT_API}/guild-data`);
    url.searchParams.set("guildId", guildId);
    if (userId) url.searchParams.set("userId", userId);

    const headers: Record<string, string> = {};
    if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;

    const response = await fetch(url.toString(), {
      method: "GET",
      headers
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Proxy failed"
    });
  }
}
