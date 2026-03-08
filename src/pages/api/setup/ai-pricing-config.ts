import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { requirePremiumAccess } from "@/lib/premiumGuard";

type PlanKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";
type Plan = {
  enabled: boolean;
  monthlyUsd: number;
  yearlyUsd: number;
  includedMessages: number;
  includedImages: number;
  includedBackstory: number;
};
type AiPricingConfig = {
  active: boolean;
  publicCatalogEnabled: boolean;
  nsfwAllowed: boolean;
  plans: Record<PlanKey, Plan>;
  overage: {
    per1kTextTokensUsd: number;
    perImageUsd: number;
    per1kTtsCharsUsd: number;
  };
  features: {
    writeEnabled: boolean;
    imagineEnabled: boolean;
    backstoryEnabled: boolean;
    charactersEnabled: boolean;
  };
  notes: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "ui");
const STORE_FILE = path.join(DATA_DIR, "ai-pricing-config.json");

const DEFAULT_PLAN: Plan = {
  enabled: true,
  monthlyUsd: 1.99,
  yearlyUsd: 19.99,
  includedMessages: 1000,
  includedImages: 20,
  includedBackstory: 20,
};

const DEFAULT_CFG: AiPricingConfig = {
  active: true,
  publicCatalogEnabled: false,
  nsfwAllowed: false,
  plans: {
    bronze: { ...DEFAULT_PLAN, monthlyUsd: 1.74, yearlyUsd: 14.99, includedMessages: 200, includedImages: 20, includedBackstory: 20 },
    silver: { ...DEFAULT_PLAN, monthlyUsd: 3.49, yearlyUsd: 29.99, includedMessages: 500, includedImages: 50, includedBackstory: 50 },
    gold: { ...DEFAULT_PLAN, monthlyUsd: 8.74, yearlyUsd: 74.99, includedMessages: 2500, includedImages: 200, includedBackstory: 200 },
    platinum: { ...DEFAULT_PLAN, monthlyUsd: 34.99, yearlyUsd: 299.99, includedMessages: 10000, includedImages: 1000, includedBackstory: 1000 },
    diamond: { ...DEFAULT_PLAN, monthlyUsd: 13.99, yearlyUsd: 119.99, includedMessages: 5000, includedImages: 500, includedBackstory: 500 },
  },
  overage: {
    per1kTextTokensUsd: 0.02,
    perImageUsd: 0.05,
    per1kTtsCharsUsd: 0.01,
  },
  features: {
    writeEnabled: true,
    imagineEnabled: true,
    backstoryEnabled: true,
    charactersEnabled: true,
  },
  notes: "",
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify({}, null, 2), "utf8");
}

function readStore(): Record<string, AiPricingConfig> {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf8") || "{}");
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, AiPricingConfig>) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function mergeCfg(base: AiPricingConfig, patch: Partial<AiPricingConfig>): AiPricingConfig {
  const mergedPlans: Record<PlanKey, Plan> = { ...base.plans };
  for (const k of ["bronze", "silver", "gold", "platinum", "diamond"] as PlanKey[]) {
    mergedPlans[k] = { ...base.plans[k], ...(patch.plans?.[k] || {}) };
  }
  return {
    ...base,
    ...patch,
    plans: mergedPlans,
    overage: { ...base.overage, ...(patch.overage || {}) },
    features: { ...base.features, ...(patch.features || {}) },
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = readStore();
      const cfg = mergeCfg(DEFAULT_CFG, store[guildId] || {});
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (req.method === "POST") {
      const guildId = String(req.body?.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const allowed = await requirePremiumAccess(req, res, guildId, "openai-platform");
      if (allowed !== true) return allowed;

      const patch = (req.body?.patch || req.body?.config || {}) as Partial<AiPricingConfig>;
      const store = readStore();
      const current = mergeCfg(DEFAULT_CFG, store[guildId] || {});
      const next = mergeCfg(current, patch);

      store[guildId] = next;
      writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
