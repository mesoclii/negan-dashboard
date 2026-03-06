"use client";

import { useEffect } from "react";

function resolveGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const guildId = String(fromUrl || fromStore).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return guildId;
}

export default function GuildNameBootstrap() {
  useEffect(() => {
    const guildId = resolveGuildId();
    if (!guildId) return;

    (async () => {
      try {
        const res = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const name = String(json?.guild?.name || "").trim();
        if (name) localStorage.setItem("activeGuildName", name);
      } catch {
        // no-op
      }
    })();
  }, []);

  return null;
}
