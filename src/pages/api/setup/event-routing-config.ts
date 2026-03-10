import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function mergeDeep<T extends Record<string, any>>(base: T, patch: Record<string, unknown>): T {
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if (isObject(value) && isObject(next[key])) {
      next[key] = mergeDeep(next[key] as Record<string, any>, value);
    } else {
      next[key] = value;
    }
  }
  return next as T;
}

function pickConfigPayload(req: NextApiRequest, current: Record<string, unknown>) {
  const body = req.body && typeof req.body === "object" ? { ...(req.body as Record<string, unknown>) } : {};
  delete body.guildId;
  delete body.userId;
  delete body.uid;
  delete body.engine;

  if (isObject(body.config)) return body.config;
  if (isObject(body.patch)) return mergeDeep(current, body.patch);
  return mergeDeep(current, body);
}

async function readCurrentConfig(req: NextApiRequest, guildId: string) {
  const upstream = await fetch(
    `${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=eventReactor`,
    {
      headers: buildBotApiHeaders(req),
      cache: "no-store",
    }
  );
  const data = await readJsonSafe(upstream);
  return {
    upstream,
    data,
    config: isObject(data?.config) ? (data.config as Record<string, unknown>) : {},
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
  if (!guildId) {
    return res.status(400).json({ success: false, error: "guildId required" });
  }

  if (req.method === "GET") {
    const { upstream, data } = await readCurrentConfig(req, guildId);
    return res.status(upstream.status).json({ success: upstream.ok, guildId, config: data?.config || {} });
  }

  if (req.method === "POST" || req.method === "PUT") {
    if (isWriteBlockedForGuild(guildId)) {
      return res.status(403).json(stockLockError(guildId));
    }

    const current = await readCurrentConfig(req, guildId);
    if (!current.upstream.ok) {
      return res.status(current.upstream.status).json(current.data);
    }

    const config = pickConfigPayload(req, current.config);
    const upstream = await fetch(`${BOT_API}/engine-config`, {
      method: "POST",
      headers: buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify({ guildId, engine: "eventReactor", config }),
    });
    const data = await readJsonSafe(upstream);
    return res.status(upstream.status).json({ success: upstream.ok, guildId, config: data?.config || config, error: data?.error });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
