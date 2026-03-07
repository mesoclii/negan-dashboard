import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { FALLBACK_GUILD_NAMES } from "@/lib/dashboardOwner";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const params = new URLSearchParams();
    const userId = String(req.query.userId || req.query.uid || "").trim();
    if (userId) params.set("userId", userId);

    const upstream = await fetch(`${BOT_API}/guilds${params.toString() ? `?${params.toString()}` : ""}`, {
      headers: buildBotApiHeaders(req),
      cache: "no-store",
    });

    const data = await readJsonSafe(upstream);
    const incoming = Array.isArray(data?.guilds) ? data.guilds : [];
    const guilds = new Map<string, { id: string; name: string; icon: string | null; botPresent?: boolean }>();

    for (const guild of incoming) {
      const id = String(guild?.id || "").trim();
      if (!id) continue;
      guilds.set(id, {
        id,
        name: String(guild?.name || id),
        icon: guild?.icon || null,
        botPresent: guild?.botPresent !== false,
      });
    }

    for (const [guildId, guildName] of Object.entries(FALLBACK_GUILD_NAMES)) {
      if (!guilds.has(guildId)) {
        guilds.set(guildId, {
          id: guildId,
          name: guildName,
          icon: null,
          botPresent: false,
        });
      }
    }

    return res.status(upstream.ok ? 200 : upstream.status).json({
      success: upstream.ok && data?.success !== false,
      guilds: [...guilds.values()],
      inviteUrl: typeof data?.inviteUrl === "string" ? data.inviteUrl : null,
      error: data?.error || null,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
