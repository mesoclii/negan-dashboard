import fs from "node:fs";
import path from "node:path";

export type StatusState = "online" | "maintenance" | "offline";

export type PublicStatusService = {
  id: string;
  label: string;
  summary: string;
  status: StatusState;
  updatedAt: string;
};

export type PublicStatusPayload = {
  overall: StatusState;
  headline: string;
  message: string;
  updatedAt: string;
  services: PublicStatusService[];
};

const STORE_PATH = path.join(process.cwd(), "data", "ui", "public-status.json");

const DEFAULT_SERVICES: PublicStatusService[] = [
  { id: "bot-core", label: "Bot Core", summary: "Primary bot runtime and command router.", status: "online", updatedAt: "" },
  { id: "dashboard", label: "Dashboard", summary: "OAuth, guild selector, and dashboard APIs.", status: "online", updatedAt: "" },
  { id: "possum-ai", label: "Possum AI", summary: "Homemade adaptive AI and learned routing.", status: "online", updatedAt: "" },
  { id: "persona-ai", label: "Persona Engine AI", summary: "Hosted persona model path and prompt routing.", status: "online", updatedAt: "" },
  { id: "tts", label: "TTS Engine", summary: "Speech routing and voice playback.", status: "online", updatedAt: "" },
  { id: "tickets", label: "Tickets", summary: "Panel flows, claim/close/reopen/delete, transcripts.", status: "online", updatedAt: "" },
  { id: "selfroles", label: "Selfroles", summary: "Panel deployment and role button/select logic.", status: "online", updatedAt: "" },
  { id: "heist", label: "Heist Engine", summary: "Heist signups, rotation, and logs.", status: "online", updatedAt: "" },
  { id: "crew", label: "Crew", summary: "Crew creation, vaults, and member logic.", status: "online", updatedAt: "" },
  { id: "dominion", label: "Dominion", summary: "Raid/alliance/war control surface.", status: "online", updatedAt: "" },
  { id: "contracts", label: "Contracts", summary: "Contract generation, completion, and reward flow.", status: "online", updatedAt: "" },
  { id: "catdrop", label: "Cat Drop", summary: "Weighted cat spawns, catches, and rewards.", status: "online", updatedAt: "" },
  { id: "rarespawn", label: "Rare Spawn", summary: "Auto/manual rare event spawns and claims.", status: "online", updatedAt: "" },
  { id: "range", label: "Range", summary: "Range rounds, cooldowns, and scoring.", status: "online", updatedAt: "" },
];

const DEFAULT_STATUS: PublicStatusPayload = {
  overall: "online",
  headline: "Possum systems are online",
  message: "Public dashboard, control surfaces, and the live bot stack are healthy.",
  updatedAt: "",
  services: DEFAULT_SERVICES,
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function normalizeState(input: unknown, fallback: StatusState): StatusState {
  const value = String(input || "").trim().toLowerCase();
  if (value === "online" || value === "maintenance" || value === "offline") return value;
  return fallback;
}

function normalizeService(input: unknown, fallback: PublicStatusService): PublicStatusService {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  return {
    id: String(source.id || fallback.id),
    label: String(source.label || fallback.label),
    summary: String(source.summary || fallback.summary),
    status: normalizeState(source.status, fallback.status),
    updatedAt: String(source.updatedAt || fallback.updatedAt || ""),
  };
}

function normalizeStatus(input: unknown): PublicStatusPayload {
  const source = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const fallbackById = new Map(DEFAULT_SERVICES.map((service) => [service.id, service]));
  const services = Array.isArray(source.services)
    ? source.services
        .map((service) => {
          const id = String((service as Record<string, unknown>)?.id || "").trim();
          const fallback = fallbackById.get(id) || DEFAULT_SERVICES[0];
          return normalizeService(service, fallback);
        })
        .filter((service) => service.id)
    : DEFAULT_SERVICES.map((service) => normalizeService(service, service));

  return {
    overall: normalizeState(source.overall, DEFAULT_STATUS.overall),
    headline: String(source.headline || DEFAULT_STATUS.headline),
    message: String(source.message || DEFAULT_STATUS.message),
    updatedAt: String(source.updatedAt || DEFAULT_STATUS.updatedAt || ""),
    services: services.length ? services : clone(DEFAULT_SERVICES),
  };
}

export function readPublicStatus(): PublicStatusPayload {
  ensureStoreDir();
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return normalizeStatus(JSON.parse(raw || "{}"));
  } catch {
    return normalizeStatus(DEFAULT_STATUS);
  }
}

export function writePublicStatus(patch: Partial<PublicStatusPayload>) {
  const current = readPublicStatus();
  const next = normalizeStatus({
    ...current,
    ...(patch || {}),
    updatedAt: new Date().toISOString(),
    services: Array.isArray(patch.services) ? patch.services : current.services,
  });
  ensureStoreDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(next, null, 2), "utf8");
  return next;
}
