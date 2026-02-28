import type { NextApiRequest, NextApiResponse } from "next";
import { readEngineConfig, writeEngineConfig } from "@/lib/configStore";

const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function readToken(req: NextApiRequest): string {
  const auth = req.headers.authorization || "";
  const bearer = Array.isArray(auth) ? auth[0] : auth;
  const xDash = req.headers["x-dashboard-token"];
  const xApi = req.headers["x-api-key"];

  return String(
    (Array.isArray(xDash) ? xDash[0] : xDash) ||
      (Array.isArray(xApi) ? xApi[0] : xApi) ||
      bearer.replace(/^Bearer\s+/i, "") ||
      ""
  ).trim();
}

function requireAuth(req: NextApiRequest, res: NextApiResponse): boolean {
  if (!DASHBOARD_TOKEN) return true;
  if (readToken(req) === DASHBOARD_TOKEN) return true;
  res.status(401).json({ success: false, error: "Unauthorized" });
  return false;
}

function readGuildId(req: NextApiRequest): string {
  const q = Array.isArray(req.query.guildId) ? req.query.guildId[0] : req.query.guildId;
  const b = req.body && typeof req.body === "object" ? (req.body as any).guildId : "";
  return String(q || b || "").trim();
}

function isSnowflake(value: string): boolean {
  return /^\d{16,20}$/.test(String(value || "").trim());
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireAuth(req, res)) return;

  const engineIdRaw = Array.isArray(req.query.engineId) ? req.query.engineId[0] : req.query.engineId;
  const engineId = String(engineIdRaw || "").trim();
  const guildId = readGuildId(req);

  if (!engineId) return res.status(400).json({ success: false, error: "Missing engineId" });
  if (!isSnowflake(guildId)) return res.status(400).json({ success: false, error: "Missing or invalid guildId" });

  if (req.method === "GET") {
    const config = readEngineConfig(guildId, engineId);
    return res.status(200).json({ success: true, guildId, engineId, config });
  }

  if (req.method === "POST") {
    try {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const cfg = (payload.config ?? payload) as Record<string, unknown>;
      if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
        return res.status(400).json({ success: false, error: "Invalid config payload" });
      }

      const { guildId: _g, ...cleanConfig } = cfg as any;
      writeEngineConfig(guildId, engineId, cleanConfig);

      return res.status(200).json({
        success: true,
        guildId,
        engineId,
        config: cleanConfig
      });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err?.message || "Bad JSON" });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
