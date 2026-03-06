export type EngineGroup =
  | "Security"
  | "Access"
  | "Economy"
  | "Games"
  | "Automation"
  | "AI"
  | "Operations";

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
  { id: "onboarding", label: "Onboarding", description: "Welcome + ticket-driven join flow", group: "Security", route: "/dashboard/security/onboarding", featureKey: "onboardingEnabled" },
  { id: "verification", label: "Verification", description: "ID/verification workflows", group: "Security", route: "/dashboard/security/verification", featureKey: "verificationEnabled" },
  { id: "lockdown", label: "Lockdown", description: "Emergency channel/server controls", group: "Security", route: "/dashboard/security/lockdown", notes: "Engine-config controlled" },
  { id: "raid", label: "Raid", description: "Anti-raid burst controls", group: "Security", route: "/dashboard/security/raid", notes: "Engine-config controlled" },
  { id: "governance", label: "Governance", description: "Security governance stack master gate", group: "Security", route: "/dashboard/governance", featureKey: "governanceEnabled" },
  { id: "security-enforcer", label: "Security Enforcer", description: "Security enforcement policy and escalation runtime", group: "Security", route: "/dashboard/security-enforcer", featureKey: "governanceEnabled" },

  { id: "tickets", label: "Tickets", description: "Support ticket controls", group: "Access", route: "/dashboard/tickets", notes: "Engine-config controlled" },
  { id: "tts", label: "TTS", description: "Text-to-speech controls", group: "Access", route: "/dashboard/tts", featureKey: "ttsEnabled" },
  { id: "invite", label: "Invite Tracker", description: "Invite tracking and leaderboard", group: "Access", route: "/dashboard/invite-tracker" },
  { id: "selfroles", label: "Self Roles", description: "Self-role panel deployment", group: "Access", route: "/dashboard/selfroles" },
  { id: "vip", label: "VIP", description: "VIP grants/set/remove/status and expiry cleanup", group: "Access", route: "/dashboard/vip", notes: "Separate VIP engine. Loyalty is linked via /dashboard/vip/loyalty" },

  { id: "economy", label: "Economy", description: "Economy/store/progression baseline", group: "Economy", route: "/dashboard/economy", featureKey: "economyEnabled" },
  { id: "birthday", label: "Birthday/Radio", description: "Birthday engine controls", group: "Economy", route: "/dashboard/economy/radio-birthday", featureKey: "birthdayEnabled" },
  { id: "giveaways", label: "Giveaways", description: "Giveaway engine controls", group: "Economy", route: "/dashboard/giveaways", notes: "Engine-config controlled" },
  { id: "profile", label: "Profile", description: "Profile/rank/rep controls", group: "Economy", route: "/dashboard/profile" },
  { id: "contracts", label: "Contracts", description: "Contracts controls", group: "Economy", route: "/dashboard/contracts" },
  { id: "halloffame", label: "Hall Of Fame", description: "Hall of fame controls", group: "Economy", route: "/dashboard/halloffame" },
  { id: "loyalty", label: "Loyalty", description: "Loyalty engine tied into VIP tenure and rewards", group: "Economy", route: "/dashboard/vip/loyalty" },
  { id: "prestige", label: "Prestige", description: "Prestige progression controls", group: "Economy", route: "/dashboard/prestige" },

  { id: "heist", label: "Heist", description: "Heist signup/session controls", group: "Games", route: "/dashboard/heist", featureKey: "heistEnabled" },
  { id: "gta-ops", label: "GTA Ops", description: "GTA operations entity (separate from Heist signup)", group: "Games", route: "/dashboard/gta-ops" },
  { id: "pokemon", label: "Pokemon", description: "Pokemon controls", group: "Games", route: "/dashboard/games", featureKey: "pokemonEnabled" },
  { id: "pokemon-stage2", label: "Pokemon Stage2", description: "Battle/trade/team panel controls", group: "Games", route: "/dashboard/pokemon-stage2", featureKey: "pokemonEnabled" },
  { id: "rare-drop", label: "Rare Spawn", description: "Rare spawn controls", group: "Games", route: "/dashboard/rarespawn", featureKey: "rareDropEnabled" },
  { id: "cat-drop", label: "Cat Drop", description: "Cat drop controls", group: "Games", route: "/dashboard/catdrop" },
  { id: "crew", label: "Crew", description: "Crew engine controls", group: "Games", route: "/dashboard/crew" },
  { id: "dominion", label: "Dominion", description: "Dominion engine controls", group: "Games", route: "/dashboard/dominion" },
  { id: "range", label: "Range", description: "Range game controls", group: "Games", route: "/dashboard/range" },
  { id: "truthdare", label: "Truth Dare", description: "Truth/Dare controls", group: "Games", route: "/dashboard/truthdare" },

  { id: "automations", label: "Automations", description: "SaaS automation builder and runtime", group: "Automation", route: "/dashboard/automations" },
  { id: "commands", label: "Command Studio", description: "Custom command builder", group: "Automation", route: "/dashboard/commands" },
  { id: "panel-deploy", label: "Panel Deploy", description: "Panel deploy/status controls", group: "Automation", route: "/dashboard/panels" },
  { id: "event-reactor", label: "Event Reactor", description: "Scheduled event reactor controls", group: "Automation", route: "/dashboard/event-reactor" },

  { id: "ai-core", label: "AI", description: "Persona/AI message handling", group: "AI", route: "/dashboard/ai", featureKey: "aiEnabled" },

  { id: "blacklist", label: "Blacklist", description: "Blacklist controls", group: "Operations", route: "/dashboard/blacklist" },
  { id: "failsafe", label: "Failsafe", description: "Failsafe emergency controls", group: "Operations", route: "/dashboard/failsafe" },
  { id: "master-panel", label: "Master Panel", description: "Master panel command controls", group: "Operations", route: "/dashboard/panel" },
  { id: "runtime-router", label: "Runtime Router", description: "Gun/possum/vip runtime routing", group: "Operations", route: "/dashboard/runtime-router" },
  { id: "jed", label: "Jed", description: "Jed engine controls", group: "Operations", route: "/dashboard/jed" },
];

export const GROUP_ORDER: EngineGroup[] = [
  "Security",
  "Access",
  "Economy",
  "Games",
  "Automation",
  "AI",
  "Operations",
];
