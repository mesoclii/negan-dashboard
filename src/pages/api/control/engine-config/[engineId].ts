import type { NextApiRequest, NextApiResponse } from "next";
import {
  readGuildIdFromRequest,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function sanitizeEngineId(raw: unknown) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9._-]/g, "");
}

function headersWithAuth(json = false) {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;
  return headers;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === "object" && !Array.isArray(input);
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid upstream JSON" };
  }
}

function normalizeConfigPayload(body: unknown): Record<string, unknown> | null {
  if (!isRecord(body)) return null;

  if (isRecord(body.config) && !Array.isArray(body.config)) {
    return body.config;
  }

  if (isRecord(body.patch) && !Array.isArray(body.patch)) {
    return body.patch;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "guildId" || key === "engine") continue;
    result[key] = value;
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const engine = sanitizeEngineId(
      Array.isArray(req.query.engineId) ? req.query.engineId[0] : req.query.engineId
    );
    const guildId = readGuildIdFromRequest(req);

    if (!engine) {
      return res.status(400).json({ success: false, error: "Missing or invalid engineId" });
    }
    if (!guildId) {
      return res.status(400).json({ success: false, error: "Missing or invalid guildId" });
    }

    if (req.method === "GET") {
      const upstream = await fetch(
        `${BOT_API}/engine-config?${new URLSearchParams({ guildId, engine }).toString()}`,
        { headers: headersWithAuth(false), cache: "no-store" }
      );

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const config = normalizeConfigPayload(req.body);
      if (!isRecord(config)) {
        return res.status(400).json({ success: false, error: "Invalid config payload" });
      }

      const upstream = await fetch(`${BOT_API}/engine-config`, {
        method: req.method,
        headers: headersWithAuth(true),
        body: JSON.stringify({
          guildId,
          engine,
          config,
        }),
      });

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: "Engine config proxy failed" });
  }
}