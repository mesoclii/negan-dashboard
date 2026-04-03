const ENGINE_ALIAS_MAP: Record<string, string> = {
  runtimeRouter: "aiRuntime",
  possumAi: "aiRuntime",
  adaptiveAi: "aiRuntime",
  personaEngine: "persona",
  personaAi: "persona",
  botPersonalizer: "botPersonalizer",
  rareDrop: "rareSpawn",
  eventPointsStudio: "eventPoints",
};

export function normalizeEngineKey(raw: string): string {
  const key = String(raw || "").trim();
  if (!key) return "";
  if (ENGINE_ALIAS_MAP[key]) {
    return ENGINE_ALIAS_MAP[key];
  }

  const compact = key.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const compactAliasMap: Record<string, string> = {
    runtimerouter: "aiRuntime",
    possumai: "aiRuntime",
    adaptiveai: "aiRuntime",
    personaengine: "persona",
    personaai: "persona",
    botpersonalizer: "botPersonalizer",
    preonboarding: "preOnboarding",
    eventpoints: "eventPoints",
    halloffame: "hallOfFame",
    catdrop: "catDrop",
    raredrop: "rareSpawn",
    rarespawn: "rareSpawn",
    truthdare: "truthDare",
    communitystudio: "communityStudio",
    channelflow: "channelFlow",
    signalrelay: "signalRelay",
    searchanything: "searchAnything",
    gameidentity: "gameIdentity",
    privacyconsent: "privacyConsent",
    presencefusion: "presenceFusion",
    squadfinder: "squadFinder",
    gameplaytime: "playtime",
    nativecommands: "nativeCommands",
  };

  return compactAliasMap[compact] || key;
}
