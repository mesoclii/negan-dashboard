import { ENGINE_REGISTRY } from "@/lib/dashboard/engineRegistry";

export type FeatureCatalogEntry = {
  id: string;
  label: string;
  route: string;
  summary: string;
};

export type PremiumFeature = FeatureCatalogEntry & {
  premiumLabel: string;
  monthlyUsd: number;
  yearlyUsd: number;
  pricingNote: string;
};

export type PrivateFeature = FeatureCatalogEntry & {
  policyNote: string;
};

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: "tts",
    label: "TTS Engine",
    route: "/dashboard/tts",
    summary: "Voice playback channels, speech routing, queue rules, and live text-to-speech controls.",
    premiumLabel: "Premium Add-On",
    monthlyUsd: 2.49,
    yearlyUsd: 23.99,
    pricingNote: "Per guild. Lowered public add-on pricing."
  },
  {
    id: "persona-ai",
    label: "Persona Engine AI",
    route: "/dashboard/ai/persona",
    summary: "OpenAI-powered persona replies, prompt shaping, access rules, persona photos, and backstory-driven behavior.",
    premiumLabel: "Premium Add-On",
    monthlyUsd: 7.99,
    yearlyUsd: 76.99,
    pricingNote: "Per guild. This is the hosted model path only."
  },
  {
    id: "heist",
    label: "Heist Engine",
    route: "/dashboard/heist",
    summary: "Heist signup rotations, channel routing, logging, and event-session controls. GTA Ops stays separate.",
    premiumLabel: "Premium Add-On",
    monthlyUsd: 4.99,
    yearlyUsd: 47.99,
    pricingNote: "Per guild. Heist signup engine only."
  }
];

export const PRIVATE_FEATURES: PrivateFeature[] = [
  {
    id: "pokemon-suite",
    label: "Pokemon Suite",
    route: "/dashboard/pokemon-catching",
    summary: "Pokemon catching, battle, and trade remain private and owner-only.",
    policyNote: "Never sold publicly. Hidden from public SaaS monetization."
  }
];

const PREMIUM_ROUTE_SET = new Set(PREMIUM_FEATURES.map((feature) => feature.route));
const PRIVATE_ROUTE_SET = new Set([
  "/dashboard/pokemon-catching",
  "/dashboard/pokemon-battle",
  "/dashboard/pokemon-trade",
]);
const EXCLUDED_PUBLIC_ROUTE_SET = new Set([
  "/dashboard/premium-features",
  "/dashboard/ai",
  "/dashboard/system-health",
]);

const STANDARD_MANUAL_FEATURES: FeatureCatalogEntry[] = [
  {
    id: "bot-knowledge-base",
    label: "Bot Knowledge Base",
    route: "/dashboard/ai/learning",
    summary: "Homemade adaptive AI with learned tone, stored knowledge, and runtime reply routing."
  }
];

export const STANDARD_FEATURES: FeatureCatalogEntry[] = [
  ...STANDARD_MANUAL_FEATURES,
  ...ENGINE_REGISTRY
    .filter((engine) => !PREMIUM_ROUTE_SET.has(engine.route))
    .filter((engine) => !PRIVATE_ROUTE_SET.has(engine.route))
    .filter((engine) => !EXCLUDED_PUBLIC_ROUTE_SET.has(engine.route))
    .map((engine) => ({
      id: engine.id,
      label: engine.label,
      route: engine.route,
      summary: engine.description,
    })),
];

export const OPENAI_PLATFORM_PRICE_CHART = [
  { id: "bronze", label: "Bronze", monthlyUsd: 1.15, yearlyUsd: 9.99, includedMessages: 200, includedImages: 20, includedBackstory: 20 },
  { id: "silver", label: "Silver", monthlyUsd: 2.29, yearlyUsd: 19.99, includedMessages: 500, includedImages: 50, includedBackstory: 50 },
  { id: "gold", label: "Gold", monthlyUsd: 5.79, yearlyUsd: 49.99, includedMessages: 2500, includedImages: 200, includedBackstory: 200 },
  { id: "diamond", label: "Diamond", monthlyUsd: 9.19, yearlyUsd: 79.99, includedMessages: 5000, includedImages: 500, includedBackstory: 500 },
  { id: "platinum", label: "Platinum", monthlyUsd: 22.99, yearlyUsd: 199.99, includedMessages: 10000, includedImages: 1000, includedBackstory: 1000 },
] as const;

