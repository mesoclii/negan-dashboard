import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function parseGuildIds(): string[] {
  const raw =
    process.env.DASHBOARD_GUILD_IDS ||
    process.env.GUILD_IDS ||
    process.env.PRIMARY_GUILD_ID ||
    "";

  const ids = String(raw)
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^\d{16,20}$/.test(v));

  return [...new Set(ids)];
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildIds = parseGuildIds();
    if (!guildIds.length) {
      return res.status(200).json({ success: true, guilds: [], unavailable: [] });
    }

    const guilds: Array<{ id: string; name: string; icon: string | null }> = [];
    const unavailable: Array<{ guildId: string; status: number }> = [];

    for (const guildId of guildIds) {
      try {
        const r = await fetch(
          `${BOT_API}/guild-data?guildId=${encodeURIComponent(guildId)}`,
          { headers: { "x-dashboard-token": DASHBOARD_TOKEN } }
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
