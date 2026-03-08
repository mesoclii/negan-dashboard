import { NextRequest, NextResponse } from "next/server";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";
import { getGuildSubscriptionStatus } from "@/lib/subscription";
import { DASHBOARD_SESSION_COOKIE, readDashboardSessionValue } from "@/lib/session";
import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

export async function GET(request: NextRequest) {
  try {
    await enforceDashboardRateLimit(request, "subscription_status");
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ success: false, error: "Too many subscription checks. Please retry shortly." }, { status: 429 });
    }
  }

  const guildId = String(request.nextUrl.searchParams.get("guildId") || "").trim();
  if (!guildId) {
    return NextResponse.json({ success: false, error: "guildId is required" }, { status: 400 });
  }

  const session = await readDashboardSessionValue(request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value);
  const actorUserId = String(session?.user?.id || MASTER_OWNER_USER_ID).trim() || MASTER_OWNER_USER_ID;

  try {
    const status = await getGuildSubscriptionStatus(guildId, actorUserId);
    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    void auditDashboardEvent({
      guildId,
      actorUserId,
      actorTag: session?.user?.globalName || session?.user?.username || actorUserId,
      area: "subscriptions",
      action: "status_lookup_failed",
      severity: "error",
      metadata: {
        error: error?.message || "Subscription lookup failed.",
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Subscription lookup failed.",
      },
      { status: 500 }
    );
  }
}
