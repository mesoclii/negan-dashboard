import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";
import { readGuildDiscoveryCache, writeGuildDiscoveryCache } from "@/lib/guildDiscoveryCache";
import prisma from "@/lib/prisma";
import { buildServerBotApiHeaders, readServerBotApiJson, SERVER_BOT_API } from "@/lib/botApiServer";

const PREMIUM_FEATURES = new Set(["tts", "heist", "persona", "openai-platform"]);
const SYNC_TTL_MS = 60_000;

function normalizeActorUserId(actorUserId?: string) {
  return String(actorUserId || MASTER_OWNER_USER_ID).trim() || MASTER_OWNER_USER_ID;
}

export function featureRequiresPremium(featureKey: string) {
  return PREMIUM_FEATURES.has(String(featureKey || "").trim());
}

export function isDeveloperPremiumBypass(actorUserId?: string) {
  return normalizeActorUserId(actorUserId) === MASTER_OWNER_USER_ID;
}

type SubscriptionStatus = {
  guildId: string;
  active: boolean;
  plan: string;
  premiumTier: string | null;
  source: string;
  premiumExpiresAt: string | null;
  developerBypass: boolean;
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
  const normalizedActorUserId = normalizeActorUserId(actorUserId);
  const developerBypass = isDeveloperPremiumBypass(normalizedActorUserId);
  if (!id) {
    return {
      guildId: "",
      active: false,
      plan: "FREE",
      premiumTier: null,
      source: "missing_guild",
      premiumExpiresAt: null,
      developerBypass,
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
          developerBypass,
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
    developerBypass,
  };
  await writeGuildDiscoveryCache("subscription_status", id, status, 45).catch(() => null);
  return status;
}

export async function setGuildSubscriptionStatus(
  guildId: string,
  input: {
    active: boolean;
    plan?: string;
    premiumTier?: string | null;
    premiumExpiresAt?: Date | null;
    source?: string;
  }
): Promise<SubscriptionStatus> {
  const id = String(guildId || "").trim();
  if (!id) {
    throw new Error("guildId is required");
  }

  const record = await prisma.guildSubscription.upsert({
    where: { guildId: id },
    update: {
      active: Boolean(input.active),
      plan: normalizePlan(input.plan || (input.active ? "PRO" : "FREE")),
      premiumTier: input.premiumTier ? String(input.premiumTier) : null,
      premiumExpiresAt: input.premiumExpiresAt ?? null,
      source: String(input.source || "owner_override").trim() || "owner_override",
      syncedAt: new Date(),
    },
    create: {
      guildId: id,
      active: Boolean(input.active),
      plan: normalizePlan(input.plan || (input.active ? "PRO" : "FREE")),
      premiumTier: input.premiumTier ? String(input.premiumTier) : null,
      premiumExpiresAt: input.premiumExpiresAt ?? null,
      source: String(input.source || "owner_override").trim() || "owner_override",
      syncedAt: new Date(),
    },
  });

  const status = {
    guildId: id,
    active: Boolean(record.active),
    plan: normalizePlan(record.plan),
    premiumTier: record.premiumTier || null,
    source: record.source || "owner_override",
    premiumExpiresAt: record.premiumExpiresAt ? record.premiumExpiresAt.toISOString() : null,
    developerBypass: false,
  };

  await writeGuildDiscoveryCache("subscription_status", id, status, 45).catch(() => null);
  return status;
}
