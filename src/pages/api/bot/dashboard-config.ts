import type { NextApiRequest, NextApiResponse } from "next";
import {
  readGuildIdFromRequest,
  PRIMARY_BASELINE_GUILD_ID,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";
import {
  CANONICAL_FEATURE_KEYS,
  asBoolean,
  normalizeFeaturePatch,
  withLegacyFeatureAliases,
} from "@/lib/dashboard/featureKeys";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function authHeaders(json = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) h["x-dashboard-token"] = DASHBOARD_TOKEN;
  return h;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === "object" && !Array.isArray(input);
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function enrichDashboardFeatures(configInput: unknown, guildId: string) {
  if (!isRecord(configInput)) return configInput;

  const config = { ...configInput };
  const security = isRecord(config.security) ? (config.security as Record<string, unknown>) : {};
  const lockdown = isRecord(security.lockdown) ? (security.lockdown as Record<string, unknown>) : {};
  const raid = isRecord(security.raid) ? (security.raid as Record<string, unknown>) : {};

  const tickets =
    isRecord(config.tickets) && typeof (config.tickets as Record<string, unknown>).active === "boolean"
      ? asBoolean((config.tickets as Record<string, unknown>).active)
      : false;

  const giveaways =
    isRecord(config.giveaways) && typeof (config.giveaways as Record<string, unknown>).active === "boolean"
      ? asBoolean((config.giveaways as Record<string, unknown>).active)
      : false;

  const pokemonPrivateOnly =
    isRecord(config.games) &&
    isRecord((config.games as Record<string, unknown>).pokemon) &&
    typeof (((config.games as Record<string, unknown>).pokemon as Record<string, unknown>).privateOnly) === "boolean"
      ? asBoolean((((config.games as Record<string, unknown>).pokemon as Record<string, unknown>).privateOnly), true)
      : true;

  const normalized = withLegacyFeatureAliases(config.features, {
    lockdownEnabled: asBoolean(lockdown.enabled, false),
    raidEnabled: asBoolean(raid.enabled, false),
    ticketsEnabled: tickets,
    giveawaysEnabled: giveaways,
    pokemonPrivateOnly,
  });
  const allCanonicalOff = CANONICAL_FEATURE_KEYS.every((key) => normalized[key] === false);
  if (guildId && guildId !== PRIMARY_BASELINE_GUILD_ID && allCanonicalOff) {
    for (const key of CANONICAL_FEATURE_KEYS) normalized[key] = true;
    normalized.securityEnabled = true;
  }
  config.features = normalized;

  return config;
}

function normalizeWriteBody(req: NextApiRequest, guildId: string) {
  const body = isRecord(req.body) ? { ...req.body } : {};
  body.guildId = guildId;

  const ignored: string[] = [];

  if (isRecord(body.patch) && Object.prototype.hasOwnProperty.call(body.patch, "features")) {
    const patchObj = { ...(body.patch as Record<string, unknown>) };
    const { patch, ignoredKeys } = normalizeFeaturePatch(patchObj.features);
    ignored.push(...ignoredKeys);
    if (Object.keys(patch).length > 0) patchObj.features = patch;
    else delete patchObj.features;
    body.patch = patchObj;
  }

  if (Object.prototype.hasOwnProperty.call(body, "features")) {
    const { patch, ignoredKeys } = normalizeFeaturePatch((body as Record<string, unknown>).features);
    ignored.push(...ignoredKeys);
    if (Object.keys(patch).length > 0) body.features = patch;
    else delete body.features;
  }

  return { body, ignoredFeatureKeys: Array.from(new Set(ignored)) };
}

async function readJsonSafe(r: Response) {
  const text = await r.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid upstream response" };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = readGuildIdFromRequest(req);

    if (req.method === "GET") {
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const upstream = await fetch(
        `${BOT_API}/dashboard-config?guildId=${encodeURIComponent(guildId)}`,
        { headers: authHeaders(false) }
      );
      const data = await readJsonSafe(upstream);
      if (isRecord(data) && isRecord(data.config)) {
        data.config = enrichDashboardFeatures(data.config, guildId);
      }
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST") {
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const normalized = normalizeWriteBody(req, guildId);
      const upstream = await fetch(`${BOT_API}/dashboard-config`, {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(normalized.body),
      });
      const data = await readJsonSafe(upstream);
      if (isRecord(data) && normalized.ignoredFeatureKeys.length > 0) {
        data.ignoredFeatureKeys = normalized.ignoredFeatureKeys;
      }
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: unknown) {
    return res.status(500).json({ success: false, error: getErrorMessage(err, "Proxy error") });
  }
}
