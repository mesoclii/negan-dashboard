import { NextRequest, NextResponse } from "next/server";
import { buildServerBotApiHeaders, readServerBotApiJson, SERVER_BOT_API } from "@/lib/botApiServer";
import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { readGuildDiscoveryCache, writeGuildDiscoveryCache } from "@/lib/guildDiscoveryCache";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";
import { DASHBOARD_SESSION_COOKIE, readDashboardSessionValue } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    await enforceDashboardRateLimit(request, "guilds_installed");
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ success: false, guilds: [], inviteUrl: null, error: "Too many installed-guild requests. Please retry shortly." }, { status: 429 });
    }
  }

  const session = await readDashboardSessionValue(request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value);
  const actorUserId = String(session?.user?.id || MASTER_OWNER_USER_ID).trim() || MASTER_OWNER_USER_ID;

  try {
    const cached = await readGuildDiscoveryCache<{
      guilds: any[];
      inviteUrl: string | null;
    }>("bot_installed_guilds", actorUserId || "all");

    if (cached) {
      return NextResponse.json({
        success: true,
        guilds: cached.guilds,
        inviteUrl: cached.inviteUrl,
        cached: true,
      });
    }

    const params = new URLSearchParams();
    if (actorUserId) params.set("userId", actorUserId);

    const upstream = await fetch(`${SERVER_BOT_API}/guilds${params.toString() ? `?${params.toString()}` : ""}`, {
      headers: buildServerBotApiHeaders(actorUserId),
      cache: "no-store",
    });

    const data = await readServerBotApiJson(upstream);
    const guilds = Array.isArray(data?.guilds)
      ? data.guilds.map((guild: any) => ({
          id: String(guild?.id || ""),
          name: String(guild?.name || guild?.id || ""),
          icon: guild?.icon || null,
          ownerId: guild?.ownerId || null,
          memberCount: Number(guild?.memberCount || 0),
          accessReason: guild?.accessReason || null,
          botPresent: guild?.botPresent !== false,
        }))
      : [];

    await writeGuildDiscoveryCache(
      "bot_installed_guilds",
      actorUserId || "all",
      {
        guilds,
        inviteUrl: typeof data?.inviteUrl === "string" ? data.inviteUrl : null,
      },
      30
    );

    void auditDashboardEvent({
      guildId: null,
      actorUserId: actorUserId || null,
      actorTag: session?.user?.globalName || session?.user?.username || actorUserId || null,
      area: "guild_discovery",
      action: "load_installed_guilds",
      severity: "info",
      metadata: {
        guildCount: guilds.length,
      },
    });

    return NextResponse.json(
      {
        success: upstream.ok && data?.success !== false,
        guilds,
        inviteUrl: typeof data?.inviteUrl === "string" ? data.inviteUrl : null,
      },
      { status: upstream.ok ? 200 : upstream.status }
    );
  } catch (error: any) {
    void auditDashboardEvent({
      guildId: null,
      actorUserId: actorUserId || null,
      actorTag: session?.user?.globalName || session?.user?.username || actorUserId || null,
      area: "guild_discovery",
      action: "load_installed_guilds_failed",
      severity: "error",
      metadata: {
        error: error?.message || "Failed to load bot-installed guilds.",
      },
    });

    return NextResponse.json(
      {
        success: false,
        guilds: [],
        inviteUrl: null,
        error: error?.message || "Failed to load bot-installed guilds.",
      },
      { status: 500 }
    );
  }
}
