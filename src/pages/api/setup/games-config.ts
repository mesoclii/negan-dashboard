import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type LevelTier = {
  level: number;
  roleId: string;
  coins: number;
  itemTag: string;
};

type GamesConfig = {
  active: boolean;
  rareDrop: {
    enabled: boolean;
    intervalMinutes: number;
    maxActive: number;
    announceChannelId: string;
    spawnChannelIds: string[];
    dropRatePercent: number;
    rewardCoinsMin: number;
    rewardCoinsMax: number;
  };
  catDrop: {
    enabled: boolean;
    intervalMinutes: number;
    maxActive: number;
    announceChannelId: string;
    spawnChannelIds: string[];
    rareCatChancePercent: number;
    rewardCoinsMin: number;
    rewardCoinsMax: number;
  };
  pokemon: {
    enabled: boolean;
    privateOnly: boolean;
    guildAllowed: boolean;
    stage2Enabled: boolean;
    battleEnabled: boolean;
    tradingEnabled: boolean;
    intervalMinutes: number;
    maxActive: number;
    spawnChannelIds: string[];
    catchCooldownSeconds: number;
    shinyChancePercent: number;
    legendaryChancePercent: number;
    baseRewardCoins: number;
  };
  miniGames: {
    rangeEnabled: boolean;
    rangeChannelId: string;
    rangeCooldownSeconds: number;
    truthDareEnabled: boolean;
    truthDareChannelId: string;
    truthDareCooldownSeconds: number;
    gunGameEnabled: boolean;
    gunGameChannelId: string;
    gunGameCooldownSeconds: number;
    dominionEnabled: boolean;
    dominionChannelId: string;
  };
  progression: {
    enabled: boolean;
    achievementsEnabled: boolean;
    carolEnabled: boolean;
    xpPerMessageMin: number;
    xpPerMessageMax: number;
    xpCooldownSeconds: number;
    dailyXpCap: number;
    passiveVoiceXpPerMinute: number;
    levelUpChannelId: string;
    announceLevelUp: boolean;
  };
  rewards: {
    levelTiers: LevelTier[];
  };
  notes: string;
  updatedAt: string;
};

const DEFAULT_CONFIG: GamesConfig = {
  active: true,
  rareDrop: {
    enabled: false,
    intervalMinutes: 20,
    maxActive: 2,
    announceChannelId: "",
    spawnChannelIds: [],
    dropRatePercent: 100,
    rewardCoinsMin: 25,
    rewardCoinsMax: 250,
  },
  catDrop: {
    enabled: false,
    intervalMinutes: 20,
    maxActive: 2,
    announceChannelId: "",
    spawnChannelIds: [],
    rareCatChancePercent: 8,
    rewardCoinsMin: 10,
    rewardCoinsMax: 150,
  },
  pokemon: {
    enabled: false,
    privateOnly: true,
    guildAllowed: false,
    stage2Enabled: true,
    battleEnabled: true,
    tradingEnabled: true,
    intervalMinutes: 20,
    maxActive: 2,
    spawnChannelIds: [],
    catchCooldownSeconds: 5,
    shinyChancePercent: 2,
    legendaryChancePercent: 1,
    baseRewardCoins: 50,
  },
  miniGames: {
    rangeEnabled: true,
    rangeChannelId: "",
    rangeCooldownSeconds: 5,
    truthDareEnabled: true,
    truthDareChannelId: "",
    truthDareCooldownSeconds: 5,
    gunGameEnabled: true,
    gunGameChannelId: "",
    gunGameCooldownSeconds: 5,
    dominionEnabled: true,
    dominionChannelId: "",
  },
  progression: {
    enabled: true,
    achievementsEnabled: true,
    carolEnabled: true,
    xpPerMessageMin: 5,
    xpPerMessageMax: 15,
    xpCooldownSeconds: 30,
    dailyXpCap: 5000,
    passiveVoiceXpPerMinute: 2,
    levelUpChannelId: "",
    announceLevelUp: true,
  },
  rewards: {
    levelTiers: [
      { level: 5, roleId: "", coins: 100, itemTag: "" },
      { level: 10, roleId: "", coins: 250, itemTag: "" },
      { level: 25, roleId: "", coins: 1000, itemTag: "" },
    ],
  },
  notes: "",
  updatedAt: "",
};

const STORE_PATH = path.join(process.cwd(), "data", "setup", "games-config.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function loadStore(): Record<string, GamesConfig> {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const json = JSON.parse(raw || "{}");
    return json && typeof json === "object" ? json : {};
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, GamesConfig>) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function toBool(v: any, d: boolean) {
  return typeof v === "boolean" ? v : d;
}
function toNum(v: any, d: number, min?: number, max?: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  let out = n;
  if (typeof min === "number" && out < min) out = min;
  if (typeof max === "number" && out > max) out = max;
  return out;
}
function toStr(v: any, d = "") {
  return typeof v === "string" ? v : d;
}
function toArr(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}
function toTierArr(v: any, d: LevelTier[]): LevelTier[] {
  if (!Array.isArray(v)) return d;
  return v
    .map((x) => ({
      level: toNum(x?.level, 1, 1, 1000),
      roleId: toStr(x?.roleId, ""),
      coins: toNum(x?.coins, 0, 0, 100000000),
      itemTag: toStr(x?.itemTag, ""),
    }))
    .slice(0, 100);
}


function parseGuildList(raw: string): Set<string> {
  return new Set(
    String(raw || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}

function inOwnerGuildScope(guildId: string): boolean {
  const explicit = parseGuildList(String(process.env.POKEMON_ALLOWED_GUILD_IDS || ""));
  const privateList = parseGuildList(String(process.env.PRIVATE_GUILD_IDS || ""));
  const merged = new Set<string>([...explicit, ...privateList]);
  if (!merged.size) return true;
  return merged.has(String(guildId || "").trim());
}

function pokemonAllowedGuild(config: GamesConfig, guildId: string): boolean {
  return inOwnerGuildScope(guildId) && !!config?.pokemon?.guildAllowed;
}

function enforcePokemonPolicy(config: GamesConfig, guildId: string): { config: GamesConfig; allowed: boolean } {
  const allowed = pokemonAllowedGuild(config, guildId);
  const next: GamesConfig = {
    ...config,
    pokemon: {
      ...config.pokemon,
      privateOnly: true,
      enabled: allowed ? config.pokemon.enabled : false,
      battleEnabled: allowed ? config.pokemon.battleEnabled : false,
      tradingEnabled: allowed ? config.pokemon.tradingEnabled : false,
    },
  };
  return { config: next, allowed };
}

function merge(current: GamesConfig, patch: any): GamesConfig {
  const p = patch || {};
  return {
    ...current,
    active: toBool(p.active, current.active),
    rareDrop: {
      ...current.rareDrop,
      ...(p.rareDrop || {}),
      enabled: toBool(p?.rareDrop?.enabled, current.rareDrop.enabled),
      intervalMinutes: toNum(p?.rareDrop?.intervalMinutes, current.rareDrop.intervalMinutes, 1, 1440),
      maxActive: toNum(p?.rareDrop?.maxActive, current.rareDrop.maxActive, 1, 100),
      announceChannelId: toStr(p?.rareDrop?.announceChannelId, current.rareDrop.announceChannelId),
      spawnChannelIds: p?.rareDrop?.spawnChannelIds !== undefined ? toArr(p?.rareDrop?.spawnChannelIds) : current.rareDrop.spawnChannelIds,
      dropRatePercent: toNum(p?.rareDrop?.dropRatePercent, current.rareDrop.dropRatePercent, 0, 100),
      rewardCoinsMin: toNum(p?.rareDrop?.rewardCoinsMin, current.rareDrop.rewardCoinsMin, 0, 100000000),
      rewardCoinsMax: toNum(p?.rareDrop?.rewardCoinsMax, current.rareDrop.rewardCoinsMax, 0, 100000000),
    },
    catDrop: {
      ...current.catDrop,
      ...(p.catDrop || {}),
      enabled: toBool(p?.catDrop?.enabled, current.catDrop.enabled),
      intervalMinutes: toNum(p?.catDrop?.intervalMinutes, current.catDrop.intervalMinutes, 1, 1440),
      maxActive: toNum(p?.catDrop?.maxActive, current.catDrop.maxActive, 1, 100),
      announceChannelId: toStr(p?.catDrop?.announceChannelId, current.catDrop.announceChannelId),
      spawnChannelIds: p?.catDrop?.spawnChannelIds !== undefined ? toArr(p?.catDrop?.spawnChannelIds) : current.catDrop.spawnChannelIds,
      rareCatChancePercent: toNum(p?.catDrop?.rareCatChancePercent, current.catDrop.rareCatChancePercent, 0, 100),
      rewardCoinsMin: toNum(p?.catDrop?.rewardCoinsMin, current.catDrop.rewardCoinsMin, 0, 100000000),
      rewardCoinsMax: toNum(p?.catDrop?.rewardCoinsMax, current.catDrop.rewardCoinsMax, 0, 100000000),
    },
    pokemon: {
      ...current.pokemon,
      ...(p.pokemon || {}),
      enabled: toBool(p?.pokemon?.enabled, current.pokemon.enabled),
      privateOnly: true,
      guildAllowed: toBool(p?.pokemon?.guildAllowed, current.pokemon.guildAllowed),
      stage2Enabled: toBool(p?.pokemon?.stage2Enabled, current.pokemon.stage2Enabled),
      battleEnabled: toBool(p?.pokemon?.battleEnabled, current.pokemon.battleEnabled),
      tradingEnabled: toBool(p?.pokemon?.tradingEnabled, current.pokemon.tradingEnabled),
      intervalMinutes: toNum(p?.pokemon?.intervalMinutes, current.pokemon.intervalMinutes, 1, 1440),
      maxActive: toNum(p?.pokemon?.maxActive, current.pokemon.maxActive, 1, 100),
      spawnChannelIds: p?.pokemon?.spawnChannelIds !== undefined ? toArr(p?.pokemon?.spawnChannelIds) : current.pokemon.spawnChannelIds,
      catchCooldownSeconds: toNum(p?.pokemon?.catchCooldownSeconds, current.pokemon.catchCooldownSeconds, 0, 3600),
      shinyChancePercent: toNum(p?.pokemon?.shinyChancePercent, current.pokemon.shinyChancePercent, 0, 100),
      legendaryChancePercent: toNum(p?.pokemon?.legendaryChancePercent, current.pokemon.legendaryChancePercent, 0, 100),
      baseRewardCoins: toNum(p?.pokemon?.baseRewardCoins, current.pokemon.baseRewardCoins, 0, 100000000),
    },
    miniGames: {
      ...current.miniGames,
      ...(p.miniGames || {}),
      rangeEnabled: toBool(p?.miniGames?.rangeEnabled, current.miniGames.rangeEnabled),
      rangeChannelId: toStr(p?.miniGames?.rangeChannelId, current.miniGames.rangeChannelId),
      rangeCooldownSeconds: toNum(p?.miniGames?.rangeCooldownSeconds, current.miniGames.rangeCooldownSeconds, 0, 3600),
      truthDareEnabled: toBool(p?.miniGames?.truthDareEnabled, current.miniGames.truthDareEnabled),
      truthDareChannelId: toStr(p?.miniGames?.truthDareChannelId, current.miniGames.truthDareChannelId),
      truthDareCooldownSeconds: toNum(p?.miniGames?.truthDareCooldownSeconds, current.miniGames.truthDareCooldownSeconds, 0, 3600),
      gunGameEnabled: toBool(p?.miniGames?.gunGameEnabled, current.miniGames.gunGameEnabled),
      gunGameChannelId: toStr(p?.miniGames?.gunGameChannelId, current.miniGames.gunGameChannelId),
      gunGameCooldownSeconds: toNum(p?.miniGames?.gunGameCooldownSeconds, current.miniGames.gunGameCooldownSeconds, 0, 3600),
      dominionEnabled: toBool(p?.miniGames?.dominionEnabled, current.miniGames.dominionEnabled),
      dominionChannelId: toStr(p?.miniGames?.dominionChannelId, current.miniGames.dominionChannelId),
    },
    progression: {
      ...current.progression,
      ...(p.progression || {}),
      enabled: toBool(p?.progression?.enabled, current.progression.enabled),
      achievementsEnabled: toBool(p?.progression?.achievementsEnabled, current.progression.achievementsEnabled),
      carolEnabled: toBool(p?.progression?.carolEnabled, current.progression.carolEnabled),
      xpPerMessageMin: toNum(p?.progression?.xpPerMessageMin, current.progression.xpPerMessageMin, 0, 1000),
      xpPerMessageMax: toNum(p?.progression?.xpPerMessageMax, current.progression.xpPerMessageMax, 0, 1000),
      xpCooldownSeconds: toNum(p?.progression?.xpCooldownSeconds, current.progression.xpCooldownSeconds, 0, 3600),
      dailyXpCap: toNum(p?.progression?.dailyXpCap, current.progression.dailyXpCap, 0, 100000000),
      passiveVoiceXpPerMinute: toNum(p?.progression?.passiveVoiceXpPerMinute, current.progression.passiveVoiceXpPerMinute, 0, 1000),
      levelUpChannelId: toStr(p?.progression?.levelUpChannelId, current.progression.levelUpChannelId),
      announceLevelUp: toBool(p?.progression?.announceLevelUp, current.progression.announceLevelUp),
    },
    rewards: {
      ...current.rewards,
      ...(p.rewards || {}),
      levelTiers: p?.rewards?.levelTiers !== undefined ? toTierArr(p?.rewards?.levelTiers, current.rewards.levelTiers) : current.rewards.levelTiers,
    },
    notes: toStr(p.notes, current.notes),
    updatedAt: new Date().toISOString(),
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId =
    req.method === "GET"
      ? String(req.query.guildId || "").trim()
      : String(req.body?.guildId || "").trim();

  if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

  const store = loadStore();
  const current = merge(DEFAULT_CONFIG, store[guildId] || {});

  if (req.method === "GET") {
    const enforced = enforcePokemonPolicy(current, guildId);
    return res.status(200).json({ success: true, guildId, config: enforced.config, pokemonAllowedGuild: enforced.allowed });
  }

  if (req.method === "POST") {
    const merged = merge(current, req.body?.patch || {});
    const enforced = enforcePokemonPolicy(merged, guildId);
    store[guildId] = enforced.config;
    saveStore(store);
    return res.status(200).json({ success: true, guildId, config: enforced.config, pokemonAllowedGuild: enforced.allowed });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
