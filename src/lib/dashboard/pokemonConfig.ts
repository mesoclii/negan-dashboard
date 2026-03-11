export type PokemonTierKey = "common" | "rare" | "epic" | "legendary" | "mythic";
export type PokemonChannelWeight = { id: string; weight: number };
type NormalizePokemonChannelOptions = { keepEmpty?: boolean };

export type PokemonConfig = {
  enabled: boolean;
  guildAllowed: boolean;
  privateOnly: boolean;
  stage2Enabled: boolean;
  battleEnabled: boolean;
  tradingEnabled: boolean;
  catchLogChannelId: string;
  battleChannelId: string;
  battleLogChannelId: string;
  tradeLogChannelId: string;
  channels: Array<string | PokemonChannelWeight>;
  spawnIntervalMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  maxActiveSpawns: number;
  despawnMinutes: number;
  minCatchAgeMs: number;
  tierWeights: Record<PokemonTierKey, number>;
  catchRates: Record<PokemonTierKey, number>;
  rewards: Record<PokemonTierKey, number>;
};

export const POKEMON_TIER_KEYS: PokemonTierKey[] = ["common", "rare", "epic", "legendary", "mythic"];

export const DEFAULT_POKEMON_CONFIG: PokemonConfig = {
  enabled: false,
  guildAllowed: false,
  privateOnly: true,
  stage2Enabled: true,
  battleEnabled: true,
  tradingEnabled: true,
  catchLogChannelId: "",
  battleChannelId: "",
  battleLogChannelId: "",
  tradeLogChannelId: "",
  channels: [],
  spawnIntervalMinutes: 20,
  minMinutes: 10,
  maxMinutes: 20,
  maxActiveSpawns: 2,
  despawnMinutes: 15,
  minCatchAgeMs: 5000,
  tierWeights: {
    common: 55,
    rare: 25,
    epic: 12,
    legendary: 6,
    mythic: 2,
  },
  catchRates: {
    common: 0.58,
    rare: 0.34,
    epic: 0.28,
    legendary: 0.2,
    mythic: 0.14,
  },
  rewards: {
    common: 14,
    rare: 40,
    epic: 90,
    legendary: 180,
    mythic: 300,
  },
};

export function normalizePokemonChannels(
  raw: PokemonConfig["channels"] | undefined,
  options: NormalizePokemonChannelOptions = {}
): PokemonChannelWeight[] {
  return Array.isArray(raw)
    ? raw
        .map((entry) => {
          if (typeof entry === "string") return { id: entry, weight: 1 };
          return {
            id: String(entry?.id || "").trim(),
            weight: Math.max(1, Number(entry?.weight || 1)),
          };
        })
        .filter((entry) => options.keepEmpty ? true : Boolean(entry.id))
    : [];
}

export function compactPokemonChannels(raw: PokemonConfig["channels"] | undefined): PokemonChannelWeight[] {
  return normalizePokemonChannels(raw);
}

export function normalizePokemonConfig(raw: Partial<PokemonConfig> | PokemonConfig): PokemonConfig {
  const next = { ...DEFAULT_POKEMON_CONFIG, ...(raw || {}) };
  return {
    ...next,
    channels: normalizePokemonChannels(next.channels, { keepEmpty: true }),
    tierWeights: {
      ...DEFAULT_POKEMON_CONFIG.tierWeights,
      ...(next.tierWeights || {}),
    },
    catchRates: {
      ...DEFAULT_POKEMON_CONFIG.catchRates,
      ...(next.catchRates || {}),
    },
    rewards: {
      ...DEFAULT_POKEMON_CONFIG.rewards,
      ...(next.rewards || {}),
    },
  };
}

export function isTextLikeChannel(type: number | string | undefined) {
  return Number(type) === 0 || Number(type) === 5 || String(type || "").toLowerCase().includes("text");
}

export function titleizePokemonTier(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
