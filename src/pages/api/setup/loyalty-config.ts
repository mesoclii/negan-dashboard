import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

type LoyaltyConfig = {
  active: boolean;
  timezone: string;
  announceChannelId: string;
  heistExemptRoleId: string;
  heistExemptDays: number;
  yearRewardRoleId: string;
  yearRewardDays: number;
  notes: string;
  updatedAt: string;
};

const FILE = path.join(process.cwd(), "data", "setup", "loyalty-config.json");

const DEFAULT_CONFIG: LoyaltyConfig = {
  active: true,
  timezone: "America/Los_Angeles",
  announceChannelId: "",
  heistExemptRoleId: "",
  heistExemptDays: 7,
  yearRewardRoleId: "",
  yearRewardDays: 30,
  notes: "",
  updatedAt: "",
};

function toBool(v: any, d: boolean) {
  return typeof v === "boolean" ? v : d;
}
function toStr(v: any, d = "") {
  return typeof v === "string" ? v : d;
}
function toNum(v: any, d: number, min = 0, max = 100000) {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function merge(base?: Partial<LoyaltyConfig>, patch?: Partial<LoyaltyConfig>): LoyaltyConfig {
  const b = base || {};
  const p = patch || {};
  return {
    active: toBool(p.active, toBool(b.active, DEFAULT_CONFIG.active)),
    timezone: toStr(p.timezone, toStr(b.timezone, DEFAULT_CONFIG.timezone)),
    announceChannelId: toStr(p.announceChannelId, toStr(b.announceChannelId, DEFAULT_CONFIG.announceChannelId)),
    heistExemptRoleId: toStr(p.heistExemptRoleId, toStr(b.heistExemptRoleId, DEFAULT_CONFIG.heistExemptRoleId)),
    heistExemptDays: toNum(p.heistExemptDays, toNum(b.heistExemptDays, DEFAULT_CONFIG.heistExemptDays, 0, 3650), 0, 3650),
    yearRewardRoleId: toStr(p.yearRewardRoleId, toStr(b.yearRewardRoleId, DEFAULT_CONFIG.yearRewardRoleId)),
    yearRewardDays: toNum(p.yearRewardDays, toNum(b.yearRewardDays, DEFAULT_CONFIG.yearRewardDays, 0, 3650), 0, 3650),
    notes: toStr(p.notes, toStr(b.notes, DEFAULT_CONFIG.notes)),
    updatedAt: new Date().toISOString(),
  };
}

async function readStore(): Promise<Record<string, LoyaltyConfig>> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, LoyaltyConfig>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      const store = await readStore();
      return res.status(200).json({ success: true, guildId, config: merge(store[guildId]) });
    }

    if (req.method === "POST") {
      const guildId = String(req.body?.guildId || "").trim();
      const patch = (req.body?.patch || {}) as Partial<LoyaltyConfig>;
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = await readStore();
      const next = merge(store[guildId], patch);
      store[guildId] = next;
      await writeStore(store);
      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
