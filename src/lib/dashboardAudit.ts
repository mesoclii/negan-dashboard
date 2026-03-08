import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { appendAudit } from "@/lib/setupStore";
import { publishDashboardEvent } from "@/lib/dashboardRedis";

type AuditPayload = {
  guildId?: string | null;
  actorUserId?: string | null;
  actorTag?: string | null;
  area: string;
  action: string;
  severity?: "info" | "warn" | "error";
  metadata?: Record<string, unknown> | null;
};

const AUDIT_FILE = path.join(process.cwd(), "data", "setup", "dashboard-audit.ndjson");

function normalizeMetadata(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as Record<string, unknown>;
}

function serializeMetadata(input: unknown) {
  try {
    return JSON.stringify(normalizeMetadata(input));
  } catch {
    return "{}";
  }
}

function parseStoredMetadata(input: unknown) {
  if (typeof input !== "string" || !input.trim()) {
    return normalizeMetadata(input);
  }
  try {
    return normalizeMetadata(JSON.parse(input));
  } catch {
    return {};
  }
}

export async function auditDashboardEvent(payload: AuditPayload) {
  const event = {
    guildId: payload.guildId ? String(payload.guildId) : null,
    actorUserId: payload.actorUserId ? String(payload.actorUserId) : null,
    actorTag: payload.actorTag ? String(payload.actorTag) : null,
    area: String(payload.area || "dashboard").slice(0, 120),
    action: String(payload.action || "unknown").slice(0, 160),
    severity: payload.severity === "warn" || payload.severity === "error" ? payload.severity : "info",
    metadata: normalizeMetadata(payload.metadata),
  };

  appendAudit({
    guildId: event.guildId,
    actorUserId: event.actorUserId,
    actorTag: event.actorTag,
    area: event.area,
    action: event.action,
    severity: event.severity,
    metadata: event.metadata,
  });

  await prisma.dashboardAuditEvent
    .create({
      data: {
        guildId: event.guildId,
        actorUserId: event.actorUserId,
        actorTag: event.actorTag,
        area: event.area,
        action: event.action,
        severity: event.severity,
        metadata: serializeMetadata(event.metadata),
      },
    })
    .catch(() => null);

  await publishDashboardEvent("possum.dashboard.audit", event).catch(() => false);
}

function readLegacyAuditFile(limit: number, guildId = "") {
  if (!fs.existsSync(AUDIT_FILE)) return [];
  try {
    const raw = fs.readFileSync(AUDIT_FILE, "utf8");
    const rows = raw
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const filtered = guildId
      ? rows.filter((entry: any) => String(entry?.guildId || "") === guildId)
      : rows;

    return filtered
      .slice(-limit)
      .reverse()
      .map((entry: any) => ({
        id: String(entry?.id || `${entry?.at || ""}:${entry?.area || ""}:${entry?.action || ""}`),
        guildId: entry?.guildId ? String(entry.guildId) : null,
        actorUserId: entry?.actorUserId ? String(entry.actorUserId) : null,
        actorTag: entry?.actorTag ? String(entry.actorTag) : null,
        area: String(entry?.area || "dashboard"),
        action: String(entry?.action || "unknown"),
        severity: String(entry?.severity || "info"),
        metadata: normalizeMetadata(entry?.metadata),
        createdAt: String(entry?.at || new Date().toISOString()),
        source: "legacy_file",
      }));
  } catch {
    return [];
  }
}

export async function listDashboardAuditEvents(options: { guildId?: string; limit?: number }) {
  const guildId = String(options.guildId || "").trim();
  const limit = Math.max(20, Math.min(500, Number(options.limit || 200)));

  const dbRows = await prisma.dashboardAuditEvent
    .findMany({
      where: guildId ? { guildId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    .catch(() => []);

  if (dbRows.length > 0) {
    return dbRows.map((row) => ({
      id: row.id,
      guildId: row.guildId,
      actorUserId: row.actorUserId,
      actorTag: row.actorTag,
      area: row.area,
      action: row.action,
      severity: row.severity,
      metadata: parseStoredMetadata(row.metadata),
      createdAt: row.createdAt.toISOString(),
      source: "dashboard_db",
    }));
  }

  return readLegacyAuditFile(limit, guildId);
}
