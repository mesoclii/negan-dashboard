import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type VipConfig = {
  active: boolean;
  vipRoleId: string;
  supporterRoleId: string;
  nitroRoleId: string;
  grantLogChannelId: string;
  autoExpire: boolean;
  expiryDays: number;
  syncWithLoyalty: boolean;
  notes: string;
};

const FILE = path.join(process.cwd(), "data", "setup", "vip-config.json");

const DEFAULT_CONFIG: VipConfig = {
  active: true,
  vipRoleId: "",
  supporterRoleId: "",
  nitroRoleId: "",
  grantLogChannelId: "",
  autoExpire: true,
  expiryDays: 30,
  syncWithLoyalty: true,
  notes: "",
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function toBool(v: unknown, d: boolean) {
  return typeof v === "boolean" ? v : d;
}

function toNum(v: unknown, d: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function toText(v: unknown, d: string, max = 500) {
  return typeof v === "string" ? v.slice(0, max) : d;
}

function merge(base?: Partial<VipConfig>, patch?: Partial<VipConfig>): VipConfig {
  const b = isObj(base) ? base : {};
  const p = isObj(patch) ? patch : {};
  return {
    active: toBool(p.active, toBool(b.active, DEFAULT_CONFIG.active)),
    vipRoleId: toText(p.vipRoleId, toText(b.vipRoleId, DEFAULT_CONFIG.vipRoleId, 50), 50),
    supporterRoleId: toText(p.supporterRoleId, toText(b.supporterRoleId, DEFAULT_CONFIG.supporterRoleId, 50), 50),
    nitroRoleId: toText(p.nitroRoleId, toText(b.nitroRoleId, DEFAULT_CONFIG.nitroRoleId, 50), 50),
    grantLogChannelId: toText(p.grantLogChannelId, toText(b.grantLogChannelId, DEFAULT_CONFIG.grantLogChannelId, 50), 50),
    autoExpire: toBool(p.autoExpire, toBool(b.autoExpire, DEFAULT_CONFIG.autoExpire)),
    expiryDays: Math.max(0, Math.min(3650, toNum(p.expiryDays, toNum(b.expiryDays, DEFAULT_CONFIG.expiryDays)))),
    syncWithLoyalty: toBool(p.syncWithLoyalty, toBool(b.syncWithLoyalty, DEFAULT_CONFIG.syncWithLoyalty)),
    notes: toText(p.notes, toText(b.notes, DEFAULT_CONFIG.notes, 2000), 2000),
  };
}

async function readStore(): Promise<Record<string, VipConfig>> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return isObj(parsed) ? (parsed as Record<string, VipConfig>) : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, VipConfig>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
  if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

  try {
    const store = await readStore();

    if (req.method === "GET") {
      const config = merge(DEFAULT_CONFIG, store[guildId] || {});
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const patch = isObj(req.body?.patch) ? (req.body.patch as Partial<VipConfig>) : {};
      const current = merge(DEFAULT_CONFIG, store[guildId] || {});
      const config = merge(current, patch);
      store[guildId] = config;
      await writeStore(store);
      return res.status(200).json({ success: true, guildId, config });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
