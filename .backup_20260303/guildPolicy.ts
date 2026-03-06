import type { NextApiRequest } from "next";

export const PRIMARY_BASELINE_GUILD_ID = String(
  process.env.SAVIORS_GUILD_ID ||
    process.env.PRIMARY_GUILD_ID ||
    process.env.GUILD_ID ||
    "1431799056211906582"
).trim();

export const STOCK_LOCK_NON_PRIMARY = ["1", "true", "yes", "on", "enabled"].includes(
  String(process.env.STOCK_LOCK_NON_PRIMARY || "true").trim().toLowerCase()
);

export function readGuildIdFromRequest(req: NextApiRequest): string {
  const q = Array.isArray(req.query.guildId) ? req.query.guildId[0] : req.query.guildId;
  const b = req.body && typeof req.body === "object" ? (req.body as any).guildId : "";
  return String(q || b || "").trim();
}

export function isWriteBlockedForGuild(guildId: string): boolean {
  if (!STOCK_LOCK_NON_PRIMARY) return false;
  if (!guildId) return false;
  return guildId !== PRIMARY_BASELINE_GUILD_ID;
}

export function stockLockError(guildId: string) {
  return {
    success: false,
    error: "This guild is stock-locked. Only the primary baseline guild is editable.",
    guildId,
    primaryGuildId: PRIMARY_BASELINE_GUILD_ID,
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

  return [...new Set(ids)];
}
