import type { NextApiRequest, NextApiResponse } from "next";
import {
  SERVER_BOT_API,
  buildServerBotApiHeaders,
  fetchServerBotApi,
  readServerBotApiJson,
} from "@/lib/botApiServer";
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

function fallbackPath(req: NextApiRequest) {
  const guildId = readFirst(req.query.guildId as string | string[] | undefined);
  const userId = readActorUserId(req);
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

  const providerKey = readFirst((req.query.provider as string | string[] | undefined) || (req.query.providerKey as string | string[] | undefined));
  const origin = getRequestOrigin(req);
  const fallback = fallbackPath(req);
  const actorUserId = readActorUserId(req);

  if (!providerKey || !origin) {
    return res.redirect(302, appendError(fallback, providerKey || "unknown", "Missing provider or dashboard origin."));
  }

  try {
    const response = await fetchServerBotApi(`${SERVER_BOT_API}/api/game-provider-auth/callback`, {
      method: "POST",
      headers: {
        ...buildServerBotApiHeaders(actorUserId),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        providerKey,
        callbackBaseUrl: origin,
        query: req.query,
      }),
    });
    const json = await readServerBotApiJson(response);
    const redirectPath = String(json?.redirectPath || fallback).trim() || fallback;
    if (!response.ok || json?.success === false) {
      return res.redirect(302, appendError(redirectPath || fallback, providerKey, json?.error || `Failed to finish ${providerKey} login.`));
    }
    return res.redirect(302, redirectPath);
  } catch (error: any) {
    return res.redirect(302, appendError(fallback, providerKey, error?.message || "Failed to finish provider login."));
  }
}
