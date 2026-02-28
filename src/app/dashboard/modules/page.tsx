"use client";

import { useEffect, useMemo, useState } from "react";
import { ENGINE_REGISTRY, GROUP_ORDER, SAVIORS_GUILD_ID, type EngineDef } from "@/lib/dashboard/engineRegistry";

type Guild = { id: string; name: string; icon?: string | null };
type FeatureMap = Record<string, boolean>;

function isOn(v: unknown) {
  return v === true;
}

export default function ModulesPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [savedFeatures, setSavedFeatures] = useState<FeatureMap>({});
  const [draftFeatures, setDraftFeatures] = useState<FeatureMap>({});

  const unsaved = useMemo(
    () => JSON.stringify(savedFeatures) !== JSON.stringify(draftFeatures),
    [savedFeatures, draftFeatures]
  );

  const unsavedCount = useMemo(() => {
    let n = 0;
    const keys = new Set([...Object.keys(savedFeatures), ...Object.keys(draftFeatures)]);
    for (const k of keys) if (Boolean(savedFeatures[k]) !== Boolean(draftFeatures[k])) n++;
    return n;
  }, [savedFeatures, draftFeatures]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const fromUrl =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("guildId") || ""
            : "";
        const fromStore =
          typeof window !== "undefined" ? localStorage.getItem("activeGuildId") || "" : "";
        const next = fromUrl || fromStore || list[0]?.id || "";
        if (next) {
          setGuildId(next);
          if (typeof window !== "undefined") {
            localStorage.setItem("activeGuildId", next);
            const url = new URL(window.location.href);
            url.searchParams.set("guildId", next);
            window.history.replaceState({}, "", url.toString());
          }
        } else {
          setLoading(false);
        }
      } catch (e: any) {
        setMsg(e?.message || "Failed to load guilds.");
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        const f = j?.config?.features || {};

        const seeded: FeatureMap = {};
        for (const def of ENGINE_REGISTRY) {
          if (def.featureKey) seeded[def.featureKey] = isOn(f[def.featureKey]);
        }
        for (const k of Object.keys(f)) seeded[k] = isOn(f[k]);

        setSavedFeatures(seeded);
        setDraftFeatures(seeded);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load module config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  function setFeature(key: string, value: boolean) {
    setDraftFeatures((prev) => ({ ...prev, [key]: value }));
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { features: draftFeatures } }),
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setSavedFeatures(draftFeatures);
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function revertAll() {
    setDraftFeatures(savedFeatures);
    setMsg("Reverted unsaved changes.");
  }

  async function applySaviorsBaseline() {
    if (!guildId || guildId === SAVIORS_GUILD_ID) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/bot/apply-saviors-baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Apply baseline failed");
      setMsg("Saviors baseline applied to this guild.");
      const rr = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
      const jj = await rr.json();
      const f = jj?.config?.features || {};
      const seeded: FeatureMap = {};
      for (const def of ENGINE_REGISTRY) if (def.featureKey) seeded[def.featureKey] = isOn(f[def.featureKey]);
      for (const k of Object.keys(f)) seeded[k] = isOn(f[k]);
      setSavedFeatures(seeded);
      setDraftFeatures(seeded);
    } catch (e: any) {
      setMsg(e?.message || "Apply baseline failed.");
    } finally {
      setSaving(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map<string, EngineDef[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const def of ENGINE_REGISTRY) {
      const arr = map.get(def.group) || [];
      arr.push(def);
      map.set(def.group, arr);
    }
    return map;
  }, []);

  const guildName = guilds.find((g) => g.id === guildId)?.name || guildId;

  return (
    <div style={{ color: "#ffd0d0", maxWidth: 1400 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: "rgba(8,0,0,0.92)",
          border: "1px solid #7a0000",
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div style={{ fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ff5050" }}>
          Modules
        </div>

        <select
          value={guildId}
          onChange={(e) => {
            const v = e.target.value;
            setGuildId(v);
            if (typeof window !== "undefined") {
              localStorage.setItem("activeGuildId", v);
              const url = new URL(window.location.href);
              url.searchParams.set("guildId", v);
              window.history.replaceState({}, "", url.toString());
            }
          }}
          style={{
            minWidth: 360,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #7a0000",
            background: "#0c0c0c",
            color: "#ffd0d0",
          }}
        >
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.id})
            </option>
          ))}
        </select>

        <button
          onClick={saveAll}
          disabled={saving || !unsaved}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #8f0000",
            background: unsaved ? "#b00000" : "#220000",
            color: "#fff",
            cursor: unsaved ? "pointer" : "default",
            fontWeight: 800,
          }}
        >
          {saving ? "Saving..." : `Save All${unsaved ? ` (${unsavedCount})` : ""}`}
        </button>

        <button
          onClick={revertAll}
          disabled={!unsaved}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #7a0000",
            background: "#130000",
            color: "#ffd0d0",
            cursor: unsaved ? "pointer" : "default",
            fontWeight: 700,
          }}
        >
          Revert
        </button>

        <button
          onClick={applySaviorsBaseline}
          disabled={saving || !guildId || guildId === SAVIORS_GUILD_ID}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #7a0000",
            background: "#130000",
            color: "#ffd0d0",
            cursor: guildId && guildId !== SAVIORS_GUILD_ID ? "pointer" : "default",
            fontWeight: 700,
          }}
          title={guildId === SAVIORS_GUILD_ID ? "Already baseline guild" : "Apply Saviors baseline to this guild"}
        >
          Apply Saviors Baseline
        </button>

        <span
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 999,
            border: `1px solid ${unsaved ? "#b35a00" : "#0d7a2d"}`,
            color: unsaved ? "#ffbe63" : "#88ffb1",
            fontWeight: 800,
            letterSpacing: "0.08em",
          }}
        >
          {unsaved ? "UNSAVED" : "SAVED"}
        </span>
      </div>

      <div style={{ marginBottom: 12, color: "#ff7b7b" }}>
        Active Guild: <b>{guildName}</b>
      </div>

      {msg ? (
        <div style={{ marginBottom: 14, padding: 10, border: "1px solid #7a0000", borderRadius: 8, background: "#1a0000", color: "#ff9a9a" }}>
          {msg}
        </div>
      ) : null}

      {loading ? (
        <div style={{ color: "#ff9a9a" }}>Loading modules...</div>
      ) : (
        GROUP_ORDER.map((group) => {
          const items = grouped.get(group) || [];
          return (
            <section key={group} style={{ marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 10px", color: "#ff4f4f", letterSpacing: "0.1em", textTransform: "uppercase" }}>{group}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 10 }}>
                {items.map((def) => {
                  const enabled = def.featureKey ? isOn(draftFeatures[def.featureKey]) : false;
                  return (
                    <div
                      key={def.id}
                      style={{
                        border: "1px solid #6f0000",
                        borderRadius: 12,
                        background: "rgba(120,0,0,0.08)",
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 900, color: "#ffdede", letterSpacing: "0.04em" }}>{def.label}</div>
                        {def.featureKey ? (
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 999,
                              border: `1px solid ${enabled ? "#1f8a3f" : "#8a2f2f"}`,
                              color: enabled ? "#88ffb1" : "#ff9a9a",
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            {enabled ? "ON" : "OFF"}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#d7a0a0" }}>Config Page</span>
                        )}
                      </div>

                      <div style={{ color: "#ffb6b6", fontSize: 13 }}>{def.description}</div>
                      {def.notes ? <div style={{ color: "#ff8f8f", fontSize: 12 }}>{def.notes}</div> : null}

                      {def.featureKey ? (
                        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => setFeature(def.featureKey!, e.target.checked)}
                          />
                          Enabled
                        </label>
                      ) : null}

                      <a
                        href={`${def.route}?guildId=${encodeURIComponent(guildId)}`}
                        style={{
                          marginTop: "auto",
                          display: "inline-block",
                          textAlign: "center",
                          textDecoration: "none",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #7a0000",
                          color: "#ffd0d0",
                          background: "#130000",
                          fontWeight: 700,
                        }}
                      >
                        Open
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
