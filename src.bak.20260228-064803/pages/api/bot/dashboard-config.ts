import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();
const OPERATOR_USER_ID = String(process.env.DASHBOARD_OPERATOR_USER_ID || "").trim();

function isSnowflake(v: string) {
  return /^\d{16,20}$/.test(String(v || "").trim());
}

function readUserId(req: NextApiRequest) {
  const headerA = String(req.headers["x-dashboard-user-id"] || "").trim();
  const headerB = String(req.headers["x-user-id"] || "").trim();
  const queryId = String(req.query.userId || "").trim();
  const bodyId =
    req.body && typeof req.body === "object" ? String((req.body as any).userId || "").trim() : "";

  const picked = headerA || headerB || queryId || bodyId || OPERATOR_USER_ID;
  return isSnowflake(picked) ? picked : "";
}

function headersWithAuth(req: NextApiRequest, json = false) {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) h["x-dashboard-token"] = DASHBOARD_TOKEN;

  const userId = readUserId(req);
  if (userId) h["x-dashboard-user-id"] = userId;

  return h;
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid upstream JSON" };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!isSnowflake(guildId)) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      const upstream = await fetch(
        `${BOT_API}/dashboard-config?guildId=${encodeURIComponent(guildId)}`,
        { headers: headersWithAuth(req, false) }
      );
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      const upstream = await fetch(`${BOT_API}/dashboard-config`, {
        method: "POST",
        headers: headersWithAuth(req, true),
        body: JSON.stringify(req.body || {})
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Bot API unreachable" });
  }
}
