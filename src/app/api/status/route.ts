import { NextRequest, NextResponse } from "next/server";
import { isDashboardControlOwner } from "@/lib/dashboardOwner";
import { DASHBOARD_SESSION_COOKIE, readDashboardSessionValue } from "@/lib/session";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { readPublicStatus, writePublicStatus } from "@/lib/publicStatusStore";

function isMasterOwner(userId: string) {
  return isDashboardControlOwner(userId);
}

export async function GET() {
  return NextResponse.json({
    success: true,
    status: readPublicStatus(),
  });
}

export async function POST(request: NextRequest) {
  const session = await readDashboardSessionValue(request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value);
  const actorUserId = String(session?.user?.id || "").trim();
  if (!isMasterOwner(actorUserId)) {
    return NextResponse.json({ success: false, error: "Only the master owner can update public system status." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const next = writePublicStatus({
    overall: body?.overall,
    headline: body?.headline,
    message: body?.message,
    services: Array.isArray(body?.services) ? body.services : undefined,
  });

  void auditDashboardEvent({
    guildId: null,
    actorUserId,
    actorTag: session?.user?.globalName || session?.user?.username || actorUserId,
    area: "public_status",
    action: "update",
    severity: "info",
    metadata: {
      overall: next.overall,
      serviceCount: next.services.length,
    },
  });

  return NextResponse.json({
    success: true,
    status: next,
  });
}
