import type { NextApiRequest, NextApiResponse } from "next";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function h(json = false) {
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (TOKEN) headers["x-dashboard-token"] = TOKEN;
  return headers;
}

async function readJsonSafe(r: Response) {
  const t = await r.text();
  try { return t ? JSON.parse(t) : {}; } catch { return { success: false, error: t || "Invalid JSON" }; }
}

const BLANK_CONFIG = {
  features: {
    coreEnabled: true,
    securityEnabled: true,
    onboardingEnabled: false,
    verificationEnabled: false,
    lockdownEnabled: false,
    raidEnabled: false,
    giveawaysEnabled: false,
    economyEnabled: false,
    heistEnabled: false,
    ticketsEnabled: false,
    pokemonEnabled: false,
    aiEnabled: false,
    ttsEnabled: false
  },
  persona: {
    guildNickname: "",
    webhookName: "",
    webhookAvatarUrl: "",
    useWebhookPersona: false
  },
  security: {
    preOnboarding: {
      enabled: false,
      autoKickOnFail: false,
      kickDelayMinutes: 10,
      minAccountAgeDays: 7,
      bypassRoleIds: [],
      quarantineRoleId: "",
      failMessageTemplate: "",
      logChannelId: ""
    },
    onboarding: {
      enabled: false,
      welcomeChannelId: "",
      welcomeMessageTemplate: "",
      panelBodyTemplate: "",
      rulesChannelId: "",
      dmTemplate: "",
      sendWelcomeDm: false
    },
    verification: {
      enabled: false,
      idTimeoutMinutes: 30,
      roleOnVerifyId: "",
      removeRoleIdsOnVerify: [],
      declineAction: "kick",
      ticketCategoryId: "",
      ticketChannelId: "",
      approverRoleIds: [],
      autoKickOnTimeout: false
    },
    lockdown: {
      enabled: false,
      mentionThreshold: 10,
      linkThreshold: 5,
      actionPreset: "strict",
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    raid: {
      enabled: false,
      joinBurstThreshold: 6,
      windowSeconds: 30,
      actionPreset: "contain",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: false
    }
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Method not allowed" });

  const guildId = String(req.body?.guildId || req.query?.guildId || "").trim();
  if (!/^\d{16,20}$/.test(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });

  try {
    const up = await fetch(`${BOT_API}/dashboard-config`, {
      method: "POST",
      headers: h(true),
      body: JSON.stringify({ guildId, patch: BLANK_CONFIG })
    });
    const data = await readJsonSafe(up);
    return res.status(up.status).json(data);
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "reset failed" });
  }
}
