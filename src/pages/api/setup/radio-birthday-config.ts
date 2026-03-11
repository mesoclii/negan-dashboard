import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";

type AnyObj = Record<string, any>;

function defaultConfig() {
  return {
    active: true,
    birthday: {
      enabled: true,
      rewardCoins: 500,
      roleId: "",
      broadcastChannelId: "",
      timezone: "America/Los_Angeles",
      allowSelfSet: true,
    },
    radio: {
      enabled: false,
      announceChannelId: "",
      djRoleIds: [],
      queueLimit: 50,
      allowLinks: true,
      volumeDefault: 60,
    },
    notes: "",
  };
}

function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch)) return patch;
  if (!patch || typeof patch !== "object") return patch ?? base;
  const out: AnyObj = { ...(base && typeof base === "object" ? base : {}) };
  for (const key of Object.keys(patch)) {
    out[key] = deepMerge(out[key], patch[key]);
  }
  return out;
}

async function readRemoteConfig(req: NextApiRequest, guildId: string) {
  const upstream = await fetch(
    `${BOT_API}/engine-runtime?guildId=${encodeURIComponent(guildId)}&engine=radio`,
    {
      headers: buildBotApiHeaders(req),
      cache: "no-store",
    }
  );
  const data = await readJsonSafe(upstream);
  return {
    upstream,
    data,
    config: data?.config && typeof data.config === "object" ? data.config : {},
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId =
      req.method === "GET"
        ? String(req.query.guildId || "").trim()
        : String(req.body?.guildId || "").trim();

    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId required" });
    }

    if (req.method === "GET") {
      const remote = await readRemoteConfig(req, guildId);
      return res.status(remote.upstream.status).json({
        success: remote.upstream.ok,
        guildId,
        config: deepMerge(defaultConfig(), remote.config),
        error: remote.data?.error,
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const remote = await readRemoteConfig(req, guildId);
      if (!remote.upstream.ok) {
        return res.status(remote.upstream.status).json(remote.data);
      }

      const patch = req.body?.reset === true ? defaultConfig() : (req.body?.patch || req.body?.config || {});
      const config = deepMerge(deepMerge(defaultConfig(), remote.config), patch);

      const upstream = await fetch(`${BOT_API}/engine-runtime`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({ guildId, engine: "radio", patch: config }),
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json({
        success: upstream.ok,
        guildId,
        config: deepMerge(defaultConfig(), data?.config || config),
        error: data?.error,
      });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
