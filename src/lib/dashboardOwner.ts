export const CONTROL_OWNER_USER_IDS = [
  "1072756967799533629",
  "1194515335894802504",
] as const;

export const MASTER_OWNER_USER_ID = CONTROL_OWNER_USER_IDS[0];
export const CO_OWNER_USER_ID = CONTROL_OWNER_USER_IDS[1];

export function isDashboardControlOwner(userId?: string | null) {
  const normalized = String(userId || "").trim();
  return Boolean(normalized && CONTROL_OWNER_USER_IDS.includes(normalized as (typeof CONTROL_OWNER_USER_IDS)[number]));
}

export const FALLBACK_GUILD_NAMES: Record<string, string> = {
  "1431799056211906582": "Saviors Gaming 18+",
  "1336178965202599936": "Alexandria",
  "1473641534065999884": "Possum Bot Support",
};
