export type EngineControl =
  | { type: "toggle"; key: string; label: string }
  | { type: "number"; key: string; label: string }
  | { type: "text"; key: string; label: string }
  | { type: "role"; key: string; label: string }
  | { type: "channel"; key: string; label: string };

export type EngineSchema = {
  engineId: string;
  displayName: string;
  category: string;
  description: string;
  controls: EngineControl[];
};
