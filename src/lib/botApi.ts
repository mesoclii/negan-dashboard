import type { NextApiRequest } from "next";
import { DASHBOARD_SESSION_COOKIE, readDashboardSessionValue } from "@/lib/session";

export const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const BOT_API_TIMEOUT_MS = Math.max(5_000, Number(process.env.BOT_API_TIMEOUT_MS || 45_000));

const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function readFirst(value: string | string[] | undefined): string {
  return String(Array.isArray(value) ? value[0] : value || "").trim();
}

export async function readActorUserId(req: NextApiRequest): Promise<string> {
  const session = await readDashboardSessionValue(req.cookies[DASHBOARD_SESSION_COOKIE]);
  return String(session?.user?.id || "").trim();
}

export async function buildBotApiHeaders(
  req: NextApiRequest,
  options: { json?: boolean } = {}
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const userId = await readActorUserId(req);
  if (!userId) {
    throw new Error("A valid dashboard session is required.");
  }

  if (options.json) headers["Content-Type"] = "application/json";
  if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;
  headers["x-dashboard-user-id"] = userId;
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
