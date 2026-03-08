import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";
import { readGuildDiscoveryCache, writeGuildDiscoveryCache } from "@/lib/guildDiscoveryCache";
import prisma from "@/lib/prisma";
import { buildServerBotApiHeaders, readServerBotApiJson, SERVER_BOT_API } from "@/lib/botApiServer";

const PREMIUM_FEATURES = new Set(["tts", "heist", "persona", "openai-platform"]);
const SYNC_TTL_MS = 60_000;

export function featureRequiresPremium(featureKey: string) {
  return PREMIUM_FEATURES.has(String(featureKey || "").trim());
}

type SubscriptionStatus = {
  guildId: string;
  active: boolean;
  plan: string;
  premiumTier: string | null;
  source: string;
  premiumExpiresAt: string | null;
};

function normalizePlan(value: unknown) {
  const plan = String(value || "").trim();
  return plan || "FREE";
}

async function readBotPremium(guildId: string, actorUserId: string) {
  const upstream = await fetch(
    `${SERVER_BOT_API}/guild-data?guildId=${encodeURIComponent(guildId)}`,
    {
      headers: buildServerBotApiHeaders(actorUserId),
      cache: "no-store",
    }
  );
  const data = await readServerBotApiJson(upstream);
  if (!upstream.ok || data?.success === false) {
    throw new Error(data?.error || `Guild premium lookup failed (${upstream.status})`);
  }
  const premium = data?.premium || {};
  return {
    active: Boolean(premium?.premium),
    plan: normalizePlan(premium?.premiumTier || (premium?.premium ? "PRO" : "FREE")),
    premiumTier: premium?.premiumTier ? String(premium.premiumTier) : null,
    premiumExpiresAt: premium?.premiumExpires ? new Date(premium.premiumExpires) : null,
  };
}

export async function getGuildSubscriptionStatus(guildId: string, actorUserId?: string): Promise<SubscriptionStatus> {
  const id = String(guildId || "").trim();
  if (!id) {
    return {
      guildId: "",
      active: false,
      plan: "FREE",
      premiumTier: null,
      source: "missing_guild",
      premiumExpiresAt: null,
    };
  }

  const cached = await readGuildDiscoveryCache<SubscriptionStatus>("subscription_status", id);
  if (cached && cached.guildId) {
    return cached;
  }

  const existing = await prisma.guildSubscription.findUnique({
    where: { guildId: id },
  }).catch(() => null);

  const shouldSync =
    !existing ||
    Date.now() - existing.syncedAt.getTime() > SYNC_TTL_MS;

  if (shouldSync) {
    try {
      const botPremium = await readBotPremium(id, String(actorUserId || MASTER_OWNER_USER_ID).trim() || MASTER_OWNER_USER_ID);
      const synced = await prisma.guildSubscription
        .upsert({
          where: { guildId: id },
          update: {
            plan: botPremium.plan,
            active: botPremium.active,
            source: "bot_sync",
            premiumTier: botPremium.premiumTier,
            premiumExpiresAt: botPremium.premiumExpiresAt,
            syncedAt: new Date(),
          },
          create: {
            guildId: id,
            plan: botPremium.plan,
            active: botPremium.active,
            source: "bot_sync",
            premiumTier: botPremium.premiumTier,
            premiumExpiresAt: botPremium.premiumExpiresAt,
            syncedAt: new Date(),
          },
        })
        .catch(() => null);

      if (synced) {
        const status = {
          guildId: id,
          active: synced.active,
          plan: normalizePlan(synced.plan),
          premiumTier: synced.premiumTier,
          source: synced.source,
          premiumExpiresAt: synced.premiumExpiresAt ? synced.premiumExpiresAt.toISOString() : null,
        };
        await writeGuildDiscoveryCache("subscription_status", id, status, 45).catch(() => null);
        return status;
      }
    } catch (error) {
      if (!existing) {
        throw error;
      }
    }
  }

  const status = {
    guildId: id,
    active: Boolean(existing?.active),
    plan: normalizePlan(existing?.plan),
    premiumTier: existing?.premiumTier || null,
    source: existing?.source || "db_cache",
    premiumExpiresAt: existing?.premiumExpiresAt ? existing.premiumExpiresAt.toISOString() : null,
  };
  await writeGuildDiscoveryCache("subscription_status", id, status, 45).catch(() => null);
  return status;
}
