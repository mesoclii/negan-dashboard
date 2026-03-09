"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildDashboardHref, readDashboardGuildId } from "@/lib/dashboardContext";
import { SAVIORS_GUILD_ID } from "@/lib/dashboard/engineRegistry";

type ToggleController = {
  read: (guildId: string) => Promise<boolean>;
  write: (guildId: string, next: boolean) => Promise<void>;
};

type Card = {
  href: string;
  title: string;
  description: string;
  category?: "standard" | "premium";
  toggle?: ToggleController;
  goOnly?: boolean;
  goLabel?: string;
  premiumRequired?: boolean;
};

type ToggleState = {
  value: boolean | null;
  saving: boolean;
  error?: string;
};

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

function setPathValue<T>(input: T, path: string[], value: boolean): T {
  const clone: any = JSON.parse(JSON.stringify(input || {}));
  let current = clone;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (!current[key] || typeof current[key] !== "object" || Array.isArray(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }
  current[path[path.length - 1]] = value;
  return clone;
}

async function readJsonOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

async function getDashboardConfig(guildId: string) {
  const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" });
  const json = await readJsonOrThrow(res);
  return json?.config || {};
}

async function saveDashboardFeature(guildId: string, key: string, value: boolean) {
  const res = await fetch("/api/bot/dashboard-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, patch: { features: { [key]: value } } }),
  });
  await readJsonOrThrow(res);
}

async function getEngineConfig(guildId: string, engine: string) {
  const res = await fetch(
    `/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=${encodeURIComponent(engine)}`,
    { cache: "no-store" }
  );
  const json = await readJsonOrThrow(res);
  return json?.config || {};
}

async function saveEngineConfig(guildId: string, engine: string, patch: Record<string, unknown>) {
  const res = await fetch("/api/bot/engine-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engine, patch }),
  });
  await readJsonOrThrow(res);
}

async function getSetupConfig(guildId: string, endpoint: string) {
  const res = await fetch(`${endpoint}?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" });
  const json = await readJsonOrThrow(res);
  return json?.config || {};
}

async function saveSetupPatch(guildId: string, endpoint: string, patch: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, patch }),
  });
  await readJsonOrThrow(res);
}

async function saveSetupConfig(guildId: string, endpoint: string, config: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, config }),
  });
  await readJsonOrThrow(res);
}

async function saveSetupBody(guildId: string, endpoint: string, config: Record<string, unknown>) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, ...config }),
  });
  await readJsonOrThrow(res);
}

async function getEntityConfig(guildId: string, engineId: string) {
  const res = await fetch(
    `/api/setup/engine-entity-config?guildId=${encodeURIComponent(guildId)}&engineId=${encodeURIComponent(engineId)}`,
    { cache: "no-store" }
  );
  const json = await readJsonOrThrow(res);
  return json?.config || {};
}

async function saveEntityActive(guildId: string, engineId: string, active: boolean) {
  const res = await fetch("/api/setup/engine-entity-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, engineId, patch: { active } }),
  });
  await readJsonOrThrow(res);
}

function featureController(key: string): ToggleController {
  return {
    async read(guildId) {
      const config = await getDashboardConfig(guildId);
      return readBoolPath(config, ["features", key], false);
    },
    async write(guildId, next) {
      await saveDashboardFeature(guildId, key, next);
    },
  };
}

function engineController(engine: string, fieldPath: string[] = ["enabled"]): ToggleController {
  return {
    async read(guildId) {
      const config = await getEngineConfig(guildId, engine);
      return readBoolPath(config, fieldPath, false);
    },
    async write(guildId, next) {
      await saveEngineConfig(guildId, engine, buildPatch(fieldPath, next));
    },
  };
}

function setupPatchController(endpoint: string, fieldPath: string[]): ToggleController {
  return {
    async read(guildId) {
      const config = await getSetupConfig(guildId, endpoint);
      return readBoolPath(config, fieldPath, false);
    },
    async write(guildId, next) {
      await saveSetupPatch(guildId, endpoint, buildPatch(fieldPath, next));
    },
  };
}

function setupConfigController(endpoint: string, fieldPath: string[]): ToggleController {
  return {
    async read(guildId) {
      const config = await getSetupConfig(guildId, endpoint);
      return readBoolPath(config, fieldPath, false);
    },
    async write(guildId, next) {
      const current = await getSetupConfig(guildId, endpoint);
      await saveSetupConfig(guildId, endpoint, setPathValue(current, fieldPath, next) as Record<string, unknown>);
    },
  };
}

function setupBodyController(endpoint: string, fieldPath: string[]): ToggleController {
  return {
    async read(guildId) {
      const config = await getSetupConfig(guildId, endpoint);
      return readBoolPath(config, fieldPath, false);
    },
    async write(guildId, next) {
      const current = await getSetupConfig(guildId, endpoint);
      await saveSetupBody(guildId, endpoint, setPathValue(current, fieldPath, next) as Record<string, unknown>);
    },
  };
}

function entityController(engineId: string): ToggleController {
  return {
    async read(guildId) {
      const config = await getEntityConfig(guildId, engineId);
      return readBoolPath(config, ["active"], true);
    },
    async write(guildId, next) {
      await saveEntityActive(guildId, engineId, next);
    },
  };
}

function moduleController(moduleId: string): ToggleController {
  return {
    async read(guildId) {
      const config = await getSetupConfig(guildId, "/api/setup/module-loader-config");
      const modules = Array.isArray(config?.modules) ? config.modules : [];
      const match = modules.find((row: any) => String(row?.id || "").trim() === moduleId);
      return typeof match?.enabled === "boolean" ? match.enabled : readBoolPath(config, ["active"], true);
    },
    async write(guildId, next) {
      const current = await getSetupConfig(guildId, "/api/setup/module-loader-config");
      const modules = Array.isArray(current?.modules) ? [...current.modules] : [];
      const index = modules.findIndex((row: any) => String(row?.id || "").trim() === moduleId);
      if (index >= 0) {
        modules[index] = { ...modules[index], enabled: next };
      } else {
        modules.push({
          id: moduleId,
          label: moduleId,
          enabled: next,
          bootOrder: modules.length + 1,
          warmupMs: 50,
          retryCount: 2,
        });
      }
      await saveSetupBody(guildId, "/api/setup/module-loader-config", {
        ...current,
        modules,
      });
    },
  };
}

const birthdayController: ToggleController = {
  async read(guildId) {
    const config = await getSetupConfig(guildId, "/api/setup/radio-birthday-config");
    return readBoolPath(config, ["birthday", "enabled"], false);
  },
  async write(guildId, next) {
    await saveDashboardFeature(guildId, "birthdayEnabled", next);
    await saveSetupPatch(guildId, "/api/setup/radio-birthday-config", buildPatch(["birthday", "enabled"], next));
  },
};

const giveawaysController: ToggleController = {
  async read(guildId) {
    const [uiConfig, engineConfig] = await Promise.all([
      getSetupConfig(guildId, "/api/setup/giveaways-ui-config"),
      getEngineConfig(guildId, "giveaways"),
    ]);
    return readBoolPath(uiConfig, ["active"], false) && readBoolPath(engineConfig, ["enabled"], false);
  },
  async write(guildId, next) {
    await Promise.all([
      saveSetupPatch(guildId, "/api/setup/giveaways-ui-config", buildPatch(["active"], next)),
      saveEngineConfig(guildId, "giveaways", { enabled: next }),
    ]);
  },
};

const rareSpawnController: ToggleController = {
  async read(guildId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId),
      getEngineConfig(guildId, "rareSpawn"),
    ]);
    return readBoolPath(dashboardConfig, ["features", "rareDropEnabled"], false) && readBoolPath(engineConfig, ["enabled"], false);
  },
  async write(guildId, next) {
    await Promise.all([
      saveDashboardFeature(guildId, "rareDropEnabled", next),
      saveEngineConfig(guildId, "rareSpawn", { enabled: next }),
    ]);
  },
};

const musicController: ToggleController = {
  async read(guildId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId),
      getEngineConfig(guildId, "music"),
    ]);
    return readBoolPath(dashboardConfig, ["features", "musicEnabled"], false) && readBoolPath(engineConfig, ["enabled"], false);
  },
  async write(guildId, next) {
    await Promise.all([
      saveDashboardFeature(guildId, "musicEnabled", next),
      saveEngineConfig(guildId, "music", { enabled: next }),
    ]);
  },
};

const pokemonCatchingController: ToggleController = {
  async read(guildId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId),
      getEngineConfig(guildId, "pokemon"),
    ]);
    return readBoolPath(dashboardConfig, ["features", "pokemonEnabled"], false) && readBoolPath(engineConfig, ["enabled"], false);
  },
  async write(guildId, next) {
    await Promise.all([
      saveDashboardFeature(guildId, "pokemonEnabled", next),
      saveEngineConfig(guildId, "pokemon", { enabled: next }),
    ]);
  },
};

const pokemonBattleController: ToggleController = {
  async read(guildId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId),
      getEngineConfig(guildId, "pokemon"),
    ]);
    return readBoolPath(dashboardConfig, ["features", "pokemonEnabled"], false) && readBoolPath(engineConfig, ["battleEnabled"], false);
  },
  async write(guildId, next) {
    if (next) {
      await saveDashboardFeature(guildId, "pokemonEnabled", true);
    }
    await saveEngineConfig(guildId, "pokemon", { battleEnabled: next });
  },
};

const pokemonTradeController: ToggleController = {
  async read(guildId) {
    const [dashboardConfig, engineConfig] = await Promise.all([
      getDashboardConfig(guildId),
      getEngineConfig(guildId, "pokemon"),
    ]);
    return readBoolPath(dashboardConfig, ["features", "pokemonEnabled"], false) && readBoolPath(engineConfig, ["tradingEnabled"], false);
  },
  async write(guildId, next) {
    if (next) {
      await saveDashboardFeature(guildId, "pokemonEnabled", true);
    }
    await saveEngineConfig(guildId, "pokemon", { tradingEnabled: next });
  },
};

const CARDS: Card[] = [
  { href: "/dashboard/bot-personalizer", title: "Bot Personalizer", description: "Per-guild Possum AI naming, avatar, activity, and backstory.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/bot-masters", title: "Bot Masters", description: "Set which guild roles and users can manage the dashboard.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/premium-features", title: "Premium Features", description: "Plan state, paid add-ons, and owner trial controls.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/ai/learning", title: "Possum AI", description: "Homemade adaptive AI, bot knowledge base, learning writes, and synthesis runtime.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/ai/persona", title: "Persona AI", description: "Hosted persona runtime, photos, triggers, and roster controls.", goOnly: true, goLabel: "Go", premiumRequired: true, category: "premium" },
  { href: "/dashboard/ai/openai-platform", title: "Hosted AI Platform", description: "Provider, model, and hosted premium AI platform controls.", goOnly: true, goLabel: "Go", premiumRequired: true, category: "premium" },
  { href: "/dashboard/automations/studio", title: "Automation Studio", description: "Visual trigger/condition/action flow builder.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/commands", title: "Command Studio", description: "Custom command engine and command toggles.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/tickets", title: "Tickets", description: "Support ticket engine controls.", toggle: engineController("tickets", ["active"]) },
  { href: "/dashboard/selfroles", title: "Selfroles", description: "Self-role panel configuration and role mapping.", toggle: setupBodyController("/api/setup/selfroles-config", ["active"]) },
  { href: "/dashboard/invite-tracker", title: "Invite Tracker", description: "Invite tracking tiers and command behavior.", toggle: engineController("inviteTracker") },
  { href: "/dashboard/tts", title: "TTS", description: "Voice route and TTS runtime control.", toggle: featureController("ttsEnabled"), premiumRequired: true, category: "premium" },
  { href: "/dashboard/economy", title: "Economy", description: "Economy baseline and related systems.", toggle: featureController("economyEnabled") },
  { href: "/dashboard/economy/store", title: "Store", description: "Catalog, prices, stock, and role grants.", toggle: setupPatchController("/api/setup/store-config", ["active"]) },
  { href: "/dashboard/economy/progression", title: "Progression", description: "XP intake, level formulas, reward ladders, and progression multipliers.", toggle: setupPatchController("/api/setup/progression-config", ["active"]) },
  { href: "/dashboard/prestige", title: "Prestige", description: "Capstone reset loop, role rewards, and long-tail prestige elevation.", toggle: engineController("prestige") },
  { href: "/dashboard/economy/radio-birthday", title: "Birthdays", description: "Birthday engine settings and reward flow.", toggle: birthdayController },
  { href: "/dashboard/music", title: "Music", description: "Always-free multi-route music playback, route binding, and live queue control.", toggle: musicController },
  { href: "/dashboard/giveaways", title: "Giveaways", description: "Giveaway lifecycle, entrants, rerolls, and controls.", toggle: giveawaysController },
  { href: "/dashboard/heist", title: "Heist", description: "Heist signup engine controls.", toggle: setupBodyController("/api/setup/heist-ops-config", ["active"]), premiumRequired: true, category: "premium" },
  { href: "/dashboard/gta-ops", title: "GTA Ops", description: "GTA operations entity, separate from Heist.", toggle: moduleController("games") },
  { href: "/dashboard/crew", title: "Crew", description: "Crew create/join/leave/vault controls.", toggle: engineController("crew") },
  { href: "/dashboard/dominion", title: "Dominion", description: "Dominion raid/alliance/war settings.", toggle: engineController("dominion") },
  { href: "/dashboard/contracts", title: "Contracts", description: "Objective progression, task tracking, and contract reward flow.", toggle: engineController("contracts") },
  { href: "/dashboard/profile", title: "Profile", description: "Profile display, rank surfaces, and stat aggregation controls.", toggle: engineController("profile") },
  { href: "/dashboard/halloffame", title: "Hall of Fame", description: "Recognition layer for top achievers and prestige-ready members.", toggle: engineController("hallOfFame") },
  { href: "/dashboard/achievements", title: "Achievements", description: "Milestone grant rules, badge sync, and achievement reward logic.", toggle: setupPatchController("/api/setup/achievements-config", ["active"]) },
  { href: "/dashboard/loyalty", title: "Loyalty", description: "Retention timing, tenure rewards, and VIP-adjacent loyalty benefits.", toggle: setupPatchController("/api/setup/loyalty-config", ["active"]) },
  { href: "/dashboard/catdrop", title: "Cat Drop", description: "Cat spawn/catch and drop tuning.", toggle: engineController("catDrop") },
  { href: "/dashboard/rarespawn", title: "Rare Spawn", description: "Rare event spawn/claim settings.", toggle: rareSpawnController },
  { href: "/dashboard/range", title: "Range", description: "Range game interactions and limits.", toggle: engineController("range") },
  { href: "/dashboard/truthdare", title: "Truth Or Dare", description: "Truth/Dare prompts, channel locks, and bet controls.", toggle: engineController("truthDare") },
  { href: "/dashboard/pokemon-catching", title: "Pokemon Catching", description: "Wild spawn lanes, catch rates, reward tuning, and catch logs.", toggle: pokemonCatchingController },
  { href: "/dashboard/pokemon-battle", title: "Pokemon Battle", description: "Battle lane, battle logging, and duel availability.", toggle: pokemonBattleController },
  { href: "/dashboard/pokemon-trade", title: "Pokemon Trade", description: "Trade gate and trade log routing.", toggle: pokemonTradeController },
  { href: "/dashboard/governance", title: "Governance", description: "Governance state and enforcement controls.", toggle: featureController("governanceEnabled"), premiumRequired: true, category: "premium" },
  { href: "/dashboard/security", title: "Security", description: "Security stack, moderation, and policies.", toggle: featureController("governanceEnabled"), premiumRequired: true, category: "premium" },
  { href: "/dashboard/blacklist", title: "Blacklist", description: "Blacklist add/remove/show control.", toggle: engineController("blacklist") },
  { href: "/dashboard/failsafe", title: "Failsafe", description: "Emergency pause and safety switches.", toggle: engineController("failsafe") },
  { href: "/dashboard/panels", title: "Panel Hub", description: "Jump to the engine tabs that own their own panel layouts and run shared deploys.", goOnly: true, goLabel: "Go" },
  { href: "/dashboard/runtime-router", title: "Runtime Router", description: "Gun/possum/vip runtime routing controls.", toggle: engineController("runtimeRouter", ["adaptiveAiEnabled"]) },
  { href: "/dashboard/jed", title: "Jed", description: "Sticker/emote/gif steal and deploy engine.", toggle: engineController("jed") },
  { href: "/dashboard/system-health", title: "System Health", description: "Runtime monitor, drift and health checks.", toggle: setupPatchController("/api/setup/runtime-safety-config", ["active"]) },
  { href: "/dashboard/vip", title: "VIP", description: "VIP tiers, grants, and expiry sync.", toggle: setupPatchController("/api/setup/vip-config", ["active"]) },
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
  const [guildId, setGuildId] = useState("");
  const [states, setStates] = useState<Record<string, ToggleState>>({});
  const [loadingStates, setLoadingStates] = useState(false);
  const [subscription, setSubscription] = useState<{ active: boolean; plan: string; developerBypass?: boolean } | null>(null);

  useEffect(() => {
    setGuildId(readDashboardGuildId());
  }, []);

  async function loadStates(targetGuildId: string) {
    if (!targetGuildId) return;
    setLoadingStates(true);
    const nextStates: Record<string, ToggleState> = {};
    await Promise.all(
      CARDS.map(async (card) => {
        if (!card.toggle) return;
        try {
          const value = await card.toggle.read(targetGuildId);
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
  }

  useEffect(() => {
    loadStates(guildId).catch(() => {});
  }, [guildId]);

  useEffect(() => {
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
  }, [guildId]);

  async function toggleCard(card: Card) {
    if (!guildId || !card.toggle) return;
    const premiumUnlocked = Boolean(subscription?.active || subscription?.developerBypass);
    if (card.premiumRequired && !premiumUnlocked) return;
    const current = states[card.href]?.value ?? false;
    const next = !current;
    setStates((prev) => ({
      ...prev,
      [card.href]: { ...(prev[card.href] || { value: current }), value: next, saving: true, error: "" },
    }));

    try {
      await card.toggle.write(guildId, next);
      await loadStates(guildId);
    } catch (err: any) {
      setStates((prev) => ({
        ...prev,
        [card.href]: {
          ...(prev[card.href] || { value: current }),
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
        href: buildDashboardHref(card.href),
        state: states[card.href] || { value: null, saving: false },
      })),
    [states]
  );

  const premiumUnlocked = Boolean(subscription?.active || subscription?.developerBypass);
  const standardCards = cards.filter((card) => !card.premiumRequired);
  const premiumCards = cards.filter((card) => card.premiumRequired);

  return (
    <section className="space-y-5">
      <header className="rounded-xl border possum-divider bg-black/50 p-5 possum-border">
        <p className="text-xs uppercase tracking-[0.22em] possum-soft">Possum Control</p>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.08em] possum-red possum-glow">Guild Dashboard</h2>
        <p className="mt-2 text-sm text-red-200/80">
          {guildId === SAVIORS_GUILD_ID
            ? "Saviors baseline stays intact until you explicitly toggle something."
            : "Use the card toggles here to turn engines on or off for the active guild without leaving the dashboard. Studio/editor pages open directly with Go."}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {standardCards.map((card) => {
          const state = card.state;
          const toggleBusy = state.saving || loadingStates;
          const statusLabel = state.value === null ? "..." : state.value ? "ON" : "OFF";

          return (
            <div
              key={card.href}
              className="rounded-xl border possum-divider bg-black/45 p-4 transition hover:bg-black/65 possum-border"
            >
              <div className="flex items-start justify-between gap-3">
                <Link href={card.href} className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold uppercase tracking-[0.06em] possum-red">{card.title}</h3>
                  <p className="mt-1 text-sm text-red-200/75">{card.description}</p>
                </Link>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {card.goOnly ? (
                    <>
                      <span className="rounded-full border border-red-600/40 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-red-200/75">
                        Editor
                      </span>
                      <Link
                        href={card.href}
                        className="rounded-lg border border-red-600/60 bg-black/50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-red-200"
                      >
                        {card.goLabel || "Go"}
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className={pillClass(state.value)}>
                        {statusLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCard(card)}
                        disabled={!guildId || !card.toggle || toggleBusy}
                        className="rounded-lg border border-red-600/60 bg-black/50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {toggleBusy ? "Saving" : state.value ? "Turn Off" : "Turn On"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {state.error ? <p className="mt-2 text-xs text-red-300/90">{state.error}</p> : null}
            </div>
          );
        })}
      </div>

      {premiumUnlocked ? (
        <div className="space-y-3">
          <header className="rounded-xl border possum-divider bg-black/45 p-4 possum-border">
            <p className="text-xs uppercase tracking-[0.22em] possum-soft">Premium Category</p>
            <h3 className="mt-1 text-xl font-black uppercase tracking-[0.08em] possum-red">
              Premium Features
            </h3>
            <p className="mt-2 text-sm text-red-200/80">
              Paid add-ons are separated from the standard stack. Current access: {subscription?.developerBypass ? "developer override" : subscription?.plan || "FREE"}.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {premiumCards.map((card) => {
              const state = card.state;
              const toggleBusy = state.saving || loadingStates;
              const statusLabel = state.value === null ? "..." : state.value ? "ON" : "OFF";

              return (
                <div
                  key={card.href}
                  className="rounded-xl border possum-divider bg-black/45 p-4 transition hover:bg-black/65 possum-border"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={card.href} className="min-w-0 flex-1">
                      <h3 className="text-base font-extrabold uppercase tracking-[0.06em] possum-red">{card.title}</h3>
                      <p className="mt-1 text-sm text-red-200/75">{card.description}</p>
                    </Link>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {card.goOnly ? (
                        <>
                          <span className="rounded-full border border-amber-500/40 bg-amber-950/30 px-2 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-amber-300">
                            Premium
                          </span>
                          <Link
                            href={card.href}
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
                            disabled={!guildId || !card.toggle || toggleBusy}
                            className="rounded-lg border border-red-600/60 bg-black/50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {toggleBusy ? "Saving" : state.value ? "Turn Off" : "Turn On"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {state.error ? <p className="mt-2 text-xs text-red-300/90">{state.error}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
