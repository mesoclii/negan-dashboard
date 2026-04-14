"use client";

import { useEffect } from "react";
import { fetchGuildData, peekGuildData } from "@/lib/liveRuntime";

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

    const liveRuntimeCached = peekGuildData(guildId);
    const liveRuntimeName = String(liveRuntimeCached?.guild?.name || "").trim();
    if (liveRuntimeName) {
      localStorage.setItem("activeGuildName", liveRuntimeName);
      writeCachedGuildName(guildId, liveRuntimeName);
      return;
    }

    const cachedName = readCachedGuildName(guildId);
    if (cachedName) {
      localStorage.setItem("activeGuildName", cachedName);
      return;
    }

    (async () => {
      try {
        const json = await fetchGuildData(guildId);
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
