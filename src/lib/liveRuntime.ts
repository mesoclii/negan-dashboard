"use client";

export type GuildChannel = {
  id: string;
  name: string;
  type?: number | string;
  parentId?: string | null;
};

export type GuildRole = {
  id: string;
  name: string;
  position?: number;
  color?: string;
};

export type GuildDataPayload = {
  guild?: { id?: string; name?: string };
  channels?: GuildChannel[];
  roles?: GuildRole[];
};

const GUILD_DATA_TTL_MS = 90_000;
const RUNTIME_ENGINE_TTL_MS = 20_000;
const DASHBOARD_CONFIG_TTL_MS = 60_000;

type TimedCacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const guildDataCache = new Map<string, TimedCacheEntry<GuildDataPayload>>();
const guildDataInflight = new Map<string, Promise<GuildDataPayload>>();
const runtimeEngineCache = new Map<string, TimedCacheEntry<any>>();
const runtimeEngineInflight = new Map<string, Promise<any>>();
const dashboardConfigCache = new Map<string, TimedCacheEntry<any>>();
const dashboardConfigInflight = new Map<string, Promise<any>>();

export async function readJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

export function resolveGuildContext() {
  if (typeof window === "undefined") {
    return { guildId: "", guildName: "", userId: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const guildId = (params.get("guildId") || localStorage.getItem("activeGuildId") || "").trim();
  const guildName = (localStorage.getItem("activeGuildName") || guildId).trim();
  const userId = (params.get("userId") || params.get("uid") || "").trim();

  if (guildId) {
    localStorage.setItem("activeGuildId", guildId);
  }

  return { guildId, guildName, userId };
}

function resolveViewerUserId(explicitUserId = "") {
  const direct = String(explicitUserId || "").trim();
  if (direct) return direct;
  return resolveGuildContext().userId;
}

export async function fetchGuildData(guildId: string) {
  const userId = resolveViewerUserId();
  const cacheKey = `${String(guildId || "").trim()}:${userId}`;
  const cached = guildDataCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const inflight = guildDataInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    const res = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`, {
      cache: "no-store",
    });
    const json = await readJsonOrThrow(res);
    const roles = Array.isArray(json?.roles) ? json.roles : [];
    roles.sort((a: GuildRole, b: GuildRole) => (Number(b.position || 0) - Number(a.position || 0)) || a.name.localeCompare(b.name));
    const value = {
      guild: json?.guild || null,
      channels: Array.isArray(json?.channels) ? json.channels : [],
      roles,
    } as GuildDataPayload;
    guildDataCache.set(cacheKey, { value, expiresAt: Date.now() + GUILD_DATA_TTL_MS });
    guildDataInflight.delete(cacheKey);
    return value;
  })().catch((error) => {
    guildDataInflight.delete(cacheKey);
    throw error;
  });

  guildDataInflight.set(cacheKey, request);
  return request;
}

export async function fetchRuntimeEngine(guildId: string, engine: string, userId = "") {
  const actorUserId = resolveViewerUserId(userId);
  const cacheKey = `${String(guildId || "").trim()}:${String(engine || "").trim()}:${actorUserId}`;
  const cached = runtimeEngineCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const inflight = runtimeEngineInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    const res = await fetch(
      `/api/runtime/engine?guildId=${encodeURIComponent(guildId)}&engine=${encodeURIComponent(engine)}${actorUserId ? `&userId=${encodeURIComponent(actorUserId)}` : ""}`,
      { cache: "no-store" }
    );
    const json = await readJsonOrThrow(res);
    runtimeEngineCache.set(cacheKey, { value: json, expiresAt: Date.now() + RUNTIME_ENGINE_TTL_MS });
    runtimeEngineInflight.delete(cacheKey);
    return json;
  })().catch((error) => {
    runtimeEngineInflight.delete(cacheKey);
    throw error;
  });

  runtimeEngineInflight.set(cacheKey, request);
  return request;
}

export async function saveRuntimeEngine(guildId: string, engine: string, patch: Record<string, unknown>, userId = "") {
  const actorUserId = resolveViewerUserId(userId);
  const res = await fetch("/api/runtime/engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, patch, userId: actorUserId }),
  });
  const json = await readJsonOrThrow(res);
  const cachePrefix = `${String(guildId || "").trim()}:${String(engine || "").trim()}:`;
  for (const key of runtimeEngineCache.keys()) {
    if (key.startsWith(cachePrefix)) {
      runtimeEngineCache.delete(key);
    }
  }
  return json;
}

export async function validateRuntimeEngine(guildId: string, engine: string, patch: Record<string, unknown>) {
  const actorUserId = resolveViewerUserId();
  const res = await fetch("/api/runtime/engine-validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, patch, userId: actorUserId }),
  });
  return await readJsonOrThrow(res);
}

export async function runRuntimeEngineAction(guildId: string, engine: string, action: string, payload?: Record<string, unknown>, userId = "") {
  const actorUserId = resolveViewerUserId(userId);
  const res = await fetch("/api/runtime/engine-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, action, payload, userId: actorUserId }),
  });
  return await readJsonOrThrow(res);
}

export async function fetchDashboardConfig(guildId: string) {
  const userId = resolveViewerUserId();
  const cacheKey = `${String(guildId || "").trim()}:${userId}`;
  const cached = dashboardConfigCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  const inflight = dashboardConfigInflight.get(cacheKey);
  if (inflight) return inflight;

  const request = (async () => {
    const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}${userId ? `&userId=${encodeURIComponent(userId)}` : ""}`, {
      cache: "no-store",
    });
    const json = await readJsonOrThrow(res);
    const value = json?.config || {};
    dashboardConfigCache.set(cacheKey, { value, expiresAt: Date.now() + DASHBOARD_CONFIG_TTL_MS });
    dashboardConfigInflight.delete(cacheKey);
    return value;
  })().catch((error) => {
    dashboardConfigInflight.delete(cacheKey);
    throw error;
  });

  dashboardConfigInflight.set(cacheKey, request);
  return request;
}

export async function saveDashboardConfig(guildId: string, patch: Record<string, unknown>) {
  const userId = resolveViewerUserId();
  const res = await fetch("/api/bot/dashboard-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, patch, userId }),
  });
  const json = await readJsonOrThrow(res);
  for (const key of dashboardConfigCache.keys()) {
    if (key.startsWith(`${String(guildId || "").trim()}:`)) {
      dashboardConfigCache.delete(key);
    }
  }
  return json;
}
