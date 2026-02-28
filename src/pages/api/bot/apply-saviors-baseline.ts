import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();
const SAVIORS_GUILD_ID = String(process.env.SAVIORS_GUILD_ID || "1431799056211906582").trim();

function h(json = false) {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (TOKEN) headers["x-dashboard-token"] = TOKEN;
  return headers;
}

async function readJsonSafe(r: Response) {
  const t = await r.text();
  try { return t ? JSON.parse(t) : {}; } catch { return { success: false, error: t || "Invalid JSON" }; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const guildId = String(req.body?.guildId || req.query?.guildId || "").trim();
  const sourceGuildId = String(req.body?.sourceGuildId || SAVIORS_GUILD_ID).trim();

  if (!/^\d{16,20}$/.test(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });
  if (!/^\d{16,20}$/.test(sourceGuildId)) return res.status(400).json({ success: false, error: "sourceGuildId invalid" });

  try {
    const srcRes = await fetch(`${BOT_API}/dashboard-config?guildId=${encodeURIComponent(sourceGuildId)}`, { headers: h(false) });
    const src = await readJsonSafe(srcRes);
    if (!srcRes.ok || !src?.config) {
      return res.status(srcRes.status || 500).json({ success: false, error: src?.error || "Failed to load Saviors baseline" });
    }

    const saveRes = await fetch(`${BOT_API}/dashboard-config`, {
      method: "POST",
      headers: h(true),
      body: JSON.stringify({ guildId, patch: src.config })
    });
    const out = await readJsonSafe(saveRes);
    return res.status(saveRes.status).json(out);
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "apply baseline failed" });
  }
}
