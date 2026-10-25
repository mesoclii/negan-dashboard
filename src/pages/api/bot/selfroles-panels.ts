import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type PanelRole = {
  id: string;
  label: string;
  emoji?: unknown;
};

type Panel = {
  id: string;
  name: string;
  singleSelect: boolean;
  roles: PanelRole[];
};

type GuildConfig = {
  channelId: string | null;
  panels: Panel[];
};

type Store = {
  guilds: Record<string, GuildConfig>;
};

function resolveStorePath(): string {
  const explicit = String(process.env.BOT_SELFROLES_FILE || "").trim();
  const botRoot = String(process.env.POSSUM_BOT_ROOT || "").trim();
  const candidate = explicit
    ? path.resolve(explicit)
    : botRoot
      ? path.resolve(botRoot, "modules", "data", "selfroles.panels.json")
      : "";

  if (!candidate) {
    throw new Error("Configure POSSUM_BOT_ROOT or BOT_SELFROLES_FILE to load self-role panels");
  }
  return candidate;
}

function ensureStoreFile(storePath: string) {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(storePath)) {
    fs.writeFileSync(storePath, JSON.stringify({ guilds: {} }, null, 2), "utf8");
  }
}

function readStore(storePath: string): Store {
  ensureStoreFile(storePath);
  const raw = fs.readFileSync(storePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Self-role panel store at ${storePath} must contain an object`);
  }
  if (
    parsed.guilds !== undefined &&
    (!parsed.guilds || typeof parsed.guilds !== "object" || Array.isArray(parsed.guilds))
  ) {
    throw new Error(`Self-role panel store at ${storePath} has an invalid guild map`);
  }
  return { guilds: parsed.guilds || {} };
}

function writeStore(store: Store, storePath: string) {
  ensureStoreFile(storePath);
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");
}

function cleanPanelId(input: unknown, idx: number): string {
  const cleaned = String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return cleaned || `panel_${idx + 1}`;
}

function normalizeRole(raw: any): PanelRole | null {
  const id = String(raw?.id || raw?.roleId || "").trim();
  if (!id) return null;
  const label = String(raw?.label || raw?.name || id).trim().slice(0, 80) || id;
  const emoji = raw?.emoji;
  if (emoji === undefined || emoji === null || emoji === "") {
    return { id, label };
  }
  return { id, label, emoji };
}

function normalizePanels(rawPanels: any): Panel[] {
  if (!Array.isArray(rawPanels)) return [];

  return rawPanels.slice(0, 50).map((panel, idx) => {
    const id = cleanPanelId(panel?.id || panel?.name, idx);
    const name = String(panel?.name || id).trim().slice(0, 120) || id;
    const singleSelect = Boolean(panel?.singleSelect);

    const rolesRaw = Array.isArray(panel?.roles) ? panel.roles : [];
    const roles: PanelRole[] = [];
    const seen = new Set<string>();
    for (const rr of rolesRaw) {
      const next = normalizeRole(rr);
      if (!next) continue;
      if (seen.has(next.id)) continue;
      seen.add(next.id);
      roles.push(next);
    }

    return { id, name, singleSelect, roles };
  });
}

function readGuildConfig(guildId: string, storePath: string): GuildConfig {
  const store = readStore(storePath);
  const existing = store.guilds[guildId];
  if (!existing || typeof existing !== "object") {
    return { channelId: null, panels: [] };
  }

  const channelId = existing.channelId ? String(existing.channelId) : null;
  const panels = normalizePanels(existing.panels || []);
  return { channelId, panels };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    if (req.method !== "GET" && req.method !== "POST" && req.method !== "PUT") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const storePath = resolveStorePath();
    if (req.method === "GET") {
      const config = readGuildConfig(guildId, storePath);
      return res.status(200).json({ success: true, guildId, config, storePath });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const channelRaw = req.body?.channelId;
      const channelId = String(channelRaw || "").trim() || null;
      const panels = normalizePanels(req.body?.panels || []);

      const store = readStore(storePath);
      store.guilds = store.guilds || {};
      store.guilds[guildId] = { channelId, panels };
      writeStore(store, storePath);

      return res.status(200).json({ success: true, guildId, config: store.guilds[guildId] });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "selfroles panel API failed" });
  }
}
