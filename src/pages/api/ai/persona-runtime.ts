import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type PersonaStore = {
  settings: {
    autoReplyEnabled: boolean;
    mentionOnly: boolean;
  };
  personas: Record<string, any>;
};

function resolvePersonaFile(): string {
  const explicit = String(process.env.BOT_PERSONA_FILE || "").trim();
  const botRoot = String(process.env.POSSUM_BOT_ROOT || "").trim();
  const candidate = explicit
    ? path.resolve(explicit)
    : botRoot
      ? path.resolve(botRoot, "modules", "data", "personas.json")
      : "";

  if (!candidate) {
    throw new Error("Configure POSSUM_BOT_ROOT or BOT_PERSONA_FILE to load bot personas");
  }
  if (!fs.existsSync(candidate)) {
    throw new Error(`Persona store was not found at ${candidate}`);
  }
  return candidate;
}

function readStore(): PersonaStore {
  const raw = JSON.parse(fs.readFileSync(resolvePersonaFile(), "utf8"));
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Persona store must contain an object");
  }
  if (
    raw.personas !== undefined &&
    (!raw.personas || typeof raw.personas !== "object" || Array.isArray(raw.personas))
  ) {
    throw new Error("Persona store has an invalid personas map");
  }
  return {
    settings: {
      autoReplyEnabled: Boolean(raw?.settings?.autoReplyEnabled),
      mentionOnly: raw?.settings?.mentionOnly !== false,
    },
    personas: raw?.personas && typeof raw.personas === "object" ? raw.personas : {},
  };
}

function summarizePersonas(personas: Record<string, any>) {
  return Object.values(personas || {})
    .filter((persona) => persona && typeof persona === "object")
    .map((persona: any) => ({
      key: String(persona.key || "").trim(),
      name: String(persona.name || persona.key || "Unnamed Persona").trim(),
      enabled: persona.enabled !== false,
      bio: String(persona.bio || "").trim(),
      triggerCount: Array.isArray(persona.triggers) ? persona.triggers.filter(Boolean).length : 0,
      mentionRequired: persona.mentionRequired !== false,
      imageConfigured: Boolean(String(persona.imageUrl || "").trim()),
      allowedRoleCount: Array.isArray(persona?.access?.allowedRoles) ? persona.access.allowedRoles.filter(Boolean).length : 0,
      allowedChannelCount: Array.isArray(persona?.access?.allowedChannels) ? persona.access.allowedChannels.filter(Boolean).length : 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const guildId = String(req.query.guildId || "").trim();
    if (!guildId) {
      return res.status(400).json({ success: false, error: "guildId is required" });
    }

    const store = readStore();
    const personas = summarizePersonas(store.personas);

    return res.status(200).json({
      success: true,
      guildId,
      config: {
        settings: store.settings,
        personaCount: personas.length,
        personas,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Failed to load AI persona runtime" });
  }
}
