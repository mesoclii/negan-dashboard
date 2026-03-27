"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { buildDashboardHref, readDashboardGuildId, readDashboardUserId } from "@/lib/dashboardContext";
import { SAVIORS_GUILD_ID } from "@/lib/dashboard/engineRegistry";
import { useDashboardSessionState } from "@/components/possum/useDashboardSessionState";
import { isPremiumEnforcementEnabled } from "@/lib/premiumMode";

type ToggleController = {
  read: (guildId: string, userId?: string) => Promise<boolean>;
  write: (guildId: string, next: boolean, userId?: string) => Promise<void>;
};

type Card = {
  href: string;
  title: string;
  description: string;
  toggle?: ToggleController;
  goOnly?: boolean;
  goLabel?: string;
  premiumRequired?: boolean;
  creatorOnly?: boolean;
  routeKey?: string;
  state?: ToggleState;
};

type ToggleState = {
  value: boolean | null;
  saving: boolean;
  error?: string;
};

type DashboardSection =
  | "Guild Control"
  | "Automation"
  | "Utilities"
  | "Social Alerts"
  | "Security"
  | "Economy"
  | "Fun + Games"
  | "Premium";

const SECTION_ORDER: DashboardSection[] = [
  "Guild Control",
  "Automation",
  "Utilities",
  "Social Alerts",
  "Security",
  "Economy",
  "Fun + Games",
  "Premium",
];

function readBoolPath(input: unknown, path: string[], fallback = false): boolean {
  let current: any = input;
  for (const key of path) {
    if (!current || typeof current !== "object") return fallback;
    current = current[key];
  }
  return typeof current === "boolean" ? current : fallback;
}

function buildPatch(path: string[], value: boolean) {
  const root: Record<string, any> = {};
  let current: Record<string, any> = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    current[path[index]] = {};
    current = current[path[index]];
  }
  current[path[path.length - 1]] = value;
  return root;
}

async function readJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

const DASHBOARD_CONFIG_TTL_MS = 60_000;
const ENGINE_CONFIG_TTL_MS = 30_000;

const dashboardConfigCache = new Map<string, { value: any; expiresAt: number }>();
const engineConfigCache = new Map<string, { value: any; expiresAt: number }>();
const dashboardConfigInflight = new Map<string, Promise<any>>();
const engineConfigInflight = new Map<string, Promise<any>>();

async function getDashboardConfig(guildId: string, userId = "") {
  const actorUserId = String(userId || "").trim();
  const cacheKey = `${String(guildId || "").trim()}:${actorUserId}`;
  const cached = dashboardConfigCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  if (dashboardConfigInflight.has(cacheKey)) {
    return dashboardConfigInflight.get(cacheKey);
  }
  const request = (async () => {
    const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}${actorUserId ? `&userId=${encodeURIComponent(actorUserId)}` : ""}`, { cache: "no-store" });
    const json = await readJsonOrThrow(res);
    const value = json?.config || {};
    dashboardConfigCache.set(cacheKey, { value, expiresAt: Date.now() + DASHBOARD_CONFIG_TTL_MS });
    dashboardConfigInflight.delete(cacheKey);
    return value;
  })().catch((error) => {
    dashboardConfigInflight.delete(cacheKey);
    throw error;
  });
  dashboardConfigInflight.set(cacheKey, request);
  return request;
}

async function saveDashboardFeature(guildId: string, key: string, value: boolean, userId = "") {
  const res = await fetch("/api/bot/dashboard-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, patch: { features: { [key]: value } }, userId }),
  });
  await readJsonOrThrow(res);
  for (const cacheKey of dashboardConfigCache.keys()) {
    if (cacheKey.startsWith(`${String(guildId || "").trim()}:`)) {
      dashboardConfigCache.delete(cacheKey);
    }
  }
}

async function getEngineConfig(guildId: string, engine: string, userId = "") {
  const actorUserId = String(userId || "").trim();
  const cacheKey = `${String(guildId || "").trim()}:${String(engine || "").trim()}:${actorUserId}`;
  const cached = engineConfigCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
  if (engineConfigInflight.has(cacheKey)) {
    return engineConfigInflight.get(cacheKey);
  }
  const request = (async () => {
    const res = await fetch(
      `/api/runtime/engine?guildId=${encodeURIComponent(guildId)}&engine=${encodeURIComponent(engine)}${actorUserId ? `&userId=${encodeURIComponent(actorUserId)}` : ""}`,
      { cache: "no-store" }
    );
    const json = await readJsonOrThrow(res);
    const value = json?.config || {};
    engineConfigCache.set(cacheKey, { value, expiresAt: Date.now() + ENGINE_CONFIG_TTL_MS });
    engineConfigInflight.delete(cacheKey);
    return value;
  })().catch((error) => {
    engineConfigInflight.delete(cacheKey);
    throw error;
  });
  engineConfigInflight.set(cacheKey, request);
  return request;
}

async function saveEngineConfig(guildId: string, engine: string, patch: Record<string, unknown>, userId = "") {
  const res = await fetch("/api/runtime/engine", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, patch, userId }),
  });
  await readJsonOrThrow(res);
  const prefix = `${String(guildId || "").trim()}:${String(engine || "").trim()}:`;
  for (const cacheKey of engineConfigCache.keys()) {
    if (cacheKey.startsWith(prefix)) {
      engineConfigCache.delete(cacheKey);
    }
  }
}

function featureController(key: string): ToggleController {
  return {
    async read(guildId, userId) {
      const config = await getDashboardConfig(guildId, userId);
      return readBoolPath(config, ["features", key], false);
    },
    async write(guildId, next, userId) {
      await saveDashboardFeature(guildId, key, next, userId);
    },
  };
}

function engineController(engine: string, fieldPath: string[] = ["enabled"]): ToggleController {
  return {
    async read(guildId, userId) {
      const config = await getEngineConfig(guildId, engine, userId);
      return readBoolPath(config, fieldPath, false);
    },
    async write(guildId, next, userId) {
      const current = await getEngineConfig(guildId, engine, userId);
      const patch = buildPatch(fieldPath, next);
      if (
        fieldPath.length === 1 &&
        (fieldPath[0] === "active" || fieldPath[0] === "enabled") &&
        typeof current?.active === "boolean" &&
        typeof current?.enabled === "boolean"
      ) {
        patch.active = next;
        patch.enabled = next;
      }
      await saveEngineConfig(guildId, engine, patch, userId);
    },
  };
}

function getCardSection(card: Card): DashboardSection {
  const href = card.href.split("?")[0].split("#")[0];
  if (
    href === "/dashboard/bot-personalizer" ||
    href === "/dashboard/bot-masters" ||
    href === "/dashboard/channels" ||
    href === "/dashboard/ai/learning" ||
    href === "/dashboard/giveaways" ||
    href === "/dashboard/jed" ||
    href === "/dashboard/music" ||
    href === "/dashboard/vip" ||
    href === "/dashboard/tickets" ||
    href === "/dashboard/selfroles"
  ) {
    return "Guild Control";
  }
  if (
    href === "/dashboard/automations/studio" ||
    href === "/dashboard/commands" ||
    href === "/dashboard/slash-commands" ||
    href === "/dashboard/event-reactor" ||
    href === "/dashboard/runtime-router"
  ) {
    return "Automation";
  }
  if (
    href === "/dashboard/utilities" ||
    href === "/dashboard/reviews" ||
    href === "/dashboard/community-studio" ||
    href === "/dashboard/channel-flow"
  ) {
    return "Utilities";
  }
  if (
    href === "/dashboard/social-alerts" ||
    href === "/dashboard/signal-relay"
  ) {
    return "Social Alerts";
  }
  if (
    href === "/dashboard/security" ||
    href === "/dashboard/governance" ||
    href === "/dashboard/security-enforcer" ||
    href === "/dashboard/moderator" ||
    href === "/dashboard/blacklist" ||
    href === "/dashboard/failsafe"
  ) {
    return "Security";
  }
  if (
    href === "/dashboard/premium-features" ||
    href === "/dashboard/heist" ||
    href === "/dashboard/tts" ||
    href === "/dashboard/ai/persona" ||
    href === "/dashboard/ai/openai-platform"
  ) {
    return "Premium";
  }
  if (
    href === "/dashboard/economy" ||
    href.startsWith("/dashboard/economy/") ||
    href === "/dashboard/prestige" ||
    href === "/dashboard/profile" ||
    href === "/dashboard/halloffame" ||
    href === "/dashboard/achievements" ||
    href === "/dashboard/loyalty"
  ) {
    return "Economy";
  }
  if (
    href === "/dashboard/games" ||
    href === "/dashboard/crew" ||
    href === "/dashboard/dominion" ||
    href === "/dashboard/contracts" ||
    href === "/dashboard/catdrop" ||
    href === "/dashboard/rarespawn" ||
    href === "/dashboard/range" ||
    href === "/dashboard/truthdare" ||
    href.startsWith("/dashboard/pokemon-")
  ) {
    return "Fun + Games";
  }
  return "Guild Control";
}

const birthdayController: ToggleController = {
  async read(guildId, userId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId, userId),
      getEngineConfig(guildId, "radio", userId),
    ]);
    return readBoolPath(dashboardConfig, ["features", "birthdayEnabled"], false) && readBoolPath(engineConfig, ["birthday", "enabled"], false);
  },
  async write(guildId, next, userId) {
    await saveDashboardFeature(guildId, "birthdayEnabled", next, userId);
    await saveEngineConfig(guildId, "radio", { birthday: { enabled: next } }, userId);
  },
};

const rareSpawnController: ToggleController = {
  async read(guildId, userId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId, userId),
      getEngineConfig(guildId, "rareSpawn", userId),
    ]);
    return readBoolPath(dashboardConfig, ["features", "rareDropEnabled"], false) && readBoolPath(engineConfig, ["enabled"], false);
  },
  async write(guildId, next, userId) {
    await Promise.all([
      saveDashboardFeature(guildId, "rareDropEnabled", next, userId),
      saveEngineConfig(guildId, "rareSpawn", { enabled: next }, userId),
    ]);
  },
};

const musicController: ToggleController = {
  async read(guildId, userId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId, userId),
      getEngineConfig(guildId, "music", userId),
    ]);
    return readBoolPath(dashboardConfig, ["features", "musicEnabled"], false) && readBoolPath(engineConfig, ["enabled"], false);
  },
  async write(guildId, next, userId) {
    await Promise.all([
      saveDashboardFeature(guildId, "musicEnabled", next, userId),
      saveEngineConfig(guildId, "music", { enabled: next }, userId),
    ]);
  },
};

const pokemonCatchingController: ToggleController = {
  async read(guildId, userId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId, userId),
      getEngineConfig(guildId, "pokemon", userId),
    ]);
    return readBoolPath(dashboardConfig, ["features", "pokemonEnabled"], false) && readBoolPath(engineConfig, ["enabled"], false);
  },
  async write(guildId, next, userId) {
    await Promise.all([
      saveDashboardFeature(guildId, "pokemonEnabled", next, userId),
      saveEngineConfig(guildId, "pokemon", { enabled: next }, userId),
    ]);
  },
};

const pokemonBattleController: ToggleController = {
  async read(guildId, userId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId, userId),
      getEngineConfig(guildId, "pokemon", userId),
    ]);
    return readBoolPath(dashboardConfig, ["features", "pokemonEnabled"], false) && readBoolPath(engineConfig, ["battleEnabled"], false);
  },
  async write(guildId, next, userId) {
    if (next) {
      await saveDashboardFeature(guildId, "pokemonEnabled", true, userId);
    }
    await saveEngineConfig(guildId, "pokemon", { battleEnabled: next }, userId);
  },
};

const pokemonTradeController: ToggleController = {
  async read(guildId, userId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId, userId),
      getEngineConfig(guildId, "pokemon", userId),
    ]);
    return readBoolPath(dashboardConfig, ["features", "pokemonEnabled"], false) && readBoolPath(engineConfig, ["tradingEnabled"], false);
  },
  async write(guildId, next, userId) {
    if (next) {
      await saveDashboardFeature(guildId, "pokemonEnabled", true, userId);
    }
    await saveEngineConfig(guildId, "pokemon", { tradingEnabled: next }, userId);
  },
};

const CARDS: Card[] = [
  { href: "/dashboard/bot-personalizer", title: "Bot Personalizer", description: "Per-guild Possum AI naming, avatar, activity, and webhook identity.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/bot-masters", title: "Bot Masters", description: "Set which guild roles and users can manage the dashboard.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/channels", title: "Channels", description: "Centralized channel routing for engines that rely on per-guild channel setup.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/ai/learning", title: "Possum AI", description: "Homemade adaptive AI, bot knowledge base, learning writes, and synthesis runtime.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/giveaways", title: "Giveaways", description: "Giveaway lifecycle, entrants, rerolls, and controls.", toggle: engineController("giveaways", ["active"]) },
  { href: "/dashboard/jed", title: "Jed", description: "Sticker/emote/gif steal and deploy engine.", toggle: engineController("jed") },
  { href: "/dashboard/music", title: "Music", description: "Always-free multi-route music playback, route binding, and live queue control.", toggle: musicController },
  { href: "/dashboard/vip", title: "VIP", description: "VIP tiers, grants, and expiry sync.", toggle: engineController("vip", ["active"]) },
  { href: "/dashboard/tickets", title: "Tickets", description: "Support ticket engine controls.", toggle: engineController("tickets", ["active"]) },
  { href: "/dashboard/selfroles", title: "Self Roles", description: "Self-role panel configuration and role mapping.", toggle: engineController("selfroles", ["active"]) },
  { href: "/dashboard/automations/studio", title: "Automation Studio", description: "Visual trigger/condition/action flow builder.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/commands", title: "!Command Studio", description: "Custom bang-command engine and editor.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/slash-commands", title: "Slash Commands", description: "Native built-in slash command master per guild.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/event-reactor", title: "Event Alerts", description: "Choose what Discord activity to watch, where failed jobs go, and any extra alert posts.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/runtime-router", title: "AI Talking Rules", description: "Simple split between free Possum AI replies and optional Persona AI channels.", toggle: engineController("runtimeRouter", ["adaptiveAiEnabled"]) },
  { href: "/dashboard/utilities", title: "Utilities", description: "Card-based utility overview for Jed, help, polls, reminders, embeds, counters, and temp channels.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/reviews", title: "Reviews", description: "Review panel deploy, star voting, and written feedback cards.", toggle: engineController("reviews", ["enabled"]) },
  { href: "/dashboard/community-studio", title: "Community Studio", description: "Bulletin drops, pulse polls, reminder loops, and lookup shelf answers.", toggle: engineController("communityStudio", ["active"]) },
  { href: "/dashboard/channel-flow", title: "Channel Flow", description: "Live counter channels and room-flow temporary voice spaces.", toggle: engineController("channelFlow", ["active"]) },
  { href: "/dashboard/search-anything", title: "Search Anything", description: "Guild-level search routes for web, video, wiki, meme, anime, and creator lookups.", toggle: engineController("searchAnything", ["enabled"]) },
  { href: "/dashboard/social-alerts", title: "Social Alerts", description: "Provider cards for RSS, podcast, YouTube, Twitch, TikTok, X, Bluesky, Reddit, Instagram, and Kick.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/signal-relay", title: "Signal Relay", description: "Provider-aware creator and community dispatches with bridge routes, direct feeds, and live checks.", toggle: engineController("signalRelay", ["active"]) },
  { href: "/dashboard/moderator", title: "Moderator", description: "Separate automod, audit logging, and moderation controls.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/security/pre-onboarding", title: "Pre-Onboarding", description: "Blacklist rejoin, refusal-role, and pre-entry enforcement before onboarding begins.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/security/onboarding", title: "Onboarding", description: "Join flow, welcome routing, and onboarding channel behavior.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/security/verification", title: "Verification", description: "Verification decisions, timeout behavior, and follow-up staff controls.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/economy/leaderboard", title: "Invite Tracker", description: "Invite tracking tiers, recruiter thresholds, and leaderboard behavior.", toggle: engineController("inviteTracker") },
  { href: "/dashboard/economy", title: "Economy", description: "Economy baseline and related systems.", toggle: featureController("economyEnabled") },
  { href: "/dashboard/economy/store", title: "Store", description: "Catalog, prices, stock, and role grants.", toggle: engineController("store", ["active"]) },
  { href: "/dashboard/economy/progression", title: "Progression", description: "XP intake, level formulas, reward ladders, and progression multipliers.", toggle: engineController("progression", ["active"]) },
  { href: "/dashboard/prestige", title: "Prestige", description: "Capstone reset loop, role rewards, and long-tail prestige elevation.", toggle: engineController("prestige") },
  { href: "/dashboard/economy/radio-birthday", title: "Birthdays", description: "Birthday engine settings and reward flow.", toggle: birthdayController },
  { href: "/dashboard/profile", title: "Profile", description: "Profile display, rank surfaces, and stat aggregation controls.", toggle: engineController("profile") },
  { href: "/dashboard/halloffame", title: "Hall of Fame", description: "Recognition layer for top achievers and prestige-ready members.", toggle: engineController("hallOfFame") },
  { href: "/dashboard/achievements", title: "Achievements", description: "Milestone grant rules, badge sync, and achievement reward logic.", toggle: engineController("achievements", ["active"]) },
  { href: "/dashboard/loyalty", title: "Loyalty", description: "Retention timing, tenure rewards, and VIP-adjacent loyalty benefits.", toggle: engineController("loyalty", ["active"]) },
  { href: "/dashboard/games", title: "Games", description: "Live games hub across Pokemon, GTA crew systems, and spawn-driven engines.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/crew", title: "Crew", description: "Crew create/join/leave/vault controls.", toggle: engineController("crew") },
  { href: "/dashboard/dominion", title: "Dominion", description: "Dominion raid/alliance/war settings.", toggle: engineController("dominion") },
  { href: "/dashboard/contracts", title: "Contracts", description: "Objective progression, task tracking, and contract reward flow.", toggle: engineController("contracts") },
  { href: "/dashboard/catdrop", title: "Cat Drop", description: "Cat spawn/catch and drop tuning.", toggle: engineController("catDrop") },
  { href: "/dashboard/rarespawn", title: "Rare Spawn", description: "Rare event spawn/claim settings.", toggle: rareSpawnController },
  { href: "/dashboard/range", title: "Range", description: "Range game interactions and limits.", toggle: engineController("range") },
  { href: "/dashboard/truthdare", title: "Truth Or Dare", description: "Truth/Dare prompts, channel locks, and bet controls.", toggle: engineController("truthDare") },
  { href: "/dashboard/pokemon-catching", title: "Pokemon Catching", description: "Wild spawn lanes, catch rates, reward tuning, and catch logs.", toggle: pokemonCatchingController },
  { href: "/dashboard/pokemon-battle", title: "Pokemon Battle", description: "Battle lane, battle logging, and duel availability.", toggle: pokemonBattleController },
  { href: "/dashboard/pokemon-trade", title: "Pokemon Trade", description: "Trade gate and trade log routing.", toggle: pokemonTradeController },
  { href: "/dashboard/governance", title: "Governance", description: "Governance state and enforcement controls.", toggle: engineController("security.governance", ["active"]) },
  { href: "/dashboard/security", title: "Security", description: "Security stack, moderation, and policies.", toggle: engineController("security.governance", ["active"]) },
  { href: "/dashboard/blacklist", title: "Blacklist", description: "Blacklist add/remove/show control.", toggle: engineController("blacklist") },
  { href: "/dashboard/failsafe", title: "Failsafe", description: "Emergency pause and safety switches.", toggle: engineController("failsafe") },
  { href: "/dashboard/system-health", title: "System Health", description: "Runtime monitor, drift and health checks.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/premium-features", title: "Premium Features", description: "Plan state, paid add-ons, and owner trial controls.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/heist", title: "Heist", description: "Heist signup engine controls.", toggle: engineController("heist", ["active"]), premiumRequired: true },
  { href: "/dashboard/tts", title: "TTS", description: "Voice route and TTS runtime control.", toggle: engineController("tts", ["enabled"]), premiumRequired: true },
  { href: "/dashboard/ai/persona", title: "Persona AI", description: "Hosted persona runtime, photos, triggers, and roster controls.", goOnly: true, goLabel: "Go", premiumRequired: true },
  { href: "/dashboard/premium-features#advanced-security", title: "Advanced Security Suite", description: "Threat intel, drift, trust weighting, escalation, and containment premium layer.", goOnly: true, goLabel: "Go", premiumRequired: true },
  { href: "/dashboard/premium-features#automation-suite", title: "Automation + Commands Suite", description: "Advanced automation depth and elevated custom-command scale for premium guilds.", goOnly: true, goLabel: "Go", premiumRequired: true },
  { href: "/dashboard/ai/openai-platform", title: "Creator AI Platform", description: "Internal provider/model controls reserved for bot creators.", goOnly: true, goLabel: "Go", premiumRequired: true, creatorOnly: true },
];

function pillClass(on: boolean | null) {
  if (on === null) {
    return "rounded-full border border-red-600/40 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-red-200/70";
  }
  return on
    ? "rounded-full border border-emerald-500/50 bg-emerald-950/40 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-emerald-300"
    : "rounded-full border border-red-600/50 bg-red-950/40 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-red-300";
}

export default function DashboardClient() {
  const premiumEnforced = isPremiumEnforcementEnabled();
  const [guildId, setGuildId] = useState("");
  const [viewerUserId, setViewerUserId] = useState("");
  const [states, setStates] = useState<Record<string, ToggleState>>({});
  const [loadingStates, setLoadingStates] = useState(false);
  const [subscription, setSubscription] = useState<{ active: boolean; plan: string; developerBypass?: boolean } | null>(null);
  const { isMasterOwner } = useDashboardSessionState();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastGuildId = "";
    let lastUserId = "";
    const syncContext = () => {
      const nextGuildId = readDashboardGuildId();
      const nextUserId = readDashboardUserId();
      if (nextGuildId === lastGuildId && nextUserId === lastUserId) return;
      lastGuildId = nextGuildId;
      lastUserId = nextUserId;
      setGuildId(nextGuildId);
      setViewerUserId(nextUserId);
    };
    syncContext();
    const interval = window.setInterval(syncContext, 1200);
    window.addEventListener("popstate", syncContext);
    window.addEventListener("storage", syncContext);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("popstate", syncContext);
      window.removeEventListener("storage", syncContext);
    };
  }, []);

  const loadStates = useCallback(async (targetGuildId: string) => {
    if (!targetGuildId) return;
    setLoadingStates(true);
    const nextStates: Record<string, ToggleState> = {};
    await Promise.all(
      CARDS.map(async (card) => {
        if (!card.toggle) return;
        try {
          const value = await card.toggle.read(targetGuildId, viewerUserId);
          nextStates[card.href] = { value, saving: false };
        } catch (err: any) {
          nextStates[card.href] = {
            value: null,
            saving: false,
            error: err?.message || "Failed to load toggle.",
          };
        }
      })
    );
    setStates(nextStates);
    setLoadingStates(false);
  }, [viewerUserId]);

  useEffect(() => {
    loadStates(guildId).catch(() => {});
  }, [guildId, loadStates, viewerUserId]);

  useEffect(() => {
    if (!premiumEnforced) {
      setSubscription({ active: true, plan: "UNLOCKED", developerBypass: true });
      return;
    }
    if (!guildId) {
      setSubscription(null);
      return;
    }
    (async () => {
      const res = await fetch(`/api/subscriptions/status?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }).catch(() => null);
      const json = await res?.json().catch(() => ({}));
      if (!res || !res.ok || json?.success === false) {
        setSubscription({ active: false, plan: "FREE", developerBypass: false });
        return;
      }
      setSubscription({
        active: Boolean(json?.status?.active),
        plan: String(json?.status?.plan || "FREE"),
        developerBypass: Boolean(json?.status?.developerBypass),
      });
    })();
  }, [guildId, premiumEnforced]);

  async function toggleCard(card: Card) {
    if (!guildId || !card.toggle || !card.routeKey) return;
    const premiumUnlocked = !premiumEnforced || Boolean(subscription?.active || subscription?.developerBypass);
    if (card.premiumRequired && !premiumUnlocked) return;
    const current = states[card.routeKey]?.value ?? false;
    const next = !current;
    setStates((prev) => ({
      ...prev,
      [card.routeKey as string]: { ...(prev[card.routeKey as string] || { value: current }), value: next, saving: true, error: "" },
    }));

    try {
      await card.toggle.write(guildId, next, viewerUserId);
      await loadStates(guildId);
    } catch (err: any) {
      setStates((prev) => ({
        ...prev,
        [card.routeKey as string]: {
          ...(prev[card.routeKey as string] || { value: current }),
          value: current,
          saving: false,
          error: err?.message || "Toggle failed.",
        },
      }));
    }
  }

  const cards = useMemo(
    () =>
      CARDS.map((card) => ({
        ...card,
        routeKey: card.href,
        href: buildDashboardHref(card.href),
        state: states[card.href] || { value: null, saving: false },
      })).filter((card) => !card.creatorOnly || isMasterOwner),
    [isMasterOwner, states]
  );

  const quickAccessCards = useMemo(
    () => cards.filter((card) => card.routeKey === "/dashboard/system-health"),
    [cards]
  );

  const premiumUnlocked = !premiumEnforced || Boolean(subscription?.active || subscription?.developerBypass);
  const groupedCards = useMemo(
    () =>
      SECTION_ORDER.map((section) => ({
        section,
        cards: cards.filter((card) => card.routeKey !== "/dashboard/system-health" && getCardSection(card) === section),
      })).filter((group) => group.cards.length > 0),
    [cards]
  );

  return (
    <section className="space-y-5">
      <header className="rounded-xl border possum-divider bg-black/50 p-5 possum-border">
        <p className="text-xs uppercase tracking-[0.22em] possum-soft">Possum Control</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] possum-red possum-glow">Guild Dashboard</h2>
        <p className="mt-2 text-sm text-red-200/80">
          {guildId === SAVIORS_GUILD_ID
            ? "Saviors baseline stays intact until you explicitly toggle something."
            : "Cards are grouped by live engine category. Use toggles here to turn engines on or off for the active guild without leaving the dashboard. Studio/editor pages open directly with Go."}
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-red-300/70">
          Premium access: {!premiumEnforced ? "Disabled - all guilds currently run unlocked" : subscription?.developerBypass ? "Developer Override" : subscription?.plan || "Free"}
        </p>
      </header>

      {quickAccessCards.length ? (
        <section className="space-y-3">
          <header className="rounded-xl border possum-divider bg-black/45 p-4 possum-border">
            <p className="text-xs uppercase tracking-[0.22em] possum-soft">Quick Access</p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-[0.08em] possum-red">System Health</h3>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickAccessCards.map((card) => (
              <div
                key={card.href}
                className="rounded-xl border possum-divider bg-black/45 p-4 transition hover:bg-black/65 possum-border"
              >
                <div className="flex items-start justify-between gap-3">
                  <Link href={buildDashboardHref(card.href)} className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold uppercase tracking-[0.06em] possum-red">{card.title}</h3>
                    <p className="mt-1 text-sm text-red-200/75">{card.description}</p>
                  </Link>
                  <Link
                    href={buildDashboardHref(card.href)}
                    className="rounded-lg border border-red-600/60 bg-black/50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-red-200"
                  >
                    {card.goLabel || "Go"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-4">
        {groupedCards.map((group) => (
          <section key={group.section} className="space-y-3">
            <header className="rounded-xl border possum-divider bg-black/45 p-4 possum-border">
              <p className="text-xs uppercase tracking-[0.22em] possum-soft">{group.section}</p>
              <h3 className="mt-1 text-xl font-black uppercase tracking-[0.08em] possum-red">{group.section}</h3>
            </header>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.cards.map((card) => {
                const state = card.state;
                const toggleBusy = state.saving || loadingStates;
                const statusLabel = state.value === null ? "..." : state.value ? "ON" : "OFF";
                const lockedPremium = Boolean(premiumEnforced && card.premiumRequired && !premiumUnlocked);

                return (
                  <div
                    key={card.href}
                    className="rounded-xl border possum-divider bg-black/45 p-4 transition hover:bg-black/65 possum-border"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <Link href={buildDashboardHref(card.href)} className="min-w-0 flex-1">
                        <h3 className="text-base font-extrabold uppercase tracking-[0.06em] possum-red">{card.title}</h3>
                        <p className="mt-1 text-sm text-red-200/75">{card.description}</p>
                      </Link>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {card.goOnly ? (
                          <>
                            <span className={lockedPremium ? "rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-amber-300" : "rounded-full border border-red-600/40 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-red-200/75"}>
                              {lockedPremium ? "Premium" : "Editor"}
                            </span>
                            <Link
                              href={buildDashboardHref(card.href)}
                              className="rounded-lg border border-red-600/60 bg-black/50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-red-200"
                            >
                              {card.goLabel || "Go"}
                            </Link>
                          </>
                        ) : (
                          <>
                            <span className={pillClass(state.value)}>{statusLabel}</span>
                            <button
                              type="button"
                              onClick={() => toggleCard(card)}
                              disabled={!guildId || !card.toggle || toggleBusy || lockedPremium}
                              className="rounded-lg border border-red-600/60 bg-black/50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {toggleBusy ? "Saving" : lockedPremium ? "Premium" : state.value ? "Turn Off" : "Turn On"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {card.premiumRequired ? (
                      <p className="mt-2 text-xs text-amber-300/85">
                        {!premiumEnforced ? "Premium enforcement is currently off, so this stays unlocked for all guilds." : premiumUnlocked ? "Premium-unlocked for this guild." : "Premium feature. Unlock required for live toggles."}
                      </p>
                    ) : null}
                    {state.error ? <p className="mt-2 text-xs text-red-300/90">{state.error}</p> : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
