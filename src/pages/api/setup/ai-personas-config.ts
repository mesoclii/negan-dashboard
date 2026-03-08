import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";
import { requirePremiumAccess } from "@/lib/premiumGuard";

const STORE_FILE = path.join(process.cwd(), "data", "baselines", "ai-personas-config.json");

type AnyObj = Record<string, any>;

function isObj(v: any): v is AnyObj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch)) return patch;
  if (!isObj(base) || !isObj(patch)) return patch === undefined ? base : patch;
  const out: AnyObj = { ...base };
  for (const k of Object.keys(patch)) out[k] = deepMerge(base[k], patch[k]);
  return out;
}

function uniqStrings(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x || "").trim()).filter(Boolean))];
}

function toNum(v: any, fallback: number, min = 0, max = 1000000): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function toText(v: any, fallback = "", max = 500): string {
  const s = String(v ?? fallback).trim();
  return s.slice(0, max);
}

function defaults() {
  return {
    active: false,
    provider: "openai",
    model: "gpt-4o-mini",
    nsfwAllowed: false,
    allowedChannelIds: [] as string[],
    blockedChannelIds: [] as string[],
    allowedRoleIds: [] as string[],
    blockedRoleIds: [] as string[],
    maxMessagesPerUserPerDay: 40,
    maxTokensPerReply: 500,
    systemPrompt: "",
    monetization: {
      enabled: false,
      currency: "USD",
      checkoutUrl: "",
      plans: [
        { id: "bronze", name: "Bronze", price: "", cycle: "monthly", messageLimit: 50, imageLimit: 20, backstoryLimit: 20, enabled: true, badge: "" },
        { id: "silver", name: "Silver", price: "", cycle: "monthly", messageLimit: 120, imageLimit: 50, backstoryLimit: 50, enabled: true, badge: "" },
        { id: "gold", name: "Gold", price: "", cycle: "monthly", messageLimit: 300, imageLimit: 150, backstoryLimit: 150, enabled: true, badge: "" },
      ],
      notes: "",
    },
    notes: "",
  };
}

function normalizePlan(p: any, idx: number) {
  return {
    id: toText(p?.id, `plan-${idx + 1}`, 64) || `plan-${idx + 1}`,
    name: toText(p?.name, `Plan ${idx + 1}`, 80) || `Plan ${idx + 1}`,
    price: toText(p?.price, "", 40), // keep string so you can use any format later
    cycle: ["weekly", "monthly", "yearly", "lifetime"].includes(String(p?.cycle)) ? String(p?.cycle) : "monthly",
    messageLimit: toNum(p?.messageLimit, 0, 0, 1000000),
    imageLimit: toNum(p?.imageLimit, 0, 0, 1000000),
    backstoryLimit: toNum(p?.backstoryLimit, 0, 0, 1000000),
    enabled: !!p?.enabled,
    badge: toText(p?.badge, "", 50),
  };
}

function normalizeConfig(raw: any) {
  const base = defaults();
  const merged = deepMerge(base, raw || {});
  const rawPlans = Array.isArray(merged?.monetization?.plans) && merged.monetization.plans.length
    ? merged.monetization.plans
    : base.monetization.plans;

  return {
    active: !!merged.active,
    provider: toText(merged.provider, base.provider, 60) || base.provider,
    model: toText(merged.model, base.model, 120) || base.model,
    nsfwAllowed: !!merged.nsfwAllowed,
    allowedChannelIds: uniqStrings(merged.allowedChannelIds),
    blockedChannelIds: uniqStrings(merged.blockedChannelIds),
    allowedRoleIds: uniqStrings(merged.allowedRoleIds),
    blockedRoleIds: uniqStrings(merged.blockedRoleIds),
    maxMessagesPerUserPerDay: toNum(merged.maxMessagesPerUserPerDay, base.maxMessagesPerUserPerDay, 1, 50000),
    maxTokensPerReply: toNum(merged.maxTokensPerReply, base.maxTokensPerReply, 50, 32000),
    systemPrompt: String(merged.systemPrompt || ""),
    monetization: {
      enabled: !!merged?.monetization?.enabled,
      currency: toText(merged?.monetization?.currency, "USD", 10) || "USD",
      checkoutUrl: toText(merged?.monetization?.checkoutUrl, "", 400),
      plans: rawPlans.map(normalizePlan),
      notes: String(merged?.monetization?.notes || ""),
    },
    notes: String(merged.notes || ""),
  };
}

async function readStore() {
  try {
    const text = await fs.readFile(STORE_FILE, "utf8");
    const json = JSON.parse(text || "{}");
    return isObj(json) ? json : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, any>) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const method = req.method || "GET";

    if (method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = await readStore();
      const cfg = normalizeConfig(store[guildId]);
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (method === "POST" || method === "PUT") {
      const guildId = String(req.body?.guildId || req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const allowed = await requirePremiumAccess(req, res, guildId, "persona");
      if (allowed !== true) return allowed;

      const patch = req.body?.patch ?? req.body?.config ?? req.body ?? {};
      const store = await readStore();
      const current = normalizeConfig(store[guildId]);
      const next = normalizeConfig(deepMerge(current, patch));

      store[guildId] = next;
      await writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
