import type { NextApiRequest, NextApiResponse } from "next";
import { SERVER_BOT_API, buildServerBotApiHeaders, fetchServerBotApi, readServerBotApiJson } from "@/lib/botApiServer";
import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

function readFirst(value: string | string[] | undefined): string {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

function getRequestOrigin(req: NextApiRequest): string {
  const protocol = readFirst(req.headers["x-forwarded-proto"] as string | string[] | undefined) || "http";
  const host =
    readFirst(req.headers["x-forwarded-host"] as string | string[] | undefined) ||
    readFirst(req.headers.host as string | string[] | undefined);
  return host ? `${protocol}://${host}` : "";
}

function readActorUserId(req: NextApiRequest): string {
  return (
    readFirst(req.query.userId as string | string[] | undefined) ||
    readFirst(req.query.uid as string | string[] | undefined) ||
    MASTER_OWNER_USER_ID
  );
}

function buildFallbackReturnPath(guildId: string, userId: string) {
  const params = new URLSearchParams();
  if (guildId) params.set("guildId", guildId);
  if (userId) params.set("userId", userId);
  return `/dashboard/games${params.toString() ? `?${params.toString()}` : ""}`;
}

function appendError(pathname: string, providerKey: string, message: string) {
  const url = new URL(pathname, "http://dashboard.local");
  url.searchParams.set("providerAuth", "error");
  url.searchParams.set("provider", providerKey);
  url.searchParams.set("authMessage", String(message || "Provider login failed.").slice(0, 180));
  return `${url.pathname}${url.search}${url.hash}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const guildId = String(req.query.guildId || "").trim();
  const providerKey = String(req.query.provider || req.query.providerKey || "").trim();
  const platform = String(req.query.platform || "").trim();
  const userId = readActorUserId(req);
  const origin = getRequestOrigin(req);
  const fallbackReturnPath = buildFallbackReturnPath(guildId, userId);
  const returnPath = String(req.query.returnPath || req.query.returnTo || fallbackReturnPath).trim() || fallbackReturnPath;

  if (!guildId || !providerKey || !userId || !origin) {
    return res.redirect(302, appendError(fallbackReturnPath, providerKey || "unknown", "Missing guild, provider, user, or dashboard origin."));
  }

  try {
    const response = await fetchServerBotApi(`${SERVER_BOT_API}/api/game-provider-auth/start`, {
      method: "POST",
      headers: { ...buildServerBotApiHeaders(userId), "Content-Type": "application/json" },
      body: JSON.stringify({
        guildId,
        userId,
        providerKey,
        platform,
        callbackBaseUrl: origin,
        returnPath,
      }),
    });
    const json = await readServerBotApiJson(response);
    if (!response.ok || json?.success === false || !json?.authorizeUrl) {
      return res.redirect(302, appendError(returnPath || fallbackReturnPath, providerKey, json?.error || `Failed to start ${providerKey} login.`));
    }
    return res.redirect(302, String(json.authorizeUrl));
  } catch (error: any) {
    return res.redirect(302, appendError(returnPath || fallbackReturnPath, providerKey, error?.message || "Failed to start provider login."));
  }
}
