import type { NextApiRequest, NextApiResponse } from "next";
import {
  readGuildIdFromRequest,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function headersWithAuth(json = false) {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;
  return headers;
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid upstream JSON" };
  }
}

function normalizeWriteBody(req: NextApiRequest, guildId: string) {
  const body = req.body && typeof req.body === "object" ? { ...req.body } : {};
  body.guildId = guildId;

  if (
    typeof body.engine === "string" &&
    body.engine.trim() &&
    body.config === undefined &&
    body.patch !== undefined
  ) {
    body.config = body.patch;
  }

  return body;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = readGuildIdFromRequest(req);

    if (req.method === "GET") {
      const engine = String(req.query.engine || "").trim();

      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      const query = new URLSearchParams({ guildId });
      if (engine) query.set("engine", engine);

      const upstream = await fetch(`${BOT_API}/engine-config?${query.toString()}`, {
        headers: headersWithAuth(false),
        cache: "no-store",
      });

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const body = normalizeWriteBody(req, guildId);
      const upstream = await fetch(`${BOT_API}/engine-config`, {
        method: req.method,
        headers: headersWithAuth(true),
        body: JSON.stringify(body),
      });

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Bot API unreachable",
    });
  }
}
