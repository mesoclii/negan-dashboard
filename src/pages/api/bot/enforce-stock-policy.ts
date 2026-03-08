import type { NextApiRequest, NextApiResponse } from "next";
import {
  PRIMARY_BASELINE_GUILD_ID,
  GAMES_BASELINE_GUILD_ID,
  STOCK_LOCK_NON_PRIMARY,
  getGuildBaselineKind,
  parseDashboardGuildIds,
  readGuildIdFromRequest,
} from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

function resolveTargetGuildIds(req: NextApiRequest): string[] {
  const requestedGuildId = readGuildIdFromRequest(req);
  if (/^\d{16,20}$/.test(requestedGuildId)) {
    return [requestedGuildId];
  }
  return parseDashboardGuildIds();
}

function describeAction(guildId: string) {
  const kind = getGuildBaselineKind(guildId);
  if (kind === "primary") return "primary_all_features_on";
  if (kind === "games") return "public_games_baseline";
  return "standard_ready_baseline";
}

function resolveMode(guildId: string) {
  void guildId;
  return "builtIn";
}

async function enforceGuildPolicy(req: NextApiRequest, guildId: string) {
  const action = describeAction(guildId);
  const mode = resolveMode(guildId);

  const upstream = await fetch(`${BOT_API}/guild-baseline`, {
    method: "POST",
    headers: buildBotApiHeaders(req, { json: true }),
    body: JSON.stringify({ guildId, mode }),
  });
  const data = await readJsonSafe(upstream);

  return {
    guildId,
    action,
    mode,
    success: upstream.ok && data?.success !== false,
    status: upstream.status,
    error: upstream.ok ? null : data?.error || "policy step failed",
    result: upstream.ok ? data : undefined,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const dryRun = String(req.query.dryRun || req.body?.dryRun || "").trim().toLowerCase() === "true";
  const guildIds = resolveTargetGuildIds(req);

  if (!guildIds.length) {
    return res.status(200).json({
      success: true,
      dryRun,
      primaryGuildId: PRIMARY_BASELINE_GUILD_ID,
      gamesBaselineGuildId: GAMES_BASELINE_GUILD_ID,
      stockLockNonPrimary: STOCK_LOCK_NON_PRIMARY,
      results: [],
      message: "No guild IDs configured",
    });
  }

  const results: Array<Record<string, unknown>> = [];

  for (const guildId of guildIds) {
    if (dryRun) {
      results.push({
        guildId,
        action: describeAction(guildId),
        mode: resolveMode(guildId),
        success: true,
        skipped: true,
      });
      continue;
    }

    try {
      results.push(await enforceGuildPolicy(req, guildId));
    } catch (e: any) {
      results.push({
        guildId,
        action: describeAction(guildId),
        mode: resolveMode(guildId),
        success: false,
        error: e?.message || "policy step failed",
      });
    }
  }

  const failed = results.filter((r) => r.success === false);

  return res.status(failed.length ? 207 : 200).json({
    success: failed.length === 0,
    dryRun,
    primaryGuildId: PRIMARY_BASELINE_GUILD_ID,
    gamesBaselineGuildId: GAMES_BASELINE_GUILD_ID,
    stockLockNonPrimary: STOCK_LOCK_NON_PRIMARY,
    results,
  });
}
