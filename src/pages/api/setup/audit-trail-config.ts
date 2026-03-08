import type { NextApiRequest, NextApiResponse } from "next";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { deepMerge, readStore, writeStore } from "@/lib/setupStore";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";

const FILE = "audit-trail-config.json";

function defaults() {
  return {
    active: true,
    retainDays: 30,
    sensitiveMasking: true,
    exportChannelId: "",
    include: {
      featureToggles: true,
      configSaves: true,
      moderation: true,
      economy: true,
      automation: true,
      ai: true
    }
  };
}

function guildId(req: NextApiRequest) {
  return String(req.query.guildId || req.body?.guildId || "").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const gid = guildId(req);
  if (!gid) return res.status(400).json({ success: false, error: "guildId required" });

  try {
    await enforceDashboardRateLimit(req, "audit_trail_config");
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return res.status(429).json({ success: false, error: "Too many audit-config requests. Please retry shortly." });
    }
  }

  const store = readStore(FILE);
  const current = store[gid] || defaults();

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId: gid, config: current });
  }

  if (req.method === "POST") {
    const patch = req.body?.patch || {};
    const next = deepMerge(current, patch);
    store[gid] = next;
    writeStore(FILE, store);
    void auditDashboardEvent({
      guildId: gid,
      area: "audit-trail-config",
      action: "save",
      metadata: {
        keys: Object.keys(patch || {}),
      },
    });
    return res.status(200).json({ success: true, guildId: gid, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
