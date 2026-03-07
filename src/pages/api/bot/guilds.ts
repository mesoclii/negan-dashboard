import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders } from "@/lib/botApi";
import { parseDashboardGuildIds } from "@/lib/guildPolicy";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildIds = parseDashboardGuildIds();
    if (!guildIds.length) {
      return res.status(200).json({ success: true, guilds: [], unavailable: [] });
    }

    const guilds: Array<{ id: string; name: string; icon: string | null }> = [];
    const unavailable: Array<{ guildId: string; status: number }> = [];

    for (const guildId of guildIds) {
      try {
        const r = await fetch(
          `${BOT_API}/guild-data?guildId=${encodeURIComponent(guildId)}`,
          { headers: buildBotApiHeaders(req), cache: "no-store" }
        );

        if (!r.ok) {
          unavailable.push({ guildId, status: r.status });
          continue;
        }

        const data = await r.json();
        if (data?.guild?.id) {
          guilds.push({
            id: data.guild.id,
            name: data.guild.name || guildId,
            icon: data.guild.icon || null
          });
        } else {
          unavailable.push({ guildId, status: 502 });
        }
      } catch {
        unavailable.push({ guildId, status: 0 });
      }
    }

    const uniq = new Map<string, { id: string; name: string; icon: string | null }>();
    for (const g of guilds) uniq.set(g.id, g);

    return res.status(200).json({
      success: true,
      guilds: [...uniq.values()],
      unavailable
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
