import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { requirePremiumAccess } from "@/lib/premiumGuard";

type HeistOpsConfig = {
  active: boolean;
  signupEnabled: boolean;
  signupChannelId: string;
  announceChannelId: string;
  transcriptChannelId: string;
  hostRoleIds: string[];
  maxPlayers: number;
  reserveSlots: number;
  joinWindowMinutes: number;
  sessionDurationMinutes: number;
  cooldownMinutes: number;
  autoLockOnStart: boolean;
  requireVoiceChannel: boolean;
  voiceChannelId: string;
  payoutEnabled: boolean;
  payoutCoinsWin: number;
  payoutCoinsLose: number;
  streakBonusEnabled: boolean;
  minAccountAgeDays: number;
  mustBeVerified: boolean;
  verifiedRoleId: string;
  blockedRoleIds: string[];
  notes: string;
  updatedAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "setup", "heist-ops-config.json");

function toInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x || "").trim()).filter(Boolean);
  return [];
}

function defaults(): HeistOpsConfig {
  return {
    active: true,
    signupEnabled: true,
    signupChannelId: "",
    announceChannelId: "",
    transcriptChannelId: "",
    hostRoleIds: [],
    maxPlayers: 8,
    reserveSlots: 2,
    joinWindowMinutes: 10,
    sessionDurationMinutes: 45,
    cooldownMinutes: 15,
    autoLockOnStart: true,
    requireVoiceChannel: false,
    voiceChannelId: "",
    payoutEnabled: true,
    payoutCoinsWin: 1000,
    payoutCoinsLose: 250,
    streakBonusEnabled: true,
    minAccountAgeDays: 0,
    mustBeVerified: false,
    verifiedRoleId: "",
    blockedRoleIds: [],
    notes: "",
    updatedAt: "",
  };
}

function ensureDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function readStore(): Record<string, HeistOpsConfig> {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, HeistOpsConfig>) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
  if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

  const store = readStore();
  const current = { ...defaults(), ...(store[guildId] || {}) };

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId, config: current });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const allowed = await requirePremiumAccess(req, res, guildId, "heist");
    if (allowed !== true) return allowed;

    const body = req.body || {};
    const next: HeistOpsConfig = {
      ...current,
      active: Boolean(body.active ?? current.active),
      signupEnabled: Boolean(body.signupEnabled ?? current.signupEnabled),
      signupChannelId: String(body.signupChannelId ?? current.signupChannelId),
      announceChannelId: String(body.announceChannelId ?? current.announceChannelId),
      transcriptChannelId: String(body.transcriptChannelId ?? current.transcriptChannelId),
      hostRoleIds: toArr(body.hostRoleIds ?? current.hostRoleIds),
      maxPlayers: toInt(body.maxPlayers, current.maxPlayers),
      reserveSlots: toInt(body.reserveSlots, current.reserveSlots),
      joinWindowMinutes: toInt(body.joinWindowMinutes, current.joinWindowMinutes),
      sessionDurationMinutes: toInt(body.sessionDurationMinutes, current.sessionDurationMinutes),
      cooldownMinutes: toInt(body.cooldownMinutes, current.cooldownMinutes),
      autoLockOnStart: Boolean(body.autoLockOnStart ?? current.autoLockOnStart),
      requireVoiceChannel: Boolean(body.requireVoiceChannel ?? current.requireVoiceChannel),
      voiceChannelId: String(body.voiceChannelId ?? current.voiceChannelId),
      payoutEnabled: Boolean(body.payoutEnabled ?? current.payoutEnabled),
      payoutCoinsWin: toInt(body.payoutCoinsWin, current.payoutCoinsWin),
      payoutCoinsLose: toInt(body.payoutCoinsLose, current.payoutCoinsLose),
      streakBonusEnabled: Boolean(body.streakBonusEnabled ?? current.streakBonusEnabled),
      minAccountAgeDays: toInt(body.minAccountAgeDays, current.minAccountAgeDays),
      mustBeVerified: Boolean(body.mustBeVerified ?? current.mustBeVerified),
      verifiedRoleId: String(body.verifiedRoleId ?? current.verifiedRoleId),
      blockedRoleIds: toArr(body.blockedRoleIds ?? current.blockedRoleIds),
      notes: String(body.notes ?? current.notes),
      updatedAt: new Date().toISOString(),
    };

    store[guildId] = next;
    writeStore(store);
    return res.status(200).json({ success: true, guildId, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
