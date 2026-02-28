"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string };

const DEFAULT_FEATURES = {
  rareDropEnabled: false,
  catdropEnabled: false,
  pokemonEnabled: true,
  pokemonPrivateOnly: true,
  crewEnabled: false,
  contractsEnabled: false,
  progressionEnabled: false
};

const DEFAULT_POKEMON = {
  enabled: true,
  battleEnabled: true,
  tradingEnabled: true,
  spawnIntervalMinutes: 20,
  maxActiveSpawns: 2,
  allowedChannelIds: [] as string[]
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function getGuildIdClient(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function cardStyle(): React.CSSProperties {
  return {
    border: "1px solid rgba(255,0,0,.28)",
    borderRadius: 12,
    background: "rgba(85,0,0,.10)",
    marginBottom: 14
  };
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    background: "#0a0a0a",
    border: "1px solid rgba(255,0,0,.35)",
    color: "#ffd1d1",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: "block",
    marginBottom: 6,
    color: "#fca5a5",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  };
}

function Pill({ on }: { on: boolean }) {
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: "0.08em",
        border: on ? "1px solid rgba(16,185,129,.6)" : "1px solid rgba(239,68,68,.6)",
        background: on ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)",
        color: on ? "#86efac" : "#fca5a5"
      }}
    >
      {on ? "ON" : "OFF"}
    </span>
  );
}

async function saveEngine(guildId: string, engine: string, config: any) {
  const tries = [
    { guildId, engine, config },
    { guildId, engine, patch: config },
    { guildId, engine, data: config }
  ];

  for (const body of tries) {
    const r = await fetch("/api/bot/engine-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.success !== false) return j;
  }
  throw new Error("Failed to save engine config.");
}

export default function GamesPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [channels, setChannels] = useState<Channel[]>([]);

  const [features, setFeatures] = useState<any>(clone(DEFAULT_FEATURES));
  const [baseFeatures, setBaseFeatures] = useState<any>(clone(DEFAULT_FEATURES));

  const [pokeCfg, setPokeCfg] = useState<any>(clone(DEFAULT_POKEMON));
  const [basePokeCfg, setBasePokeCfg] = useState<any>(clone(DEFAULT_POKEMON));

  const channelOptions = useMemo(
    () => channels.map((c) => ({ id: c.id, name: `#${c.name}` })),
    [channels]
  );

  const featuresDirty = JSON.stringify(features) !== JSON.stringify(baseFeatures);
  const pokeDirty = JSON.stringify(pokeCfg) !== JSON.stringify(basePokeCfg);
  const dirtyCount = Number(featuresDirty) + Number(pokeDirty);

  useEffect(() => {
    setGuildId(getGuildIdClient());
  }, []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const [cfgRes, gdRes, pokeRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=pokemon`)
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        const pokeJson = await pokeRes.json().catch(() => ({}));

        const mergedFeatures = { ...DEFAULT_FEATURES, ...(cfgJson?.config?.features || {}) };
        setFeatures(mergedFeatures);
        setBaseFeatures(clone(mergedFeatures));

        const mergedPoke = { ...DEFAULT_POKEMON, ...(pokeJson?.config || {}) };
        setPokeCfg(mergedPoke);
        setBasePokeCfg(clone(mergedPoke));

        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed loading game settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveFeatures() {
    const res = await fetch("/api/bot/dashboard-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch: { features } })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) throw new Error(json?.error || "Feature save failed");
    const merged = { ...DEFAULT_FEATURES, ...(json?.config?.features || {}) };
    setFeatures(merged);
    setBaseFeatures(clone(merged));
  }

  async function savePokemon() {
    const json = await saveEngine(guildId, "pokemon", pokeCfg);
    const merged = { ...DEFAULT_POKEMON, ...(json?.config || pokeCfg) };
    setPokeCfg(merged);
    setBasePokeCfg(clone(merged));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      if (featuresDirty) await saveFeatures();
      if (pokeDirty) await savePokemon();
      setMsg("Game settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId && !loading) {
    return <div style={{ color: "#f87171", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;
  }

  if (loading) {
    return <div style={{ color: "#fecaca", padding: 20 }}>Loading game settings...</div>;
  }

  return (
    <div style={{ maxWidth: 1240, margin: "0 auto", color: "#fecaca" }}>
      <div style={{ ...cardStyle(), padding: 14, position: "sticky", top: 8, zIndex: 20, backdropFilter: "blur(4px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Games Center
            </div>
            <div style={{ color: "#fca5a5", marginTop: 4, fontSize: 13 }}>Guild: {guildId}</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: "0.08em",
                border: dirtyCount ? "1px solid rgba(245,158,11,.6)" : "1px solid rgba(148,163,184,.45)",
                background: dirtyCount ? "rgba(245,158,11,.14)" : "rgba(148,163,184,.12)",
                color: dirtyCount ? "#fcd34d" : "#cbd5e1"
              }}
            >
              {dirtyCount ? `${dirtyCount} UNSAVED` : "ALL SAVED"}
            </span>

            <button
              onClick={() => {
                setFeatures(clone(baseFeatures));
                setPokeCfg(clone(basePokeCfg));
                setMsg("Reverted unsaved changes.");
              }}
              disabled={saving || !dirtyCount}
              style={{ ...inputStyle(), width: "auto", padding: "8px 12px", cursor: "pointer" }}
            >
              Revert
            </button>

            <button
              onClick={saveAll}
              disabled={saving || !dirtyCount}
              style={{
                border: "1px solid rgba(255,0,0,.75)",
                borderRadius: 10,
                background: "rgba(255,0,0,.2)",
                color: "#fff",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontSize: 12,
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
        {msg ? <div style={{ marginTop: 8, color: "#fcd34d", fontSize: 12 }}>{msg}</div> : null}
      </div>

      <details open style={cardStyle()}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
            Game Module Toggles
          </span>
          <Pill on={!!features.pokemonEnabled || !!features.rareDropEnabled || !!features.catdropEnabled} />
        </summary>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(220px,1fr))", gap: 12 }}>
            {[
              ["rareDropEnabled", "Rare Drop"],
              ["catdropEnabled", "Cat Drop"],
              ["pokemonEnabled", "Pokemon"],
              ["pokemonPrivateOnly", "Pokemon Private Only"],
              ["crewEnabled", "Crew Engine"],
              ["contractsEnabled", "Contracts"],
              ["progressionEnabled", "Progression"]
            ].map(([k, label]) => (
              <label key={k} style={{ ...labelStyle(), marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={!!features[k]}
                  onChange={(e) => setFeatures((p: any) => ({ ...p, [k]: e.target.checked }))}
                />{" "}
                {label}
              </label>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={async () => {
                setSaving(true);
                setMsg("");
                try {
                  await saveFeatures();
                  setMsg("Game module toggles saved.");
                } catch (e: any) {
                  setMsg(e?.message || "Save failed.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              style={{
                border: "1px solid rgba(255,0,0,.55)",
                borderRadius: 10,
                background: "rgba(255,0,0,.12)",
                color: "#fff",
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Save Game Modules
            </button>
          </div>
        </div>
      </details>

      <details open style={cardStyle()}>
        <summary style={{ cursor: "pointer", padding: "12px 14px", borderBottom: "1px solid rgba(255,0,0,.2)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 13 }}>
            Pokemon Engine
          </span>
          <Pill on={!!pokeCfg.enabled} />
        </summary>
        <div style={{ padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12 }}>
            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!pokeCfg.enabled}
                onChange={(e) => setPokeCfg((p: any) => ({ ...p, enabled: e.target.checked }))}
              />{" "}
              Engine Enabled
            </label>

            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!pokeCfg.battleEnabled}
                onChange={(e) => setPokeCfg((p: any) => ({ ...p, battleEnabled: e.target.checked }))}
              />{" "}
              Battle Enabled
            </label>

            <label style={labelStyle()}>
              <input
                type="checkbox"
                checked={!!pokeCfg.tradingEnabled}
                onChange={(e) => setPokeCfg((p: any) => ({ ...p, tradingEnabled: e.target.checked }))}
              />{" "}
              Trading Enabled
            </label>

            <div>
              <span style={labelStyle()}>Spawn Interval (minutes)</span>
              <input
                type="number"
                style={inputStyle()}
                value={Number(pokeCfg.spawnIntervalMinutes || 20)}
                onChange={(e) => setPokeCfg((p: any) => ({ ...p, spawnIntervalMinutes: Number(e.target.value || 20) }))}
              />
            </div>

            <div>
              <span style={labelStyle()}>Max Active Spawns</span>
              <input
                type="number"
                style={inputStyle()}
                value={Number(pokeCfg.maxActiveSpawns || 2)}
                onChange={(e) => setPokeCfg((p: any) => ({ ...p, maxActiveSpawns: Number(e.target.value || 2) }))}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <span style={labelStyle()}>Allowed Pokemon Channels</span>
            <select
              multiple
              value={Array.isArray(pokeCfg.allowedChannelIds) ? pokeCfg.allowedChannelIds : []}
              onChange={(e) => {
                const vals = Array.from(e.target.selectedOptions).map((o) => o.value);
                setPokeCfg((p: any) => ({ ...p, allowedChannelIds: vals }));
              }}
              style={{ ...inputStyle(), minHeight: 160 }}
            >
              {channelOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={async () => {
                setSaving(true);
                setMsg("");
                try {
                  await savePokemon();
                  setMsg("Pokemon settings saved.");
                } catch (e: any) {
                  setMsg(e?.message || "Save failed.");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              style={{
                border: "1px solid rgba(255,0,0,.55)",
                borderRadius: 10,
                background: "rgba(255,0,0,.12)",
                color: "#fff",
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Save Pokemon
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
