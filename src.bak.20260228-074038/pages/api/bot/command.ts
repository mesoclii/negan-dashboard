import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function buildHeaders(req: NextApiRequest, json = false) {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) h["x-dashboard-token"] = DASHBOARD_TOKEN;
  const userId = String(req.headers["x-dashboard-user-id"] || "").trim();
  if (userId) h["x-dashboard-user-id"] = userId;
  return h;
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return { success: false, error: text || "Invalid upstream JSON" }; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const upstream = await fetch(`${BOT_API}/api/command`, {
      method: "POST",
      headers: buildHeaders(req, true),
      body: JSON.stringify(req.body || {}),
    });
    const data = await readJsonSafe(upstream);
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
