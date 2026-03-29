import type { NextApiRequest } from "next";
import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

export const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const BOT_API_TIMEOUT_MS = Math.max(5_000, Number(process.env.BOT_API_TIMEOUT_MS || 30_000));

const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function readFirst(value: string | string[] | undefined): string {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

function readBodyString(req: NextApiRequest, key: string): string {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return "";
  }
  const value = (req.body as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

function readFromReferrer(req: NextApiRequest, key: string): string {
  const referrer = readFirst(req.headers.referer as string | string[] | undefined);
  if (!referrer) return "";

  try {
    return String(new URL(referrer).searchParams.get(key) || "").trim();
  } catch {
    return "";
  }
}

export function readActorUserId(req: NextApiRequest): string {
  return (
    readFirst(req.headers["x-dashboard-user-id"] as string | string[] | undefined) ||
    readFirst(req.headers["x-user-id"] as string | string[] | undefined) ||
    readFirst(req.query.userId as string | string[] | undefined) ||
    readFirst(req.query.uid as string | string[] | undefined) ||
    readBodyString(req, "userId") ||
    readBodyString(req, "uid") ||
    readFromReferrer(req, "userId") ||
    readFromReferrer(req, "uid") ||
    MASTER_OWNER_USER_ID
  );
}

export function buildBotApiHeaders(
  req: NextApiRequest,
  options: { json?: boolean } = {}
): Record<string, string> {
  const headers: Record<string, string> = {};
  if (options.json) headers["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;

  const userId = readActorUserId(req);
  if (userId) headers["x-dashboard-user-id"] = userId;

  return headers;
}

export async function readJsonSafe(response: Response) {
  let text = "";
  try {
    text = await response.text();
  } catch (error: any) {
    if (error?.name === "AbortError" || /aborted/i.test(String(error?.message || ""))) {
      return { success: false, error: "Bot API response stream was interrupted before it finished." };
    }
    return { success: false, error: error?.message || "Failed to read Bot API response." };
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid upstream JSON" };
  }
}

export function getRequestOrigin(req: NextApiRequest): string {
  const protocol =
    readFirst(req.headers["x-forwarded-proto"] as string | string[] | undefined) || "http";
  const host =
    readFirst(req.headers["x-forwarded-host"] as string | string[] | undefined) ||
    readFirst(req.headers.host as string | string[] | undefined);

  return host ? `${protocol}://${host}` : "";
}

export async function fetchBotApi(
  url: string,
  init: RequestInit = {},
  timeoutMs = BOT_API_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      cache: init.cache ?? "no-store",
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError" || /aborted/i.test(String(error?.message || ""))) {
      throw new Error(`Bot API timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
