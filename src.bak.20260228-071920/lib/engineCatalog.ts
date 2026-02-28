import { EngineSchema } from "./engineSchema";

export const engineCatalog: EngineSchema[] = [
  {
    engineId: "vipEngine",
    displayName: "VIP Engine",
    category: "Access",
    description: "Paid role management and entitlement tracking",
    controls: [
      { type: "toggle", key: "autoExpire", label: "Auto Expire Roles" },
      { type: "channel", key: "logChannel", label: "Log Channel" }
    ]
  },
  {
    engineId: "heistEngine",
    displayName: "Heist Engine",
    category: "GTA Ops",
    description: "GTA Heist signup and session control",
    controls: [
      { type: "toggle", key: "enabled", label: "Enable Heist System" },
      { type: "number", key: "maxSessions", label: "Max Active Sessions" }
    ]
  },
  {
    engineId: "preOnboarding",
    displayName: "Pre-Onboarding",
    category: "Security",
    description: "Gatekeeping and entry screening system",
    controls: [
      { type: "toggle", key: "enabled", label: "Enable Pre-Onboarding" },
      { type: "text", key: "customMessage", label: "Custom Message" }
    ]
  }
];
