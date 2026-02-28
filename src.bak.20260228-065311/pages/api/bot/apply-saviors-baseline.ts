import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();
const SOURCE_GUILD_ID = String(process.env.SAVIORS_BASELINE_GUILD_ID || "1431799056211906582").trim();

function isSnowflake(v: string) {
  return /^\d{16,20}$/.test(String(v || "").trim());
}

function authHeaders(json = false) {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) h["x-dashboard-token"] = DASHBOARD_TOKEN;
  return h;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid JSON from bot API" };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const targetGuildId = String(req.body?.guildId || "").trim();
  if (!isSnowflake(targetGuildId)) return res.status(400).json({ success: false, error: "Invalid guildId" });
  if (!isSnowflake(SOURCE_GUILD_ID)) return res.status(500).json({ success: false, error: "Invalid SAVIORS_BASELINE_GUILD_ID" });

  if (targetGuildId === SOURCE_GUILD_ID) {
    return res.json({ success: true, skipped: true, message: "Target is baseline guild; nothing to clone." });
  }

  try {
    const sourceCfgRes = await fetch(`${BOT_API}/engine-config?guildId=${encodeURIComponent(SOURCE_GUILD_ID)}`, {
      headers: authHeaders(false),
    });
    const sourceCfg = await readJsonSafe(sourceCfgRes);
    if (!sourceCfgRes.ok || !sourceCfg?.success || !sourceCfg?.config) {
      return res.status(502).json({ success: false, error: sourceCfg?.error || "Failed reading source engine config" });
    }

    const writeCfgRes = await fetch(`${BOT_API}/engine-config`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({ guildId: targetGuildId, configs: sourceCfg.config }),
    });
    const writeCfg = await readJsonSafe(writeCfgRes);
    if (!writeCfgRes.ok || !writeCfg?.success) {
      return res.status(502).json({ success: false, error: writeCfg?.error || "Failed writing target engine config" });
    }

    const sourceFeatRes = await fetch(`${BOT_API}/guild-features?guildId=${encodeURIComponent(SOURCE_GUILD_ID)}`, {
      headers: authHeaders(false),
    });
    const sourceFeat = await readJsonSafe(sourceFeatRes);
    if (!sourceFeatRes.ok || !sourceFeat?.success || !sourceFeat?.features) {
      return res.status(502).json({ success: false, error: sourceFeat?.error || "Failed reading source features" });
    }

    const targetFeatRes = await fetch(`${BOT_API}/guild-features?guildId=${encodeURIComponent(targetGuildId)}`, {
      headers: authHeaders(false),
    });
    const targetFeat = await readJsonSafe(targetFeatRes);
    if (!targetFeatRes.ok || !targetFeat?.success) {
      return res.status(502).json({ success: false, error: targetFeat?.error || "Failed reading target feature scope" });
    }

    const featuresToApply = { ...(sourceFeat.features || {}) };
    if (!targetFeat.privateGuild) featuresToApply.pokemonEnabled = false;

    const writeFeatRes = await fetch(`${BOT_API}/guild-features`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({ guildId: targetGuildId, features: featuresToApply }),
    });
    const writeFeat = await readJsonSafe(writeFeatRes);
    if (!writeFeatRes.ok || !writeFeat?.success) {
      return res.status(502).json({ success: false, error: writeFeat?.error || "Failed writing target features" });
    }

    return res.json({
      success: true,
      sourceGuildId: SOURCE_GUILD_ID,
      targetGuildId,
      features: writeFeat.features || featuresToApply,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Baseline clone failed" });
  }
}
