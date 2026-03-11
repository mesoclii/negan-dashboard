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

export async function readJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

export function resolveGuildContext() {
  if (typeof window === "undefined") {
    return { guildId: "", guildName: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const guildId = (params.get("guildId") || localStorage.getItem("activeGuildId") || "").trim();
  const guildName = (localStorage.getItem("activeGuildName") || guildId).trim();

  if (guildId) {
    localStorage.setItem("activeGuildId", guildId);
  }

  return { guildId, guildName };
}

export async function fetchGuildData(guildId: string) {
  const res = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, {
    cache: "no-store",
  });
  const json = await readJsonOrThrow(res);
  const roles = Array.isArray(json?.roles) ? json.roles : [];
  roles.sort((a: GuildRole, b: GuildRole) => (Number(b.position || 0) - Number(a.position || 0)) || a.name.localeCompare(b.name));
  return {
    guild: json?.guild || null,
    channels: Array.isArray(json?.channels) ? json.channels : [],
    roles,
  } as GuildDataPayload;
}

export async function fetchRuntimeEngine(guildId: string, engine: string) {
  const res = await fetch(
    `/api/setup/runtime-engine?guildId=${encodeURIComponent(guildId)}&engine=${encodeURIComponent(engine)}`,
    { cache: "no-store" }
  );
  return await readJsonOrThrow(res);
}

export async function saveRuntimeEngine(guildId: string, engine: string, patch: Record<string, unknown>) {
  const res = await fetch("/api/setup/runtime-engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, patch }),
  });
  return await readJsonOrThrow(res);
}

export async function validateRuntimeEngine(guildId: string, engine: string, patch: Record<string, unknown>) {
  const res = await fetch("/api/setup/runtime-engine-validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, patch }),
  });
  return await readJsonOrThrow(res);
}

export async function runRuntimeEngineAction(guildId: string, engine: string, action: string, payload?: Record<string, unknown>) {
  const res = await fetch("/api/setup/runtime-engine-action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, action, payload }),
  });
  return await readJsonOrThrow(res);
}

export async function fetchDashboardConfig(guildId: string) {
  const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`, {
    cache: "no-store",
  });
  const json = await readJsonOrThrow(res);
  return json?.config || {};
}

export async function saveDashboardConfig(guildId: string, patch: Record<string, unknown>) {
  const res = await fetch("/api/bot/dashboard-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, patch }),
  });
  return await readJsonOrThrow(res);
}
