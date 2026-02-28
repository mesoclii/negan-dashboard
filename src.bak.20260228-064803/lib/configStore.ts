import fs from "fs";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "engine-configs.json");

type EngineConfigStore = Record<string, Record<string, unknown>>;

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, "{}", "utf8");
}

function normalizeGuildId(guildId: string) {
  return String(guildId || "").trim();
}

function normalizeEngineId(engineId: string) {
  return String(engineId || "").trim();
}

export function readAllConfigs(): EngineConfigStore {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf8");
  try {
    const parsed = JSON.parse(raw || "{}");
    if (parsed && typeof parsed === "object") return parsed as EngineConfigStore;
    return {};
  } catch {
    return {};
  }
}

export function readEngineConfig(guildId: string, engineId: string): Record<string, unknown> {
  const g = normalizeGuildId(guildId);
  const e = normalizeEngineId(engineId);
  if (!g || !e) return {};
  const all = readAllConfigs();
  const guildConfig = all[g] || {};
  const config = guildConfig[e];
  return config && typeof config === "object" ? (config as Record<string, unknown>) : {};
}

export function writeEngineConfig(guildId: string, engineId: string, config: Record<string, unknown>) {
  const g = normalizeGuildId(guildId);
  const e = normalizeEngineId(engineId);
  if (!g || !e) throw new Error("Missing guildId or engineId");

  ensureStore();
  const all = readAllConfigs();
  if (!all[g] || typeof all[g] !== "object") all[g] = {};
  all[g][e] = config ?? {};
  fs.writeFileSync(STORE_PATH, JSON.stringify(all, null, 2), "utf8");
}
