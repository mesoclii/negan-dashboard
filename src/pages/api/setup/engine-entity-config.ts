import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

type EngineEntityConfig = {
  active: boolean;
  autoStart: boolean;
  mode: string;
  primaryChannelId: string;
  fallbackChannelId: string;
  logChannelId: string;
  notifyChannelId: string;
  allowRoleIds: string[];
  denyRoleIds: string[];
  mentionRoleIds: string[];
  cooldownSec: number;
  responseDeleteSec: number;
  timeoutMs: number;
  concurrency: number;
  retries: number;
  scheduleCron: string;
  activeWindowStart: string;
  activeWindowEnd: string;
  thresholdLow: number;
  thresholdHigh: number;
  rewardCoins: number;
  rewardXp: number;
  messageTemplate: string;
  embedColor: string;
  backgroundUrl: string;
  webhookUrl: string;
  assetTypes: string[];
  sourceChannelIds: string[];
  destinationChannelId: string;
  conversionQuality: string;
  duplicatePolicy: string;
  autoPublish: boolean;
  requireApproval: boolean;
  maxAssetSizeMb: number;
  maxAssetsPerRun: number;
  notes: string;
  updatedAt: string;
};

const FILE = path.join(process.cwd(), "data", "setup", "engine-entity-config.json");

const DEFAULT_CONFIG: EngineEntityConfig = {
  active: true,
  autoStart: true,
  mode: "standard",
  primaryChannelId: "",
  fallbackChannelId: "",
  logChannelId: "",
  notifyChannelId: "",
  allowRoleIds: [],
  denyRoleIds: [],
  mentionRoleIds: [],
  cooldownSec: 0,
  responseDeleteSec: 0,
  timeoutMs: 3000,
  concurrency: 1,
  retries: 0,
  scheduleCron: "",
  activeWindowStart: "",
  activeWindowEnd: "",
  thresholdLow: 0,
  thresholdHigh: 100,
  rewardCoins: 0,
  rewardXp: 0,
  messageTemplate: "",
  embedColor: "#ff3131",
  backgroundUrl: "",
  webhookUrl: "",
  assetTypes: ["emoji", "sticker", "gif"],
  sourceChannelIds: [],
  destinationChannelId: "",
  conversionQuality: "high",
  duplicatePolicy: "skip",
  autoPublish: false,
  requireApproval: true,
  maxAssetSizeMb: 8,
  maxAssetsPerRun: 25,
  notes: "",
  updatedAt: "",
};

function pickString(value: unknown, max: number, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
}

function pickBool(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function pickInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const v = Math.floor(n);
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function pickIdList(value: unknown, maxItems = 100): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v || "").trim().slice(0, 32))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitize(input?: Partial<EngineEntityConfig>): EngineEntityConfig {
  const src = input || {};
  return {
    active: pickBool(src.active, true),
    autoStart: pickBool(src.autoStart, true),
    mode: pickString(src.mode, 64, "standard"),
    primaryChannelId: pickString(src.primaryChannelId, 32, ""),
    fallbackChannelId: pickString(src.fallbackChannelId, 32, ""),
    logChannelId: pickString(src.logChannelId, 32, ""),
    notifyChannelId: pickString(src.notifyChannelId, 32, ""),
    allowRoleIds: pickIdList(src.allowRoleIds),
    denyRoleIds: pickIdList(src.denyRoleIds),
    mentionRoleIds: pickIdList(src.mentionRoleIds),
    cooldownSec: pickInt(src.cooldownSec, 0, 3600, 0),
    responseDeleteSec: pickInt(src.responseDeleteSec, 0, 3600, 0),
    timeoutMs: pickInt(src.timeoutMs, 250, 120000, 3000),
    concurrency: pickInt(src.concurrency, 1, 100, 1),
    retries: pickInt(src.retries, 0, 10, 0),
    scheduleCron: pickString(src.scheduleCron, 120, ""),
    activeWindowStart: pickString(src.activeWindowStart, 16, ""),
    activeWindowEnd: pickString(src.activeWindowEnd, 16, ""),
    thresholdLow: pickInt(src.thresholdLow, 0, 1000000, 0),
    thresholdHigh: pickInt(src.thresholdHigh, 0, 1000000, 100),
    rewardCoins: pickInt(src.rewardCoins, 0, 1000000, 0),
    rewardXp: pickInt(src.rewardXp, 0, 1000000, 0),
    messageTemplate: pickString(src.messageTemplate, 4000, ""),
    embedColor: pickString(src.embedColor, 16, "#ff3131"),
    backgroundUrl: pickString(src.backgroundUrl, 2048, ""),
    webhookUrl: pickString(src.webhookUrl, 2048, ""),
    assetTypes: pickIdList(src.assetTypes as unknown[], 10),
    sourceChannelIds: pickIdList(src.sourceChannelIds, 100),
    destinationChannelId: pickString(src.destinationChannelId, 32, ""),
    conversionQuality: pickString(src.conversionQuality, 16, "high"),
    duplicatePolicy: pickString(src.duplicatePolicy, 16, "skip"),
    autoPublish: pickBool(src.autoPublish, false),
    requireApproval: pickBool(src.requireApproval, true),
    maxAssetSizeMb: pickInt(src.maxAssetSizeMb, 1, 100, 8),
    maxAssetsPerRun: pickInt(src.maxAssetsPerRun, 1, 500, 25),
    notes: pickString(src.notes, 8000, ""),
    updatedAt: new Date().toISOString(),
  };
}

async function readStore(): Promise<Record<string, Record<string, EngineEntityConfig>>> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, Record<string, EngineEntityConfig>>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
    const engineId = String(req.query.engineId || req.body?.engineId || "").trim();

    if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
    if (!engineId) return res.status(400).json({ success: false, error: "engineId is required" });

    const store = await readStore();
    const guild = store[guildId] || {};

    if (req.method === "GET") {
      const cfg = sanitize(guild[engineId] || DEFAULT_CONFIG);
      return res.status(200).json({ success: true, guildId, engineId, config: cfg });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const patch = (req.body?.patch || req.body?.config || {}) as Partial<EngineEntityConfig>;
      const current = sanitize(guild[engineId] || DEFAULT_CONFIG);
      const next = sanitize({ ...current, ...patch });
      store[guildId] = { ...guild, [engineId]: next };
      await writeStore(store);
      return res.status(200).json({ success: true, guildId, engineId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
