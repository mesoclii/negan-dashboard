import type { NextApiRequest, NextApiResponse } from "next";
import {
  readGuildIdFromRequest,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";
import {
  normalizeFeaturePatch,
  resolveCanonicalFeatureKey,
  withLegacyFeatureAliases,
} from "@/lib/dashboard/featureKeys";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function authHeaders() {
  const headers: Record<string, string> = {};
  if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;
  return headers;
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === "object" && !Array.isArray(input);
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = readGuildIdFromRequest(req);
    if (!guildId) {
      return res.status(400).json({ success: false, error: "Missing guildId" });
    }

    if (req.method === "GET") {
      const url = `${BOT_API}/guild-features?guildId=${encodeURIComponent(guildId)}`;
      const r = await fetch(url, { method: "GET", headers: authHeaders() });
      const data = await r.json().catch(() => ({}));
      if (isRecord(data) && isRecord(data.features)) {
        data.features = withLegacyFeatureAliases(data.features);
      }
      return res.status(r.status).json(data);
    }

    if (req.method === "POST") {
      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const body = isRecord(req.body) ? req.body : {};
      const hasBulk = isRecord(body.features);

      if (hasBulk) {
        const normalized = normalizeFeaturePatch(body.features);
        if (Object.keys(normalized.patch).length === 0) {
          return res.status(200).json({ success: true, guildId, ignoredFeatureKeys: normalized.ignoredKeys });
        }

        const r = await fetch(`${BOT_API}/guild-features`, {
          method: "POST",
          headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ guildId, features: normalized.patch }),
        });

        const data = await r.json().catch(() => ({}));
        if (isRecord(data) && normalized.ignoredKeys.length > 0) {
          data.ignoredFeatureKeys = normalized.ignoredKeys;
        }
        return res.status(r.status).json(data);
      }

      const rawKey =
        typeof body.featureKey === "string"
          ? body.featureKey
          : typeof body.feature === "string"
            ? body.feature
            : typeof body.key === "string"
              ? body.key
              : "";

      const canonical = resolveCanonicalFeatureKey(rawKey);
      const enabled = typeof body.enabled === "boolean" ? body.enabled : null;

      if (!canonical || enabled === null) {
        return res.status(200).json({ success: true, guildId, ignoredFeatureKeys: rawKey ? [rawKey] : [] });
      }

      const r = await fetch(`${BOT_API}/api/features/update`, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guildId, featureKey: canonical, key: canonical, feature: canonical, enabled }),
      });

      const data = await r.json().catch(() => ({}));
      return res.status(r.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      error: getErrorMessage(err, "Feature proxy failed"),
    });
  }
}
