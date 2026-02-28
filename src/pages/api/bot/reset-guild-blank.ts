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

const BLANK = {
  features: {
    onboardingEnabled: false,
    verificationEnabled: false,
    heistEnabled: false,
    rareDropEnabled: false,
    pokemonEnabled: false,
    aiEnabled: false,
    birthdayEnabled: false,
    economyEnabled: false,
    governanceEnabled: false,
    ttsEnabled: false
  },
  persona: { guildNickname: "", webhookName: "", webhookAvatarUrl: "", useWebhookPersona: false },
  security: {
    preOnboarding: { autoBanOnBlacklistRejoin: false, autoBanOnRefusalRole: false, refusalRoleId: null, enforcementChannelId: null, contactUser: "", banDmTemplate: "" },
    onboarding: {
      welcomeChannelId: null, mainChatChannelId: null, rulesChannelId: null, idChannelId: null, ticketCategoryId: null,
      transcriptChannelId: null, logChannelId: null, verifiedRoleId: null, declineRoleId: null,
      staffRoleIds: [], removeOnVerifyRoleIds: [], idTimeoutMinutes: 30,
      dmTemplate: "", panelTitle: "", panelDescription: "", panelFooter: "", gateAnnouncementTemplate: "",
      idPanelTitle: "", idPanelDescription: "", idPanelContent: "", postVerifyTemplate: ""
    },
    verification: { autoKickOnDecline: false, autoKickOnTimeout: false, declineKickReason: "", timeoutKickReason: "", declineReplyTemplate: "" },
    lockdown: { enabled: false, joinThresholdPerMinute: 10, mentionThresholdPerMinute: 20, autoEscalation: false, exemptRoleIds: [], exemptChannelIds: [] },
    raid: { enabled: false, joinBurstThreshold: 6, windowSeconds: 30, actionPreset: "contain", exemptRoleIds: [], exemptChannelIds: [], autoEscalate: false }
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
      body: JSON.stringify({ guildId, patch: BLANK })
    });
    const data = await readJsonSafe(up);
    return res.status(up.status).json(data);
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "reset failed" });
  }
}
