import type { NextApiRequest, NextApiResponse } from "next";
import {
  PRIMARY_BASELINE_GUILD_ID,
  GAMES_BASELINE_GUILD_ID,
  parseDashboardGuildIds,
  STOCK_LOCK_NON_PRIMARY,
} from "@/lib/guildPolicy";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

const ALL_FEATURES_ON_BASE = {
  onboardingEnabled: true,
  verificationEnabled: true,
  heistEnabled: true,
  rareDropEnabled: true,
  pokemonEnabled: false,
  aiEnabled: true,
  ttsEnabled: true,
  birthdayEnabled: true,
  economyEnabled: true,
  governanceEnabled: true,
};

const PUBLIC_GAMES_FEATURE_BASE = {
  onboardingEnabled: false,
  verificationEnabled: false,
  heistEnabled: true,
  rareDropEnabled: true,
  pokemonEnabled: true,
  aiEnabled: true,
  ttsEnabled: true,
  birthdayEnabled: true,
  economyEnabled: true,
  governanceEnabled: false,
};

const BLANK = {
  features: {
    onboardingEnabled: false,
    verificationEnabled: false,
    heistEnabled: false,
    rareDropEnabled: false,
    pokemonEnabled: false,
    aiEnabled: false,
    birthdayEnabled: false,
    economyEnabled: false,
    governanceEnabled: false,
    ttsEnabled: false,
  },
  persona: { guildNickname: "", webhookName: "", webhookAvatarUrl: "", useWebhookPersona: false },
  security: {
    preOnboarding: { autoBanOnBlacklistRejoin: false, autoBanOnRefusalRole: false, refusalRoleId: null, enforcementChannelId: null, contactUser: "", banDmTemplate: "" },
    onboarding: {
      welcomeChannelId: null, mainChatChannelId: null, rulesChannelId: null, idChannelId: null, ticketCategoryId: null,
      transcriptChannelId: null, logChannelId: null, verifiedRoleId: null, declineRoleId: null,
      staffRoleIds: [], removeOnVerifyRoleIds: [], idTimeoutMinutes: 30,
      dmTemplate: "", panelTitle: "", panelDescription: "", panelFooter: "", gateAnnouncementTemplate: "",
      idPanelTitle: "", idPanelDescription: "", idPanelContent: "", postVerifyTemplate: "",
    },
    verification: { autoKickOnDecline: false, autoKickOnTimeout: false, declineKickReason: "", timeoutKickReason: "", declineReplyTemplate: "" },
    lockdown: { enabled: false, joinThresholdPerMinute: 10, mentionThresholdPerMinute: 20, autoEscalation: false, exemptRoleIds: [], exemptChannelIds: [] },
    raid: { enabled: false, joinBurstThreshold: 6, windowSeconds: 30, actionPreset: "contain", exemptRoleIds: [], exemptChannelIds: [], autoEscalate: false },
  },
};

async function enforcePrimary(req: NextApiRequest, guildId: string) {
  const steps: Array<Record<string, any>> = [];

  const curRes = await fetch(`${BOT_API}/guild-features?guildId=${encodeURIComponent(guildId)}`, {
    headers: buildBotApiHeaders(req),
    cache: "no-store",
  });
  const curJson = await readJsonSafe(curRes);
  const privateGuild = Boolean(curJson?.privateGuild);

  const allOn = {
    ...ALL_FEATURES_ON_BASE,
    pokemonEnabled: privateGuild,
  };

  const fRes = await fetch(`${BOT_API}/guild-features`, {
    method: "POST",
    headers: buildBotApiHeaders(req, { json: true }),
    body: JSON.stringify({ guildId, features: allOn }),
  });
  const fJson = await readJsonSafe(fRes);
  steps.push({ step: "guild-features", success: fRes.ok && fJson?.success !== false, status: fRes.status, error: fRes.ok ? null : fJson?.error || "failed", privateGuild, allOn });

  const tRes = await fetch(`${BOT_API}/engine-config`, {
    method: "POST",
    headers: buildBotApiHeaders(req, { json: true }),
    body: JSON.stringify({ guildId, engine: "tts", config: { enabled: true } }),
  });
  const tJson = await readJsonSafe(tRes);
  steps.push({ step: "tts-engine", success: tRes.ok && tJson?.success !== false, status: tRes.status, error: tRes.ok ? null : tJson?.error || "failed" });

  return {
    guildId,
    action: "primary_all_features_on",
    success: steps.every((s) => s.success),
    steps,
  };
}

async function enforcePublicGamesBaseline(req: NextApiRequest, guildId: string) {
  const steps: Array<Record<string, any>> = [];

  const enginePatches = [
    ["preOnboarding", { autoBanOnBlacklistRejoin: false, autoBanOnRefusalRole: false, refusalRoleId: null, enforcementChannelId: null, contactUser: "", banDmTemplate: "" }],
    ["onboarding", { enabled: false, sendWelcomeDm: false, welcomeMessageTemplate: "", welcomeChannelId: null, mainChatChannelId: null, rulesChannelId: null, idChannelId: null, ticketCategoryId: null, transcriptChannelId: null, logChannelId: null, verifiedRoleId: null, declineRoleId: null, staffRoleIds: [], removeOnVerifyRoleIds: [], dmTemplate: "", panelTitle: "", panelDescription: "", panelFooter: "", gateAnnouncementTemplate: "", idPanelTitle: "", idPanelDescription: "", idPanelContent: "", postVerifyTemplate: "" }],
    ["verification", { enabled: false, autoKickOnDecline: false, autoKickOnTimeout: false, declineKickReason: "", timeoutKickReason: "", declineReplyTemplate: "", declineAction: "kick" }],
    ["lockdown", { enabled: false, autoEscalation: false, exemptRoleIds: [], exemptChannelIds: [] }],
    ["raid", { enabled: false, autoEscalate: false, exemptRoleIds: [], exemptChannelIds: [] }],
    ["giveaways", { enabled: true }],
    ["tts", { enabled: true }],
    ["crew", { enabled: true, allowPublicRecruitment: true }],
    ["dominion", { enabled: true, seasonsEnabled: true }],
    ["contracts", { enabled: true }],
    ["prestige", { enabled: true }],
    ["inviteTracker", { enabled: true }],
    ["rareSpawn", { enabled: true }],
    ["catDrop", { enabled: true }],
    ["range", { enabled: true }],
    ["pokemon", { enabled: true, guildAllowed: true, privateOnly: false, stage2Enabled: true, battleEnabled: true, tradingEnabled: true }],
    ["truthDare", { enabled: true }],
    ["panelDeploy", { enabled: true }],
    ["masterPanel", { enabled: true }],
  ] as const;

  for (const [engine, config] of enginePatches) {
    const upstream = await fetch(`${BOT_API}/engine-config`, {
      method: "POST",
      headers: buildBotApiHeaders(req, { json: true }),
      body: JSON.stringify({ guildId, engine, config }),
    });
    const json = await readJsonSafe(upstream);
    steps.push({
      step: `engine:${engine}`,
      success: upstream.ok && json?.success !== false,
      status: upstream.status,
      error: upstream.ok ? null : json?.error || "failed",
    });
  }

  const featureRes = await fetch(`${BOT_API}/guild-features`, {
    method: "POST",
    headers: buildBotApiHeaders(req, { json: true }),
    body: JSON.stringify({ guildId, features: PUBLIC_GAMES_FEATURE_BASE }),
  });
  const featureJson = await readJsonSafe(featureRes);
  steps.push({
    step: "guild-features",
    success: featureRes.ok && featureJson?.success !== false,
    status: featureRes.status,
    error: featureRes.ok ? null : featureJson?.error || "failed",
  });

  return {
    guildId,
    action: "public_games_baseline",
    success: steps.every((s) => s.success),
    steps,
  };
}

async function enforceStock(req: NextApiRequest, guildId: string) {
  const up = await fetch(`${BOT_API}/dashboard-config`, {
    method: "POST",
    headers: buildBotApiHeaders(req, { json: true }),
    body: JSON.stringify({ guildId, patch: BLANK }),
  });
  const data = await readJsonSafe(up);
  return {
    guildId,
    action: "reset_to_stock",
    success: up.ok && data?.success !== false,
    status: up.status,
    error: up.ok ? null : data?.error || "reset failed",
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const dryRun = String(req.query.dryRun || req.body?.dryRun || "").trim().toLowerCase() === "true";
  const guildIds = parseDashboardGuildIds();

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

  const results: Array<Record<string, any>> = [];

  for (const guildId of guildIds) {
    if (dryRun) {
      results.push({
        guildId,
        action:
          guildId === PRIMARY_BASELINE_GUILD_ID
            ? "primary_all_features_on"
            : guildId === GAMES_BASELINE_GUILD_ID
              ? "public_games_baseline"
              : "reset_to_stock",
        success: true,
        skipped: true,
      });
      continue;
    }

    try {
      if (guildId === PRIMARY_BASELINE_GUILD_ID) {
        results.push(await enforcePrimary(req, guildId));
      } else if (guildId === GAMES_BASELINE_GUILD_ID) {
        results.push(await enforcePublicGamesBaseline(req, guildId));
      } else {
        results.push(await enforceStock(req, guildId));
      }
    } catch (e: any) {
      results.push({
        guildId,
        action:
          guildId === PRIMARY_BASELINE_GUILD_ID
            ? "primary_all_features_on"
            : guildId === GAMES_BASELINE_GUILD_ID
              ? "public_games_baseline"
              : "reset_to_stock",
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
