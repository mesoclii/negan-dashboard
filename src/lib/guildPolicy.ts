import type { NextApiRequest } from "next";

export const PRIMARY_BASELINE_GUILD_ID = String(
  process.env.SAVIORS_GUILD_ID ||
    process.env.PRIMARY_GUILD_ID ||
    process.env.GUILD_ID ||
    "1431799056211906582"
).trim();

export const GAMES_BASELINE_GUILD_ID = String(
  process.env.PUBLIC_GAMES_GUILD_ID ||
    process.env.ALEXANDRIA_GUILD_ID ||
    "1336178965202599936"
).trim();

export const STOCK_LOCK_NON_PRIMARY = false;

export const EDITABLE_BASELINE_GUILD_IDS = Array.from(
  new Set(
    [PRIMARY_BASELINE_GUILD_ID, GAMES_BASELINE_GUILD_ID].filter((value) => /^\d{16,20}$/.test(String(value)))
  )
);

export function readGuildIdFromRequest(req: NextApiRequest): string {
  const q = Array.isArray(req.query.guildId) ? req.query.guildId[0] : req.query.guildId;
  const b = req.body && typeof req.body === "object" ? (req.body as any).guildId : "";
  return String(q || b || "").trim();
}

export function isWriteBlockedForGuild(guildId: string): boolean {
  void guildId;
  return false;
}

export function getGuildBaselineKind(guildId: string): "primary" | "games" | "stock" {
  if (guildId === PRIMARY_BASELINE_GUILD_ID) return "primary";
  if (guildId === GAMES_BASELINE_GUILD_ID) return "games";
  return "stock";
}

export function stockLockError(guildId: string) {
  return {
    success: false,
    error: "Guild writes are unlocked.",
    guildId,
    primaryGuildId: PRIMARY_BASELINE_GUILD_ID,
    gamesBaselineGuildId: GAMES_BASELINE_GUILD_ID,
    stockLockNonPrimary: STOCK_LOCK_NON_PRIMARY,
  };
}

export function parseDashboardGuildIds(): string[] {
  const raw =
    process.env.DASHBOARD_GUILD_IDS ||
    process.env.GUILD_IDS ||
    process.env.PRIMARY_GUILD_ID ||
    "";

  const ids = String(raw)
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^\d{16,20}$/.test(v));

  return [...new Set([...ids, ...EDITABLE_BASELINE_GUILD_IDS])];
}
