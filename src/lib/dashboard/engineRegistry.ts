export type EngineGroup =
  | "Security"
  | "Access"
  | "Economy"
  | "Games"
  | "GTA Ops"
  | "Automation"
  | "AI";

export type EngineDef = {
  id: string;
  label: string;
  description: string;
  group: EngineGroup;
  route: string;
  featureKey?: string;
  notes?: string;
};

export const SAVIORS_GUILD_ID = "1431799056211906582";

export const ENGINE_REGISTRY: EngineDef[] = [
  // Security
  { id: "security-core", label: "Security Core", description: "Master security control", group: "Security", route: "/dashboard/security", featureKey: "securityEnabled" },
  { id: "pre-onboarding", label: "Pre-Onboarding", description: "Gate checks before full entry", group: "Security", route: "/dashboard/security/pre-onboarding" },
  { id: "verification", label: "Verification", description: "ID/verification workflows", group: "Security", route: "/dashboard/security/verification", featureKey: "verificationEnabled" },
  { id: "onboarding", label: "Onboarding", description: "Welcome + ticket-driven join flow", group: "Security", route: "/dashboard/security/onboarding", featureKey: "onboardingEnabled" },
  { id: "lockdown", label: "Lockdown", description: "Emergency channel/server controls", group: "Security", route: "/dashboard/security/lockdown", featureKey: "lockdownEnabled" },
  { id: "raid", label: "Raid", description: "Anti-raid burst controls", group: "Security", route: "/dashboard/security/raid", featureKey: "raidEnabled" },

  // Access
  { id: "tickets", label: "Tickets", description: "Support ticket controls", group: "Access", route: "/dashboard/access", featureKey: "ticketsEnabled" },
  { id: "tts", label: "TTS", description: "Text-to-speech controls", group: "Access", route: "/dashboard/access", featureKey: "ttsEnabled" },
  { id: "governance", label: "Governance", description: "Rule/policy governance controls", group: "Access", route: "/dashboard/access", featureKey: "governanceEnabled" },

  // Economy
  { id: "economy", label: "Economy", description: "Coins, balances, rewards", group: "Economy", route: "/dashboard/economy", featureKey: "economyEnabled" },
  { id: "giveaways", label: "Giveaways", description: "Giveaway engine + media", group: "Economy", route: "/dashboard/economy", featureKey: "giveawaysEnabled" },
  { id: "birthday", label: "Birthdays", description: "Birthday automation settings", group: "Economy", route: "/dashboard/economy", featureKey: "birthdayEnabled" },

  // Games
  { id: "pokemon", label: "Pokemon", description: "Catch/battle/trade controls", group: "Games", route: "/dashboard/games", featureKey: "pokemonEnabled" },
  { id: "pokemon-private", label: "Pokemon Private Only", description: "Restrict Pokemon to approved guilds", group: "Games", route: "/dashboard/games", featureKey: "pokemonPrivateOnly" },
  { id: "rare-drop", label: "Rare Drop", description: "Rare drop event controls", group: "Games", route: "/dashboard/games", featureKey: "rareDropEnabled" },
  { id: "cat-drop", label: "Cat Drop", description: "Cat drop scheduler controls", group: "Games", route: "/dashboard/games", notes: "Engine-level config" },
  { id: "progression", label: "Progression", description: "XP/achievement progression", group: "Games", route: "/dashboard/games", notes: "Engine-level config" },

  // GTA Ops
  { id: "heist", label: "Heist Ops", description: "GTA signup/session engine", group: "GTA Ops", route: "/dashboard/heist", featureKey: "heistEnabled" },

  // Automation
  { id: "automations", label: "Automations", description: "Trigger->condition->action builder", group: "Automation", route: "/dashboard/automations" },
  { id: "commands", label: "Command Studio", description: "Custom command builder", group: "Automation", route: "/dashboard/commands" },

  // AI
  { id: "ai-core", label: "AI Core", description: "Master AI enable/disable", group: "AI", route: "/dashboard/ai", featureKey: "aiEnabled" },
  { id: "ai-personas", label: "AI Personas", description: "Character/backstory/chat controls", group: "AI", route: "/dashboard/ai", notes: "Separate engine from bot persona" },
];

export const GROUP_ORDER: EngineGroup[] = [
  "Security",
  "Access",
  "Economy",
  "Games",
  "GTA Ops",
  "Automation",
  "AI",
];
