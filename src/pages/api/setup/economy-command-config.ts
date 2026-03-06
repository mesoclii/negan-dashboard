import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type AnyObj = Record<string, any>;
const DATA_FILE = path.join(process.cwd(), "data", "setup", "economy-command-config.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

function readAll(): AnyObj {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: AnyObj) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
}

function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch)) return patch;
  if (!patch || typeof patch !== "object") return patch ?? base;
  const out: AnyObj = { ...(base && typeof base === "object" ? base : {}) };
  for (const k of Object.keys(patch)) out[k] = deepMerge(out[k], patch[k]);
  return out;
}

function defaultConfig() {
  return {
    active: true,
    currency: {
      name: "Meso's Coins",
      symbol: "??",
      startingBalance: 2500,
      notes: "Coins are earned through progression and games, then spent in Store."
    },
    commands: [
      { id: "bag", label: "bag", description: "Open your item bag", enabled: true },
      { id: "daily", label: "daily", description: "Claim daily coins", enabled: true },
      { id: "crime", label: "crime", description: "Risk coins for bigger rewards", enabled: true },
      { id: "fish", label: "fish", description: "Earn coins with fishing", enabled: true },
      { id: "scavenge", label: "scavenge", description: "Scavenge for random resources", enabled: true },
      { id: "casino", label: "casino", description: "Casino game commands", enabled: true },
      { id: "coinflip", label: "coinflip", description: "Coinflip gambling", enabled: true },
      { id: "slots", label: "slots", description: "Slot machine gambling", enabled: true },
      { id: "blackjack", label: "blackjack", description: "Blackjack game command", enabled: true },
      { id: "transfer", label: "transfer", description: "Transfer coins to members", enabled: true },
      { id: "pay", label: "pay", description: "Pay another member", enabled: true },
      { id: "leaderboard", label: "leaderboard", description: "Show economy leaderboard", enabled: true },
      { id: "inventory", label: "inventory", description: "View inventory items", enabled: true },
      { id: "buy", label: "buy", description: "Buy from store", enabled: true },
      { id: "shop", label: "shop", description: "Open store listing", enabled: true }
    ],
    updatedAt: ""
  };
}

function normalize(raw: any) {
  const merged = deepMerge(defaultConfig(), raw || {});
  const commands = Array.isArray(merged.commands)
    ? merged.commands
        .map((c: any) => ({
          id: String(c?.id || "").trim(),
          label: String(c?.label || c?.id || "").trim(),
          description: String(c?.description || "").trim(),
          enabled: !!c?.enabled
        }))
        .filter((c: any) => c.id)
    : defaultConfig().commands;

  return {
    active: !!merged.active,
    currency: {
      name: String(merged?.currency?.name || "Meso's Coins").slice(0, 80),
      symbol: String(merged?.currency?.symbol || "??").slice(0, 8),
      startingBalance: Number.isFinite(Number(merged?.currency?.startingBalance)) ? Math.max(0, Math.floor(Number(merged.currency.startingBalance))) : 2500,
      notes: String(merged?.currency?.notes || "").slice(0, 500)
    },
    commands: commands.length ? commands : defaultConfig().commands,
    updatedAt: new Date().toISOString()
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      const all = readAll();
      const config = normalize(all[guildId] || {});
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const all = readAll();
      const current = normalize(all[guildId] || {});
      const patch = req.body?.reset === true ? defaultConfig() : (req.body?.patch || req.body || {});
      const merged = normalize(deepMerge(current, patch));
      all[guildId] = merged;
      writeAll(all);
      return res.status(200).json({ success: true, guildId, config: merged });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
