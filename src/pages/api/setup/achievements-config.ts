import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { appendAudit, deepMerge, readStore, writeStore } from "@/lib/setupStore";

const FILE = "achievements-config.json";

type AnyObj = Record<string, any>;

const BOT_DEFINITION_PATHS = [
  path.resolve(process.cwd(), "../Negan-Bot/modules/data/achievements.json"),
  path.resolve(process.cwd(), "../negan-bot/modules/data/achievements.json"),
  path.resolve(process.cwd(), "../Negan-Bot/modules/data/carol.json")
];

const BOT_EXPANSION_PATHS = [
  path.resolve(process.cwd(), "../Negan-Bot/modules/data/achievements.expansion.json"),
  path.resolve(process.cwd(), "../negan-bot/modules/data/achievements.expansion.json"),
  path.resolve(process.cwd(), "../Negan-Bot/modules/data/carol.expansion.json")
];

function readJson(paths: string[], fallback: AnyObj = {}) {
  for (const p of paths) {
    try {
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, "utf8");
      const parsed = JSON.parse(raw || "{}");
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return fallback;
}

function defaults() {
  return {
    active: true,
    announceChannelId: "",
    announcementTemplate: "{{user}} unlocked {{achievement}}",
    commands: {
      achievements: true,
      achievementsadmin: true,
      achpanel: true,
      badge: true
    },
    catalog: [] as AnyObj[]
  };
}

function loadCatalogFromCarol() {
  const base = readJson(BOT_DEFINITION_PATHS, {});
  const expansion = readJson(BOT_EXPANSION_PATHS, {});

  const achievements = {
    ...((base?.achievements && typeof base.achievements === "object") ? base.achievements : {}),
    ...((expansion?.achievements && typeof expansion.achievements === "object") ? expansion.achievements : {})
  } as Record<string, AnyObj>;

  const triggers = [
    ...(Array.isArray(base?.triggers) ? base.triggers : []),
    ...(Array.isArray(expansion?.triggers) ? expansion.triggers : [])
  ] as AnyObj[];

  const trigById: Record<string, AnyObj[]> = {};
  for (const t of triggers) {
    const id = String(t?.achievementId || "").trim();
    if (!id) continue;
    if (!trigById[id]) trigById[id] = [];
    trigById[id].push(t);
  }

  const rows = Object.entries(achievements).map(([id, ach]) => {
    const list = trigById[id] || [];
    const first = list[0] || {};

    return {
      id,
      name: String(ach?.name || id),
      description: String(ach?.description || ""),
      source: String(ach?.source || "system"),
      tier: String(ach?.tier || "standard"),
      flavor: String(ach?.flavor || ""),
      action: String(first?.type || ach?.triggerType || "manual"),
      count: Number(first?.count || 1),
      enabled: ach?.hidden ? false : true,
      overrideAnnouncement: false,
      announcementMessage: "",
      rewards: {
        giveRole: false,
        giveRoleId: "",
        removeRole: false,
        removeRoleId: "",
        giveXp: false,
        xpAmount: 0,
        giveCoins: false,
        coinAmount: 0
      },
      settings: {
        dontTrackProgress: false,
        setColor: "",
        sendThread: false
      }
    };
  });

  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

function normalize(raw: AnyObj) {
  const base = defaults();
  const merged = deepMerge(base, raw || {});
  const fromCarol = loadCatalogFromCarol();

  const stored = Array.isArray(merged.catalog) ? merged.catalog : [];
  const storedById = new Map(stored.map((x: AnyObj) => [String(x?.id || ""), x]));

  const catalog = fromCarol.map((botAch) => {
    const ov = storedById.get(botAch.id) || {};
    return deepMerge(botAch, ov);
  });

  for (const row of stored) {
    const id = String(row?.id || "").trim();
    if (!id) continue;
    if (catalog.some((c) => c.id === id)) continue;
    catalog.push(row);
  }

  return {
    active: !!merged.active,
    announceChannelId: String(merged.announceChannelId || ""),
    announcementTemplate: String(merged.announcementTemplate || "{{user}} unlocked {{achievement}}"),
    commands: {
      achievements: !!merged?.commands?.achievements,
      achievementsadmin: !!merged?.commands?.achievementsadmin,
      achpanel: !!merged?.commands?.achpanel,
      badge: !!merged?.commands?.badge
    },
    catalog
  };
}

function guildId(req: NextApiRequest) {
  return String(req.query.guildId || req.body?.guildId || "").trim();
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const gid = guildId(req);
  if (!gid) return res.status(400).json({ success: false, error: "guildId required" });

  const store = readStore(FILE);
  const current = normalize(store[gid] || defaults());

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId: gid, config: current });
  }

  if (req.method === "POST") {
    const patch = req.body?.patch || {};
    const next = normalize(deepMerge(current, patch));
    store[gid] = next;
    writeStore(FILE, store);
    appendAudit({
      guildId: gid,
      area: "achievements",
      action: "save",
      keys: Object.keys(patch || {})
    });
    return res.status(200).json({ success: true, guildId: gid, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
