import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";
import fs from "fs";
import path from "path";

type AnyObj = Record<string, any>;

function defaultConfig() {
  return {
    active: true,
    announceChannelId: "",
    announcementTemplate: "{{user}} unlocked {{achievement}}",
    commands: {
      achievements: true,
      achievementsadmin: true,
      achpanel: true,
      badge: true,
    },
    catalog: [],
  };
}

function readDefinitions() {
  const candidates = [
    path.join(process.cwd(), "..", "modules", "data", "achievements.json"),
    path.join(process.cwd(), "..", "modules", "data", "carol.json"),
  ];
  const expansionCandidates = [
    path.join(process.cwd(), "..", "modules", "data", "achievements.expansion.json"),
    path.join(process.cwd(), "..", "modules", "data", "carol.expansion.json"),
  ];

  function readJson(paths: string[]) {
    for (const candidate of paths) {
      try {
        if (!fs.existsSync(candidate)) continue;
        return JSON.parse(fs.readFileSync(candidate, "utf8"));
      } catch {}
    }
    return {};
  }

  const base = readJson(candidates);
  const extra = readJson(expansionCandidates);
  return {
    achievements: {
      ...((base?.achievements && typeof base.achievements === "object") ? base.achievements : {}),
      ...((extra?.achievements && typeof extra.achievements === "object") ? extra.achievements : {}),
    },
    triggers: [
      ...(Array.isArray(base?.triggers) ? base.triggers : []),
      ...(Array.isArray(extra?.triggers) ? extra.triggers : []),
    ],
  };
}

function fallbackCatalogRows() {
  const defs = readDefinitions();
  const firstTriggerByAchievement = new Map<string, any>();
  for (const trigger of defs.triggers) {
    const achievementId = String(trigger?.achievementId || "").trim();
    if (!achievementId || firstTriggerByAchievement.has(achievementId)) continue;
    firstTriggerByAchievement.set(achievementId, trigger);
  }

  return Object.values(defs.achievements || {})
    .map((achievement: any) => {
      const trigger = firstTriggerByAchievement.get(String(achievement?.id || "").trim()) || null;
      return {
        id: String(achievement?.id || "").trim(),
        name: String(achievement?.name || "").trim(),
        description: String(achievement?.description || "").trim(),
        source: String(achievement?.source || trigger?.type || "system").trim(),
        tier: String(achievement?.tier || "standard").trim(),
        flavor: String(achievement?.flavor || "").trim(),
        action: String(trigger?.type || "manual").trim().toLowerCase(),
        count: Math.max(1, Number(trigger?.count || 1) || 1),
        enabled: achievement?.enabled !== false,
        overrideAnnouncement: Boolean(achievement?.overrideAnnouncement),
        announcementMessage: String(achievement?.announcementMessage || "").trim(),
        rewards: {
          giveRole: Boolean(achievement?.roleId),
          giveRoleId: String(achievement?.roleId || "").trim(),
          removeRole: Boolean(achievement?.removeRoleId),
          removeRoleId: String(achievement?.removeRoleId || "").trim(),
          giveXp: Number(achievement?.xpReward || 0) > 0,
          xpAmount: Math.max(0, Number(achievement?.xpReward || 0) || 0),
          giveCoins: Number(achievement?.coins || 0) > 0,
          coinAmount: Math.max(0, Number(achievement?.coins || 0) || 0),
        },
        settings: {
          dontTrackProgress: achievement?.dontTrackProgress === true,
          setColor: String(achievement?.setColor || "").trim(),
          sendThread: achievement?.sendThread === true,
        },
      };
    })
    .filter((row: any) => row.id)
    .sort((left: any, right: any) => left.name.localeCompare(right.name));
}

function withFallbackCatalog(config: AnyObj) {
  const merged = deepMerge(defaultConfig(), config || {});
  if (!Array.isArray(merged.catalog) || !merged.catalog.length) {
    merged.catalog = fallbackCatalogRows();
  }
  return merged;
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
    `${BOT_API}/engine-runtime?guildId=${encodeURIComponent(guildId)}&engine=achievements`,
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
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (req.method === "GET") {
      const remote = await readRemoteConfig(req, guildId);
      return res.status(remote.upstream.status).json({
        success: remote.upstream.ok,
        guildId,
        config: withFallbackCatalog(remote.config),
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
      const config = withFallbackCatalog(deepMerge(withFallbackCatalog(remote.config), patch));

      const upstream = await fetch(`${BOT_API}/engine-runtime`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({ guildId, engine: "achievements", patch: config }),
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json({
        success: upstream.ok,
        guildId,
        config: withFallbackCatalog(data?.config || config),
        error: data?.error,
      });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
