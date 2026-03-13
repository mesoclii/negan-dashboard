"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { fetchRuntimeEngine, runRuntimeEngineAction, saveRuntimeEngine } from "@/lib/liveRuntime";

type EngineKey = "gameIdentity" | "presenceFusion" | "playtime" | "squadFinder" | "gameProvider" | "showoff";
type EnginePayload = { config?: Record<string, any>; summary?: Array<{ label: string; value: string }>; details?: Record<string, any> };
type Props = { guildId: string; guildName: string };

const card: CSSProperties = { border: "1px solid rgba(255,0,0,.35)", borderRadius: 12, padding: 14, background: "rgba(90,0,0,.10)", marginBottom: 12 };
const input: CSSProperties = { width: "100%", background: "#070707", border: "1px solid rgba(255,0,0,.45)", color: "#ffd3d3", borderRadius: 10, padding: "10px 12px" };
const button: CSSProperties = { ...input, width: "auto", fontWeight: 800, cursor: "pointer" };

const PROVIDERS = [
  { value: "apex", label: "Apex Legends" },
  { value: "fortnite", label: "Fortnite" },
  { value: "cod", label: "Call of Duty" },
  { value: "steam", label: "Steam" },
  { value: "xbox", label: "Xbox" },
  { value: "playstation", label: "PlayStation" },
  { value: "epic", label: "Epic Games" },
];
const GAME_PROVIDERS = PROVIDERS.filter((entry) => ["apex", "fortnite", "cod"].includes(entry.value));
const PLATFORMS = [
  { value: "", label: "Any / Unspecified" },
  { value: "pc", label: "PC" },
  { value: "xbox", label: "Xbox" },
  { value: "playstation", label: "PlayStation" },
  { value: "switch", label: "Switch" },
  { value: "mobile", label: "Mobile" },
];
const SOURCES = [
  { value: "manual", label: "Manual" },
  { value: "estimate", label: "Estimate" },
  { value: "public_profile", label: "Public Profile" },
  { value: "provider_api", label: "Provider API" },
  { value: "staff_verified", label: "Staff Verified" },
];
const VISIBILITY = [
  { value: "server", label: "Server" },
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

function normalizePayload(json: any): EnginePayload {
  return { config: json?.config || {}, summary: Array.isArray(json?.summary) ? json.summary : [], details: json?.details && typeof json.details === "object" ? json.details : {} };
}

function getValue(payload: EnginePayload | null | undefined, path: string[], fallback: any) {
  let current: any = payload?.config || {};
  for (const key of path) {
    if (!current || typeof current !== "object") return fallback;
    current = current[key];
  }
  return current === undefined ? fallback : current;
}

function summaryValue(summary: Array<{ label: string; value: string }> | undefined, label: string, fallback = "0") {
  return summary?.find((entry) => entry.label === label)?.value || fallback;
}

function parseOptionalNumber(value: string) {
  const parsed = Number(String(value || "").trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatRoleMap(value: any) {
  return Object.entries(value && typeof value === "object" ? value : {}).map(([tier, roleId]) => `${tier}:${roleId || ""}`).join("\n");
}

function parseRoleMap(value: string) {
  const out: Record<string, string> = {};
  for (const line of String(value || "").split(/\r?\n/)) {
    const [tier, roleId] = line.split(":").map((entry) => String(entry || "").trim());
    if (tier) out[tier] = roleId || "";
  }
  return out;
}

function listRows(value: any) {
  return Array.isArray(value) ? value : [];
}

export default function GameSocialClient({ guildId, guildName }: Props) {
  const [engines, setEngines] = useState<Record<EngineKey, EnginePayload>>({ gameIdentity: {}, presenceFusion: {}, playtime: {}, squadFinder: {}, gameProvider: {}, showoff: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [identityForm, setIdentityForm] = useState({ userId: "", providerKey: "apex", handle: "", platform: "", accountId: "", visibility: "server" });
  const [playtimeForm, setPlaytimeForm] = useState({ userId: "", game: "", platform: "", hours: "", sourceKey: "manual", notes: "" });
  const [statsForm, setStatsForm] = useState({ userId: "", providerKey: "apex", platform: "", rankTier: "", rankLabel: "", rating: "", kills: "", wins: "", kd: "", mode: "", map: "", sourceKey: "manual", notes: "" });
  const [mapForm, setMapForm] = useState({ providerKey: "apex", mode: "", currentMap: "", nextMap: "", expiresInMinutes: "", sourceKey: "manual", notes: "" });
  const [rankSyncForm, setRankSyncForm] = useState({ userId: "", gameKey: "" });

  async function loadAll(targetGuildId: string) {
    if (!targetGuildId) return;
    try {
      setLoading(true);
      const [gameIdentity, presenceFusion, playtime, squadFinder, gameProvider, showoff] = await Promise.all([
        fetchRuntimeEngine(targetGuildId, "gameIdentity"),
        fetchRuntimeEngine(targetGuildId, "presenceFusion"),
        fetchRuntimeEngine(targetGuildId, "playtime"),
        fetchRuntimeEngine(targetGuildId, "squadFinder"),
        fetchRuntimeEngine(targetGuildId, "gameProvider"),
        fetchRuntimeEngine(targetGuildId, "showoff"),
      ]);
      setEngines({ gameIdentity: normalizePayload(gameIdentity), presenceFusion: normalizePayload(presenceFusion), playtime: normalizePayload(playtime), squadFinder: normalizePayload(squadFinder), gameProvider: normalizePayload(gameProvider), showoff: normalizePayload(showoff) });
    } catch (err: any) {
      setMessage(err?.message || "Failed to load game social engines.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadAll(guildId); }, [guildId]);

  function updateConfig(engine: EngineKey, patch: Record<string, unknown>) {
    setEngines((prev) => ({ ...prev, [engine]: { ...prev[engine], config: { ...(prev[engine].config || {}), ...patch } } }));
  }

  async function saveConfig(engine: EngineKey, patch: Record<string, unknown>, okLabel: string) {
    try {
      setSaving(true);
      setMessage("");
      const json = await saveRuntimeEngine(guildId, engine, patch);
      setEngines((prev) => ({ ...prev, [engine]: normalizePayload(json) }));
      setMessage(okLabel);
    } catch (err: any) {
      setMessage(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(engine: EngineKey, action: string, payload: Record<string, unknown>, okLabel: string) {
    try {
      setSaving(true);
      setMessage("");
      await runRuntimeEngineAction(guildId, engine, action, payload);
      await loadAll(guildId);
      setMessage(okLabel);
    } catch (err: any) {
      setMessage(err?.message || "Action failed.");
    } finally {
      setSaving(false);
    }
  }

  const identitySummary = useMemo(() => engines.gameIdentity.summary || [], [engines.gameIdentity]);
  const presenceSummary = useMemo(() => engines.presenceFusion.summary || [], [engines.presenceFusion]);
  const playtimeSummary = useMemo(() => engines.playtime.summary || [], [engines.playtime]);
  const squadSummary = useMemo(() => engines.squadFinder.summary || [], [engines.squadFinder]);
  const providerSummary = useMemo(() => engines.gameProvider.summary || [], [engines.gameProvider]);
  const showoffSummary = useMemo(() => engines.showoff.summary || [], [engines.showoff]);

  const linkedProfiles = listRows(engines.gameIdentity.details?.linkedProfiles);
  const livePlayers = listRows(engines.presenceFusion.details?.livePlayers);
  const playtimeLeaders = listRows(engines.playtime.details?.leaders);
  const playtimeRecords = listRows(engines.playtime.details?.records);
  const statRows = listRows(engines.gameProvider.details?.stats);
  const mapRows = listRows(engines.gameProvider.details?.mapRotations);
  const providerCapabilities = listRows(engines.gameProvider.details?.capabilities);
  const showoffRows = listRows(engines.showoff.details?.previews);
  const squadRows = listRows(engines.squadFinder.details?.activeSquads);

  return (
    <div style={{ ...card, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900, color: "#ff2f2f" }}>Game Social Stack</div>
          <div style={{ color: "#ff9e9e", marginTop: 4 }}>Guild: {guildName || guildId}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(130px,1fr))", gap: 8, minWidth: 360 }}>
          <div style={card}><div style={{ fontSize: 11, textTransform: "uppercase", color: "#ffadad" }}>Linked</div><div style={{ fontSize: 22, fontWeight: 900 }}>{summaryValue(identitySummary, "Linked Accounts")}</div></div>
          <div style={card}><div style={{ fontSize: 11, textTransform: "uppercase", color: "#ffadad" }}>Live</div><div style={{ fontSize: 22, fontWeight: 900 }}>{summaryValue(presenceSummary, "Live Players")}</div></div>
          <div style={card}><div style={{ fontSize: 11, textTransform: "uppercase", color: "#ffadad" }}>Hours</div><div style={{ fontSize: 22, fontWeight: 900 }}>{summaryValue(playtimeSummary, "Total Hours")}</div></div>
          <div style={card}><div style={{ fontSize: 11, textTransform: "uppercase", color: "#ffadad" }}>Squads</div><div style={{ fontSize: 22, fontWeight: 900 }}>{summaryValue(squadSummary, "Open Squads")}</div></div>
          <div style={card}><div style={{ fontSize: 11, textTransform: "uppercase", color: "#ffadad" }}>Stats</div><div style={{ fontSize: 22, fontWeight: 900 }}>{summaryValue(providerSummary, "Stats Records")}</div></div>
          <div style={card}><div style={{ fontSize: 11, textTransform: "uppercase", color: "#ffadad" }}>Card</div><div style={{ fontSize: 22, fontWeight: 900 }}>{summaryValue(showoffSummary, "Active", "Enabled")}</div></div>
        </div>
      </div>
      {message ? <div style={{ marginTop: 10, color: "#ffd27a" }}>{message}</div> : null}
      {loading ? <div style={{ marginTop: 10, color: "#ffb7b7" }}>Loading game social engines...</div> : null}
      {!loading ? (
        <>
          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Game Identity</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.gameIdentity, ["enabled"], true))} onChange={(event) => updateConfig("gameIdentity", { enabled: event.target.checked })} /> Enabled</label>
              <input style={input} type="number" placeholder="Max links per member" value={getValue(engines.gameIdentity, ["maxLinksPerMember"], 8)} onChange={(event) => updateConfig("gameIdentity", { maxLinksPerMember: Number(event.target.value || 0) })} />
              <select style={input} value={getValue(engines.gameIdentity, ["defaultVisibility"], "server")} onChange={(event) => updateConfig("gameIdentity", { defaultVisibility: event.target.value })}>{VISIBILITY.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
              <input style={input} placeholder="Notes" value={getValue(engines.gameIdentity, ["notes"], "")} onChange={(event) => updateConfig("gameIdentity", { notes: event.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={button} disabled={saving} onClick={() => void saveConfig("gameIdentity", engines.gameIdentity.config || {}, "Saved game identity settings.")}>Save Identity Engine</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(260px,1fr))", gap: 12, marginTop: 12 }}>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Manage Linked Identity</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <input style={input} placeholder="Discord user ID" value={identityForm.userId} onChange={(event) => setIdentityForm((prev) => ({ ...prev, userId: event.target.value }))} />
                  <select style={input} value={identityForm.providerKey} onChange={(event) => setIdentityForm((prev) => ({ ...prev, providerKey: event.target.value }))}>{PROVIDERS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} placeholder="Gamertag / handle" value={identityForm.handle} onChange={(event) => setIdentityForm((prev) => ({ ...prev, handle: event.target.value }))} />
                  <select style={input} value={identityForm.platform} onChange={(event) => setIdentityForm((prev) => ({ ...prev, platform: event.target.value }))}>{PLATFORMS.map((entry) => <option key={entry.value || "any"} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} placeholder="Account ID / UID" value={identityForm.accountId} onChange={(event) => setIdentityForm((prev) => ({ ...prev, accountId: event.target.value }))} />
                  <select style={input} value={identityForm.visibility} onChange={(event) => setIdentityForm((prev) => ({ ...prev, visibility: event.target.value }))}>{VISIBILITY.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("gameIdentity", "upsertIdentity", identityForm, "Linked identity saved.")}>Add / Update</button>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("gameIdentity", "removeIdentity", identityForm, "Linked identity removed.")}>Remove</button>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Recent Linked Profiles</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {linkedProfiles.length ? linkedProfiles.map((entry: any) => <div key={entry.id}><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div>) : <div style={{ color: "#ffb3b3" }}>No linked identities yet.</div>}
                </div>
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Presence Fusion</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.presenceFusion, ["enabled"], true))} onChange={(event) => updateConfig("presenceFusion", { enabled: event.target.checked })} /> Enabled</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.presenceFusion, ["captureDiscordPresence"], true))} onChange={(event) => updateConfig("presenceFusion", { captureDiscordPresence: event.target.checked })} /> Capture presence</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.presenceFusion, ["requireGamingActivity"], true))} onChange={(event) => updateConfig("presenceFusion", { requireGamingActivity: event.target.checked })} /> Gaming only</label>
              <input style={input} type="number" placeholder="Presence window (min)" value={getValue(engines.presenceFusion, ["presenceMaxAgeMinutes"], 180)} onChange={(event) => updateConfig("presenceFusion", { presenceMaxAgeMinutes: Number(event.target.value || 0) })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={button} disabled={saving} onClick={() => void saveConfig("presenceFusion", engines.presenceFusion.config || {}, "Saved presence fusion settings.")}>Save Presence Fusion</button>
              <button type="button" style={button} disabled={saving} onClick={() => void runAction("presenceFusion", "clearPresence", {}, "Cleared cached presence snapshots.")}>Clear Presence Cache</button>
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {livePlayers.length ? livePlayers.map((entry: any) => <div key={`${entry.userId}-${entry.title}`} style={{ ...card, marginBottom: 0 }}><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div>) : <div style={{ color: "#ffb3b3" }}>No recent game presence captured.</div>}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Game Provider</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.gameProvider, ["enabled"], true))} onChange={(event) => updateConfig("gameProvider", { enabled: event.target.checked })} /> Enabled</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.gameProvider, ["allowManualStats"], true))} onChange={(event) => updateConfig("gameProvider", { allowManualStats: event.target.checked })} /> Manual stats</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.gameProvider, ["allowManualMapRotation"], true))} onChange={(event) => updateConfig("gameProvider", { allowManualMapRotation: event.target.checked })} /> Manual maps</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.gameProvider, ["autoSyncRankRoles"], true))} onChange={(event) => updateConfig("gameProvider", { autoSyncRankRoles: event.target.checked })} /> Auto rank sync</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(180px,1fr))", gap: 10, marginTop: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.gameProvider, ["removeOtherRankRoles"], true))} onChange={(event) => updateConfig("gameProvider", { removeOtherRankRoles: event.target.checked })} /> Remove lower roles</label>
              <select style={input} value={getValue(engines.gameProvider, ["defaultSource"], "manual")} onChange={(event) => updateConfig("gameProvider", { defaultSource: event.target.value })}>{SOURCES.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
              <input style={input} placeholder="Notes" value={getValue(engines.gameProvider, ["notes"], "")} onChange={(event) => updateConfig("gameProvider", { notes: event.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
              {GAME_PROVIDERS.map((entry) => <label key={entry.value}><input type="checkbox" checked={Array.isArray(engines.gameProvider.config?.allowedProviders) ? engines.gameProvider.config.allowedProviders.includes(entry.value) : false} onChange={() => updateConfig("gameProvider", { allowedProviders: (Array.isArray(engines.gameProvider.config?.allowedProviders) ? engines.gameProvider.config.allowedProviders : []).includes(entry.value) ? engines.gameProvider.config?.allowedProviders.filter((value: string) => value !== entry.value) : [...(Array.isArray(engines.gameProvider.config?.allowedProviders) ? engines.gameProvider.config.allowedProviders : []), entry.value] })} /> {entry.label}</label>)}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={button} disabled={saving} onClick={() => void saveConfig("gameProvider", engines.gameProvider.config || {}, "Saved game provider settings.")}>Save Provider Engine</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12, marginTop: 12 }}>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Stats Snapshot</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <input style={input} placeholder="Discord user ID" value={statsForm.userId} onChange={(event) => setStatsForm((prev) => ({ ...prev, userId: event.target.value }))} />
                  <select style={input} value={statsForm.providerKey} onChange={(event) => setStatsForm((prev) => ({ ...prev, providerKey: event.target.value }))}>{GAME_PROVIDERS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                  <select style={input} value={statsForm.platform} onChange={(event) => setStatsForm((prev) => ({ ...prev, platform: event.target.value }))}>{PLATFORMS.map((entry) => <option key={entry.value || "any"} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} placeholder="Rank tier key" value={statsForm.rankTier} onChange={(event) => setStatsForm((prev) => ({ ...prev, rankTier: event.target.value }))} />
                  <input style={input} placeholder="Rank label" value={statsForm.rankLabel} onChange={(event) => setStatsForm((prev) => ({ ...prev, rankLabel: event.target.value }))} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(120px,1fr))", gap: 8 }}>
                    <input style={input} placeholder="Rating" value={statsForm.rating} onChange={(event) => setStatsForm((prev) => ({ ...prev, rating: event.target.value }))} />
                    <input style={input} placeholder="Kills" value={statsForm.kills} onChange={(event) => setStatsForm((prev) => ({ ...prev, kills: event.target.value }))} />
                    <input style={input} placeholder="Wins" value={statsForm.wins} onChange={(event) => setStatsForm((prev) => ({ ...prev, wins: event.target.value }))} />
                    <input style={input} placeholder="KD" value={statsForm.kd} onChange={(event) => setStatsForm((prev) => ({ ...prev, kd: event.target.value }))} />
                  </div>
                  <input style={input} placeholder="Current mode" value={statsForm.mode} onChange={(event) => setStatsForm((prev) => ({ ...prev, mode: event.target.value }))} />
                  <input style={input} placeholder="Current map" value={statsForm.map} onChange={(event) => setStatsForm((prev) => ({ ...prev, map: event.target.value }))} />
                  <select style={input} value={statsForm.sourceKey} onChange={(event) => setStatsForm((prev) => ({ ...prev, sourceKey: event.target.value }))}>{SOURCES.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} placeholder="Notes" value={statsForm.notes} onChange={(event) => setStatsForm((prev) => ({ ...prev, notes: event.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("gameProvider", "upsertStats", { ...statsForm, rating: parseOptionalNumber(statsForm.rating), kills: parseOptionalNumber(statsForm.kills), wins: parseOptionalNumber(statsForm.wins), kd: parseOptionalNumber(statsForm.kd) }, "Saved provider stats snapshot.")}>Save Stats</button>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Map Rotation + Rank Sync</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <select style={input} value={mapForm.providerKey} onChange={(event) => setMapForm((prev) => ({ ...prev, providerKey: event.target.value }))}>{GAME_PROVIDERS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} placeholder="Mode / queue" value={mapForm.mode} onChange={(event) => setMapForm((prev) => ({ ...prev, mode: event.target.value }))} />
                  <input style={input} placeholder="Current map" value={mapForm.currentMap} onChange={(event) => setMapForm((prev) => ({ ...prev, currentMap: event.target.value }))} />
                  <input style={input} placeholder="Next map" value={mapForm.nextMap} onChange={(event) => setMapForm((prev) => ({ ...prev, nextMap: event.target.value }))} />
                  <input style={input} placeholder="Expires in minutes" value={mapForm.expiresInMinutes} onChange={(event) => setMapForm((prev) => ({ ...prev, expiresInMinutes: event.target.value }))} />
                  <select style={input} value={mapForm.sourceKey} onChange={(event) => setMapForm((prev) => ({ ...prev, sourceKey: event.target.value }))}>{SOURCES.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} placeholder="Rank sync user ID" value={rankSyncForm.userId} onChange={(event) => setRankSyncForm((prev) => ({ ...prev, userId: event.target.value }))} />
                  <select style={input} value={rankSyncForm.gameKey} onChange={(event) => setRankSyncForm((prev) => ({ ...prev, gameKey: event.target.value }))}><option value="">All supported games</option>{GAME_PROVIDERS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("gameProvider", "setMapRotation", { ...mapForm, expiresInMinutes: parseOptionalNumber(mapForm.expiresInMinutes) }, "Saved map rotation snapshot.")}>Save Map</button>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("gameProvider", "syncRankRoles", rankSyncForm, "Rank role sync requested.")}>Sync Roles</button>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
              <div style={card}><div style={{ fontWeight: 800, marginBottom: 8 }}>Apex Role Map</div><textarea style={{ ...input, minHeight: 150 }} value={formatRoleMap(getValue(engines.gameProvider, ["rankRoleSync", "apex"], {}))} onChange={(event) => updateConfig("gameProvider", { rankRoleSync: { ...(engines.gameProvider.config?.rankRoleSync || {}), apex: parseRoleMap(event.target.value) } })} /></div>
              <div style={card}><div style={{ fontWeight: 800, marginBottom: 8 }}>Fortnite Role Map</div><textarea style={{ ...input, minHeight: 150 }} value={formatRoleMap(getValue(engines.gameProvider, ["rankRoleSync", "fortnite"], {}))} onChange={(event) => updateConfig("gameProvider", { rankRoleSync: { ...(engines.gameProvider.config?.rankRoleSync || {}), fortnite: parseRoleMap(event.target.value) } })} /></div>
              <div style={card}><div style={{ fontWeight: 800, marginBottom: 8 }}>CoD Role Map</div><textarea style={{ ...input, minHeight: 150 }} value={formatRoleMap(getValue(engines.gameProvider, ["rankRoleSync", "cod"], {}))} onChange={(event) => updateConfig("gameProvider", { rankRoleSync: { ...(engines.gameProvider.config?.rankRoleSync || {}), cod: parseRoleMap(event.target.value) } })} /></div>
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {providerCapabilities.length ? providerCapabilities.map((entry: any) => <div key={entry.key} style={{ ...card, marginBottom: 0 }}><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div>) : null}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12, marginTop: 12 }}>
              <div style={{ display: "grid", gap: 8 }}>{statRows.length ? statRows.map((entry: any) => <div key={entry.id || entry.title} style={{ ...card, marginBottom: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><div><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div>{entry.id ? <button type="button" style={button} disabled={saving} onClick={() => void runAction("gameProvider", "removeStats", { recordId: entry.id }, "Removed provider stats snapshot.")}>Remove</button> : null}</div></div>) : <div style={{ color: "#ffb3b3" }}>No game stats snapshots recorded.</div>}</div>
              <div style={{ display: "grid", gap: 8 }}>{mapRows.length ? mapRows.map((entry: any) => <div key={entry.id || entry.title} style={{ ...card, marginBottom: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><div><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div>{entry.id ? <button type="button" style={button} disabled={saving} onClick={() => void runAction("gameProvider", "removeMapRotation", { recordId: entry.id }, "Removed map rotation snapshot.")}>Remove</button> : null}</div></div>) : <div style={{ color: "#ffb3b3" }}>No map rotation snapshots recorded.</div>}</div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Playtime</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.playtime, ["enabled"], true))} onChange={(event) => updateConfig("playtime", { enabled: event.target.checked })} /> Enabled</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.playtime, ["allowManualEntries"], true))} onChange={(event) => updateConfig("playtime", { allowManualEntries: event.target.checked })} /> Manual entries</label>
              <select style={input} value={getValue(engines.playtime, ["defaultSource"], "manual")} onChange={(event) => updateConfig("playtime", { defaultSource: event.target.value })}>{SOURCES.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
              <input style={input} type="number" placeholder="Max hours per record" value={getValue(engines.playtime, ["maxHoursPerRecord"], 50000)} onChange={(event) => updateConfig("playtime", { maxHoursPerRecord: Number(event.target.value || 0) })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={button} disabled={saving} onClick={() => void saveConfig("playtime", engines.playtime.config || {}, "Saved playtime engine settings.")}>Save Playtime Engine</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(260px,1fr))", gap: 12, marginTop: 12 }}>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Record Hours</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <input style={input} placeholder="Discord user ID" value={playtimeForm.userId} onChange={(event) => setPlaytimeForm((prev) => ({ ...prev, userId: event.target.value }))} />
                  <input style={input} placeholder="Game title" value={playtimeForm.game} onChange={(event) => setPlaytimeForm((prev) => ({ ...prev, game: event.target.value }))} />
                  <select style={input} value={playtimeForm.platform} onChange={(event) => setPlaytimeForm((prev) => ({ ...prev, platform: event.target.value }))}>{PLATFORMS.map((entry) => <option key={entry.value || "any"} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} type="number" placeholder="Hours" value={playtimeForm.hours} onChange={(event) => setPlaytimeForm((prev) => ({ ...prev, hours: event.target.value }))} />
                  <select style={input} value={playtimeForm.sourceKey} onChange={(event) => setPlaytimeForm((prev) => ({ ...prev, sourceKey: event.target.value }))}>{SOURCES.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</select>
                  <input style={input} placeholder="Notes" value={playtimeForm.notes} onChange={(event) => setPlaytimeForm((prev) => ({ ...prev, notes: event.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button type="button" style={button} disabled={saving} onClick={() => void runAction("playtime", "recordHours", { ...playtimeForm, hours: Number(playtimeForm.hours || 0) }, "Playtime record saved.")}>Record Hours</button>
                </div>
              </div>
              <div style={card}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Top Recorded Hours</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {playtimeLeaders.length ? playtimeLeaders.map((entry: any) => <div key={`${entry.userId}-${entry.rank}`}><div style={{ fontWeight: 700 }}>#{entry.rank} {entry.name}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div>) : <div style={{ color: "#ffb3b3" }}>No recorded hours yet.</div>}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {playtimeRecords.length ? playtimeRecords.map((entry: any) => <div key={entry.id} style={{ ...card, marginBottom: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><div><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div><button type="button" style={button} disabled={saving} onClick={() => void runAction("playtime", "removeRecord", { recordId: entry.id }, "Playtime record removed.")}>Remove</button></div></div>) : <div style={{ color: "#ffb3b3" }}>No records yet.</div>}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Showoff Card</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.showoff, ["enabled"], true))} onChange={(event) => updateConfig("showoff", { enabled: event.target.checked })} /> Enabled</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.showoff, ["includeLinks"], true))} onChange={(event) => updateConfig("showoff", { includeLinks: event.target.checked })} /> Links</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.showoff, ["includePresence"], true))} onChange={(event) => updateConfig("showoff", { includePresence: event.target.checked })} /> Presence</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.showoff, ["includeStats"], true))} onChange={(event) => updateConfig("showoff", { includeStats: event.target.checked })} /> Stats</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10, marginTop: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.showoff, ["includePlaytime"], true))} onChange={(event) => updateConfig("showoff", { includePlaytime: event.target.checked })} /> Playtime</label>
              <input style={input} placeholder="Accent color" value={getValue(engines.showoff, ["accentColor"], "#b91c1c")} onChange={(event) => updateConfig("showoff", { accentColor: event.target.value })} />
              <input style={input} placeholder="Card title" value={getValue(engines.showoff, ["cardTitle"], "{{user}} Gamer Card")} onChange={(event) => updateConfig("showoff", { cardTitle: event.target.value })} />
              <input style={input} placeholder="Headline" value={getValue(engines.showoff, ["headline"], "Unified game profile card")} onChange={(event) => updateConfig("showoff", { headline: event.target.value })} />
            </div>
            <div style={{ marginTop: 10 }}>
              <input style={input} placeholder="Notes" value={getValue(engines.showoff, ["notes"], "")} onChange={(event) => updateConfig("showoff", { notes: event.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={button} disabled={saving} onClick={() => void saveConfig("showoff", engines.showoff.config || {}, "Saved showoff card settings.")}>Save Showoff Engine</button>
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {showoffRows.length ? showoffRows.map((entry: any, index: number) => <div key={`${entry.userId || entry.title}-${index}`} style={{ ...card, marginBottom: 0 }}><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div>) : <div style={{ color: "#ffb3b3" }}>No preview candidates yet.</div>}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", textTransform: "uppercase", letterSpacing: "0.08em" }}>Squad Finder</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(160px,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={Boolean(getValue(engines.squadFinder, ["enabled"], true))} onChange={(event) => updateConfig("squadFinder", { enabled: event.target.checked })} /> Enabled</label>
              <label><input type="checkbox" checked={Boolean(getValue(engines.squadFinder, ["autoCreateThread"], true))} onChange={(event) => updateConfig("squadFinder", { autoCreateThread: event.target.checked })} /> Auto thread</label>
              <input style={input} placeholder="Default LFG channel ID" value={getValue(engines.squadFinder, ["defaultChannelId"], "")} onChange={(event) => updateConfig("squadFinder", { defaultChannelId: event.target.value })} />
              <input style={input} type="number" placeholder="Default TTL (hours)" value={getValue(engines.squadFinder, ["defaultTtlHours"], 6)} onChange={(event) => updateConfig("squadFinder", { defaultTtlHours: Number(event.target.value || 0) })} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" style={button} disabled={saving} onClick={() => void saveConfig("squadFinder", engines.squadFinder.config || {}, "Saved squad finder settings.")}>Save Squad Finder</button>
              <button type="button" style={button} disabled={saving} onClick={() => void runAction("squadFinder", "closeAllSessions", {}, "Closed all active squad sessions.")}>Close All Sessions</button>
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {squadRows.length ? squadRows.map((entry: any) => <div key={entry.sessionId} style={{ ...card, marginBottom: 0 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><div><div style={{ fontWeight: 700 }}>{entry.title}</div><div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div></div><button type="button" style={button} disabled={saving} onClick={() => void runAction("squadFinder", "closeSession", { sessionId: entry.sessionId }, "Squad session closed.")}>Close</button></div></div>) : <div style={{ color: "#ffb3b3" }}>No active squad sessions.</div>}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
