"use client";

import { useEffect } from "react";

const GUILD_NAME_CACHE_TTL_MS = 15 * 60 * 1000;

function resolveGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const guildId = String(fromUrl || fromStore).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return guildId;
}

function cacheKey(guildId: string) {
  return `dashboard-guild-name:${guildId}`;
}

function readCachedGuildName(guildId: string): string {
  if (typeof window === "undefined" || !guildId) return "";
  try {
    const raw = sessionStorage.getItem(cacheKey(guildId));
    if (!raw) return "";
    const parsed = JSON.parse(raw) as { name?: string; checkedAt?: number };
    const checkedAt = Number(parsed?.checkedAt || 0);
    if (!parsed?.name || Date.now() - checkedAt > GUILD_NAME_CACHE_TTL_MS) {
      sessionStorage.removeItem(cacheKey(guildId));
      return "";
    }
    return String(parsed.name || "").trim();
  } catch {
    return "";
  }
}

function writeCachedGuildName(guildId: string, name: string) {
  if (typeof window === "undefined" || !guildId || !name) return;
  try {
    sessionStorage.setItem(
      cacheKey(guildId),
      JSON.stringify({ name, checkedAt: Date.now() })
    );
  } catch {
    // Ignore storage errors.
  }
}

export default function GuildNameBootstrap() {
  useEffect(() => {
    const guildId = resolveGuildId();
    if (!guildId) return;

    const cachedName = readCachedGuildName(guildId);
    if (cachedName) {
      localStorage.setItem("activeGuildName", cachedName);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const name = String(json?.guild?.name || "").trim();
        if (name) {
          localStorage.setItem("activeGuildName", name);
          writeCachedGuildName(guildId, name);
        }
      } catch {
        // no-op
      }
    })();
  }, []);

  return null;
}
