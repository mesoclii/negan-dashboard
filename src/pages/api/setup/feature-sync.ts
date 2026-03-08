import type { NextApiRequest, NextApiResponse } from "next";
import { readStore, appendAudit } from "@/lib/setupStore";
import { GAMES_BASELINE_GUILD_ID, PRIMARY_BASELINE_GUILD_ID } from "@/lib/guildPolicy";
import { getRequestOrigin, readActorUserId } from "@/lib/botApi";

type GenericObject = Record<string, unknown>;

function gid(req: NextApiRequest) {
  return String(req.query.guildId || req.body?.guildId || "").trim();
}

function getObj(value: unknown): GenericObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as GenericObject) : {};
}

function pick(file: string, guildId: string, fallback: GenericObject = {}): GenericObject {
  const store = getObj(readStore(file));
  const value = store[guildId];
  return getObj(value) || fallback;
}

function toBool(v: unknown, d = false) {
  return typeof v === "boolean" ? v : d;
}

function getNested(obj: GenericObject, key: string): GenericObject {
  return getObj(obj[key]);
}

const PUBLIC_READY_FEATURES = Object.freeze({
  onboardingEnabled: false,
  verificationEnabled: false,
  heistEnabled: false,
  rareDropEnabled: true,
  pokemonEnabled: false,
  aiEnabled: true,
  ttsEnabled: false,
  birthdayEnabled: true,
  economyEnabled: true,
  governanceEnabled: false,
});

const STANDARD_READY_FEATURES = Object.freeze({
  onboardingEnabled: true,
  verificationEnabled: true,
  heistEnabled: false,
  rareDropEnabled: true,
  pokemonEnabled: false,
  aiEnabled: true,
  ttsEnabled: false,
  birthdayEnabled: true,
  economyEnabled: true,
  governanceEnabled: true,
});

function deriveFeatures(guildId: string) {
  if (guildId && guildId !== PRIMARY_BASELINE_GUILD_ID) {
    return guildId === GAMES_BASELINE_GUILD_ID
      ? { ...PUBLIC_READY_FEATURES }
      : { ...STANDARD_READY_FEATURES };
  }

  const mod = pick("moderator-config.json", guildId, {});
  const wg = pick("welcome-goodbye-config.json", guildId, {});
  const tts = pick("tts-config.json", guildId, {});
  const gov = pick("governance-config.json", guildId, {});
  const games = pick("games-config.json", guildId, {});
  const gives = pick("giveaways-ui-config.json", guildId, {});
  const leaderboard = pick("leaderboard-config.json", guildId, {});
  const prog = pick("progression-config.json", guildId, {});
  const aiPricing = pick("ai-pricing-config.json", guildId, {});
  const aiPersona = pick("ai-personas-config.json", guildId, {});
  const radioBirthday = pick("radio-birthday-config.json", guildId, {});
  const heist = pick("heist-ops-config.json", guildId, {});
  const onboardingFlow = pick("onboarding-flow-config.json", guildId, {});
  const secPolicy = pick("security-policy-config.json", guildId, {});

  const gamesRareDrop = getNested(games, "rareDrop");
  const gamesPokemon = getNested(games, "pokemon");
  const birthday = getNested(radioBirthday, "birthday");

  const onboardingEnabled = toBool(onboardingFlow.onboardingEnabled, toBool(onboardingFlow.active));
  const verificationEnabled = toBool(onboardingFlow.verificationEnabled, false);

  const economyEnabled =
    toBool(gives.active) ||
    toBool(leaderboard.active) ||
    toBool(prog.active) ||
    toBool(birthday.enabled, false);

  const governanceEnabled =
    toBool(gov.active) ||
    toBool(secPolicy.active) ||
    toBool(mod.active) ||
    toBool(wg.active);

  const features = {
    onboardingEnabled,
    verificationEnabled,
    heistEnabled: toBool(heist.active),
    rareDropEnabled: toBool(gamesRareDrop.enabled, false),
    pokemonEnabled: toBool(gamesPokemon.enabled, false),
    aiEnabled: toBool(aiPricing.active) || toBool(aiPersona.active),
    ttsEnabled: toBool(tts.active),
    birthdayEnabled: toBool(birthday.enabled, false),
    economyEnabled,
    governanceEnabled,
  };

  return features;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId = gid(req);
  if (!guildId) return res.status(400).json({ success: false, error: "guildId required" });

  const features = deriveFeatures(guildId);

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId, features });
  }

  if (req.method === "POST") {
    try {
      const origin = getRequestOrigin(req) || process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://127.0.0.1:3000";
      const userId = readActorUserId(req);
      const upstream = await fetch(`${origin}/api/bot/dashboard-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, userId, patch: { features } })
      });
      const data = await upstream.json().catch(() => ({}));

      appendAudit({
        guildId,
        area: "feature-sync",
        action: "apply",
        keys: Object.keys(features)
      });

      return res.status(200).json({
        success: true,
        guildId,
        features,
        upstreamStatus: upstream.status,
        upstream: data
      });
    } catch (err: unknown) {
      return res.status(500).json({ success: false, error: getErrorMessage(err, "sync failed"), guildId, features });
    }
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
