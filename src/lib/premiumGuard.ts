import type { NextApiRequest, NextApiResponse } from "next";
import { MASTER_OWNER_USER_ID, isDashboardControlOwner } from "@/lib/dashboardOwner";
import { featureRequiresPremium, getGuildSubscriptionStatus, isDeveloperPremiumBypass } from "@/lib/subscription";

const FEATURE_LABELS: Record<string, string> = {
  tts: "TTS Engine",
  heist: "Heist Engine",
  persona: "Persona Engine AI",
  "openai-platform": "OpenAI Persona Platform",
};

function readActorUserId(req: NextApiRequest) {
  return (
    String(req.headers["x-dashboard-user-id"] || "").trim() ||
    String(req.body?.userId || "").trim() ||
    String(req.query.userId || "").trim() ||
    MASTER_OWNER_USER_ID
  );
}

export function mapPremiumFeatureKey(rawFeature: string) {
  const feature = String(rawFeature || "").trim().toLowerCase();
  if (!feature) return "";
  if (["tts"].includes(feature)) return "tts";
  if (["heist"].includes(feature)) return "heist";
  if (["persona", "ai-personas-config", "ai-persona-runtime"].includes(feature)) return "persona";
  if (["openai-platform", "ai-pricing-config"].includes(feature)) return "openai-platform";
  return feature;
}

export async function requirePremiumAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  guildId: string,
  rawFeature: string
) {
  const featureKey = mapPremiumFeatureKey(rawFeature);
  if (!featureRequiresPremium(featureKey)) {
    return true;
  }

  const actorUserId = readActorUserId(req);
  if (isDeveloperPremiumBypass(actorUserId) || isDashboardControlOwner(actorUserId)) {
    return true;
  }

  const subscription = await getGuildSubscriptionStatus(guildId, actorUserId).catch(() => null);
  if (subscription?.active) {
    return true;
  }

  return res.status(402).json({
    success: false,
    premiumRequired: true,
    featureKey,
    error: `${FEATURE_LABELS[featureKey] || "This feature"} requires a premium subscription for this guild.`,
  });
}
