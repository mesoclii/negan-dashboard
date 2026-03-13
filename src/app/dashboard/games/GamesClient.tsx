"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { resolveGuildContext, fetchRuntimeEngine, saveRuntimeEngine } from "@/lib/liveRuntime";
import GameSocialClient from "@/components/possum/GameSocialClient";

type EnginePayload = {
  config?: Record<string, any>;
  summary?: Array<{ label: string; value: string }>;
};

type EngineKey = "rareSpawn" | "catDrop" | "pokemon" | "progression" | "achievements" | "crew" | "dominion" | "contracts";

const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.35)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(90,0,0,.10)",
  marginBottom: 12,
};

const input: CSSProperties = {
  width: "100%",
  background: "#070707",
  border: "1px solid rgba(255,0,0,.45)",
  color: "#ffd3d3",
  borderRadius: 10,
  padding: "10px 12px",
};

const ENGINE_LINKS: Array<{ engine: EngineKey; href: string; title: string; description: string }> = [
  { engine: "rareSpawn", href: "/dashboard/rarespawn", title: "Rare Spawn", description: "Manual spawn windows, categories, and rare reward flow." },
  { engine: "catDrop", href: "/dashboard/catdrop", title: "Cat Drop", description: "Cat pool rotation, catch timing, tier rates, and theft/defense loop." },
  { engine: "pokemon", href: "/dashboard/pokemon-catching", title: "Pokemon", description: "Spawn lanes, catch timing, battle/trade routing, and trainer progression." },
  { engine: "progression", href: "/dashboard/economy/progression", title: "Progression", description: "XP intake, level-up routing, reward ladders, and anti-abuse." },
  { engine: "achievements", href: "/dashboard/achievements", title: "Achievements", description: "Achievement runtime catalog, command exposure, and unlock rewards." },
  { engine: "crew", href: "/dashboard/crew", title: "Crew", description: "Crew runtime, vault flow, and GTA crew progression." },
  { engine: "dominion", href: "/dashboard/dominion", title: "Dominion", description: "Dominion rivalry, raid, and alliance runtime." },
  { engine: "contracts", href: "/dashboard/contracts", title: "Contracts", description: "Contract task flow tied into the GTA crew stack." },
];

function getEngineValue(payload: EnginePayload | null | undefined, path: string[], fallback: any) {
  let current: any = payload?.config || {};
  for (const key of path) {
    if (!current || typeof current !== "object") return fallback;
    current = current[key];
  }
  return current === undefined ? fallback : current;
}

export default function GamesClient() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [engines, setEngines] = useState<Record<EngineKey, EnginePayload>>({
    rareSpawn: {},
    catDrop: {},
    pokemon: {},
    progression: {},
    achievements: {},
    crew: {},
    dominion: {},
    contracts: {},
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const resolved = resolveGuildContext();
    setGuildId(resolved.guildId);
    setGuildName(resolved.guildName);
  }, []);

  async function loadAll(targetGuildId: string) {
    if (!targetGuildId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const entries = await Promise.all(
        (ENGINE_LINKS.map((entry) => entry.engine) as EngineKey[]).map(async (engine) => {
          const json = await fetchRuntimeEngine(targetGuildId, engine);
          return [engine, { config: json?.config || {}, summary: Array.isArray(json?.summary) ? json.summary : [] }] as const;
        })
      );
      setEngines(Object.fromEntries(entries) as Record<EngineKey, EnginePayload>);
    } catch (err: any) {
      setMessage(err?.message || "Failed to load game engines.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll(guildId);
  }, [guildId]);

  async function saveEngine(engine: EngineKey, patch: Record<string, unknown>, okLabel: string) {
    if (!guildId) return;
    try {
      setSaving(true);
      setMessage("");
      const json = await saveRuntimeEngine(guildId, engine, patch);
      setEngines((prev) => ({
        ...prev,
        [engine]: { config: json?.config || {}, summary: Array.isArray(json?.summary) ? json.summary : [] },
      }));
      setMessage(okLabel);
    } catch (err: any) {
      setMessage(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const pokemonSummary = useMemo(() => engines.pokemon.summary || [], [engines.pokemon]);
  const progressionSummary = useMemo(() => engines.progression.summary || [], [engines.progression]);
  const crewSummary = useMemo(() => engines.crew.summary || [], [engines.crew]);

  if (!guildId && !loading) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from `/guilds` first.</div>;
  }

  return (
    <div style={{ maxWidth: 1280, color: "#ffcaca" }}>
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900, color: "#ff2f2f" }}>Games Control</div>
          <div style={{ color: "#ff9e9e", marginTop: 4 }}>Guild: {guildName || guildId}</div>
          <div style={{ color: "#ffb7b7", fontSize: 12, marginTop: 8 }}>
            This page now reads the live game engines directly instead of a dashboard-only `games-config` shadow file.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/dashboard/games/fun-modes?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Fun Modes</Link>
          <Link href={`/dashboard/pokemon-catching?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Pokemon Catching</Link>
          <Link href={`/dashboard/achievements?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Achievements</Link>
        </div>
      </div>

      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}
      {loading ? <div style={card}>Loading live game engines...</div> : null}

      {!loading ? (
        <>
          <GameSocialClient guildId={guildId} guildName={guildName} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 12 }}>
            {[
              ["Rare Spawn", (engines.rareSpawn.summary || [])[0]?.value || "Unknown"],
              ["Cat Drop", (engines.catDrop.summary || [])[0]?.value || "Unknown"],
              ["Pokemon", pokemonSummary[0]?.value || "Unknown"],
              ["Progression", progressionSummary[0]?.value || "Unknown"],
              ["Achievements", (engines.achievements.summary || [])[0]?.value || "Unknown"],
              ["Crew", crewSummary[0]?.value || "Unknown"],
            ].map(([label, value]) => (
              <div key={label} style={card}>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#ffadad" }}>{label}</div>
                <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: "#fff" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Rare Spawn</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.rareSpawn, ["enabled"], false))} onChange={(event) => void saveEngine("rareSpawn", { enabled: event.target.checked }, `Rare Spawn ${event.target.checked ? "enabled" : "disabled"}.`)} /> Enabled</label>
              <div><label>Min minutes</label><input style={input} type="number" value={getEngineValue(engines.rareSpawn, ["minMinutes"], 30)} onChange={(event) => setEngines((prev) => ({ ...prev, rareSpawn: { ...prev.rareSpawn, config: { ...(prev.rareSpawn.config || {}), minMinutes: Number(event.target.value || 0) } } }))} /></div>
              <div><label>Max minutes</label><input style={input} type="number" value={getEngineValue(engines.rareSpawn, ["maxMinutes"], 90)} onChange={(event) => setEngines((prev) => ({ ...prev, rareSpawn: { ...prev.rareSpawn, config: { ...(prev.rareSpawn.config || {}), maxMinutes: Number(event.target.value || 0) } } }))} /></div>
              <div><label>Spawn cooldown</label><input style={input} type="number" value={getEngineValue(engines.rareSpawn, ["cooldownMinutes"], 0)} onChange={(event) => setEngines((prev) => ({ ...prev, rareSpawn: { ...prev.rareSpawn, config: { ...(prev.rareSpawn.config || {}), cooldownMinutes: Number(event.target.value || 0) } } }))} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" disabled={saving} style={{ ...input, width: "auto", fontWeight: 800, cursor: "pointer" }} onClick={() => void saveEngine("rareSpawn", engines.rareSpawn.config || {}, "Saved Rare Spawn runtime.")}>Save Rare Spawn</button>
              <Link href={`/dashboard/rarespawn?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Rare Spawn</Link>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Cat Drop</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.catDrop, ["enabled"], false))} onChange={(event) => void saveEngine("catDrop", { enabled: event.target.checked }, `Cat Drop ${event.target.checked ? "enabled" : "disabled"}.`)} /> Enabled</label>
              <div><label>Interval minutes</label><input style={input} type="number" value={getEngineValue(engines.catDrop, ["spawnIntervalMinutes"], 4)} onChange={(event) => setEngines((prev) => ({ ...prev, catDrop: { ...prev.catDrop, config: { ...(prev.catDrop.config || {}), spawnIntervalMinutes: Number(event.target.value || 0) } } }))} /></div>
              <div><label>Max active spawns</label><input style={input} type="number" value={getEngineValue(engines.catDrop, ["maxActiveSpawns"], 2)} onChange={(event) => setEngines((prev) => ({ ...prev, catDrop: { ...prev.catDrop, config: { ...(prev.catDrop.config || {}), maxActiveSpawns: Number(event.target.value || 0) } } }))} /></div>
              <div><label>Despawn minutes</label><input style={input} type="number" value={getEngineValue(engines.catDrop, ["despawnMinutes"], 15)} onChange={(event) => setEngines((prev) => ({ ...prev, catDrop: { ...prev.catDrop, config: { ...(prev.catDrop.config || {}), despawnMinutes: Number(event.target.value || 0) } } }))} /></div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" disabled={saving} style={{ ...input, width: "auto", fontWeight: 800, cursor: "pointer" }} onClick={() => void saveEngine("catDrop", engines.catDrop.config || {}, "Saved Cat Drop runtime.")}>Save Cat Drop</button>
              <Link href={`/dashboard/catdrop?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Cat Drop</Link>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Pokemon</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.pokemon, ["guildAllowed"], false))} onChange={(event) => void saveEngine("pokemon", { guildAllowed: event.target.checked }, `Pokemon guild access ${event.target.checked ? "enabled" : "disabled"}.`)} /> Guild allowed</label>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.pokemon, ["enabled"], false))} onChange={(event) => void saveEngine("pokemon", { enabled: event.target.checked }, `Pokemon engine ${event.target.checked ? "enabled" : "disabled"}.`)} /> Engine enabled</label>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.pokemon, ["battleEnabled"], false))} onChange={(event) => void saveEngine("pokemon", { battleEnabled: event.target.checked }, `Pokemon battles ${event.target.checked ? "enabled" : "disabled"}.`)} /> Battles enabled</label>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.pokemon, ["tradingEnabled"], false))} onChange={(event) => void saveEngine("pokemon", { tradingEnabled: event.target.checked }, `Pokemon trades ${event.target.checked ? "enabled" : "disabled"}.`)} /> Trades enabled</label>
            </div>
            <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 10 }}>
              {pokemonSummary.map((row) => `${row.label}: ${row.value}`).join(" | ")}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <Link href={`/dashboard/pokemon-catching?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Catching</Link>
              <Link href={`/dashboard/pokemon-battle?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Battle</Link>
              <Link href={`/dashboard/pokemon-trade?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Trade</Link>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Progression + Achievements</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(180px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.progression, ["active"], false))} onChange={(event) => void saveEngine("progression", { active: event.target.checked }, `Progression ${event.target.checked ? "enabled" : "disabled"}.`)} /> Progression active</label>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.progression, ["xp", "enabled"], false))} onChange={(event) => void saveEngine("progression", { xp: { enabled: event.target.checked } }, `XP intake ${event.target.checked ? "enabled" : "disabled"}.`)} /> XP intake enabled</label>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.achievements, ["active"], false))} onChange={(event) => void saveEngine("achievements", { active: event.target.checked }, `Achievements ${event.target.checked ? "enabled" : "disabled"}.`)} /> Achievements active</label>
            </div>
            <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 10 }}>
              {(progressionSummary || []).map((row) => `${row.label}: ${row.value}`).join(" | ")}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <Link href={`/dashboard/economy/progression?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Progression</Link>
              <Link href={`/dashboard/achievements?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Achievements</Link>
              <Link href={`/dashboard/games/fun-modes?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Fun Modes</Link>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Crew + GTA Systems</h3>
            <div style={{ color: "#ffb3b3", fontSize: 12, marginBottom: 10 }}>
              GTA Ops is no longer a shell tab. Crew, Dominion, and Contracts live here directly as game engines.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(180px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.crew, ["enabled"], false))} onChange={(event) => void saveEngine("crew", { enabled: event.target.checked }, `Crew ${event.target.checked ? "enabled" : "disabled"}.`)} /> Crew enabled</label>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.dominion, ["enabled"], false))} onChange={(event) => void saveEngine("dominion", { enabled: event.target.checked }, `Dominion ${event.target.checked ? "enabled" : "disabled"}.`)} /> Dominion enabled</label>
              <label><input type="checkbox" checked={Boolean(getEngineValue(engines.contracts, ["enabled"], false))} onChange={(event) => void saveEngine("contracts", { enabled: event.target.checked }, `Contracts ${event.target.checked ? "enabled" : "disabled"}.`)} /> Contracts enabled</label>
            </div>
            <div style={{ color: "#ffb3b3", fontSize: 12, marginTop: 10 }}>
              {(engines.crew.summary || []).map((row) => `${row.label}: ${row.value}`).join(" | ")}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <Link href={`/dashboard/crew?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Crew</Link>
              <Link href={`/dashboard/dominion?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Dominion</Link>
              <Link href={`/dashboard/contracts?guildId=${encodeURIComponent(guildId)}`} style={{ ...input, width: "auto", textDecoration: "none", fontWeight: 800 }}>Open Contracts</Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
