"use client";

import { useEffect, useMemo, useState } from "react";

type Channel = { id: string; name: string; type?: number | string };
type PanelStyle = { compactMode: boolean; borderGlow: boolean; rounded: number; shadow: number; fontScale: number };
type PanelModule = {
  enabled: boolean;
  channelId: string;
  title: string;
  description: string;
  buttonLabel: string;
  color: string;
  imageUrl: string;
  bannerUrl: string;
  layoutPreset: string;
  previewEnabled: boolean;
  style: PanelStyle;
};
type Template = { key: string; title: string };
type PanelDesignerConfig = {
  active: boolean;
  templates: Template[];
  modules: Record<string, PanelModule>;
  notes: string;
};

const KNOWN_MODULES: Record<string, { title: string; buttonLabel: string }> = {
  welcome: { title: "Welcome", buttonLabel: "Start" },
  tickets: { title: "Support Tickets", buttonLabel: "Open Ticket" },
  selfroles: { title: "Pick Your Roles", buttonLabel: "Choose Roles" },
  store: { title: "Server Store", buttonLabel: "Open Store" },
};

const DEFAULT_TEMPLATES: Template[] = [
  { key: "clean", title: "Clean" },
  { key: "warzone", title: "Warzone" },
  { key: "elite", title: "Elite" },
  { key: "minimal", title: "Minimal" },
];

function moduleDefaults(title: string, buttonLabel: string): PanelModule {
  return {
    enabled: true,
    channelId: "",
    title,
    description: "",
    buttonLabel,
    color: "#ff3b3b",
    imageUrl: "",
    bannerUrl: "",
    layoutPreset: "clean",
    previewEnabled: true,
    style: { compactMode: false, borderGlow: true, rounded: 12, shadow: 18, fontScale: 1 },
  };
}

const DEFAULT_CONFIG: PanelDesignerConfig = {
  active: true,
  templates: DEFAULT_TEMPLATES,
  modules: Object.fromEntries(
    Object.entries(KNOWN_MODULES).map(([k, meta]) => [k, moduleDefaults(meta.title, meta.buttonLabel)])
  ),
  notes: "",
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function normalizeModule(key: string, raw?: Partial<PanelModule>): PanelModule {
  const fallback = KNOWN_MODULES[key] || { title: key, buttonLabel: "Open" };
  const base = moduleDefaults(fallback.title, fallback.buttonLabel);
  return {
    ...base,
    ...(raw || {}),
    style: {
      ...base.style,
      ...(raw?.style || {}),
      rounded: Number((raw?.style as any)?.rounded ?? base.style.rounded) || base.style.rounded,
      shadow: Number((raw?.style as any)?.shadow ?? base.style.shadow) || base.style.shadow,
      fontScale: Number((raw?.style as any)?.fontScale ?? base.style.fontScale) || base.style.fontScale,
    },
  };
}

function normalizeConfig(raw?: Partial<PanelDesignerConfig>): PanelDesignerConfig {
  const incoming = raw || {};
  const modulesRaw = incoming.modules || {};
  const mergedModules: Record<string, PanelModule> = {};
  // keep known modules first
  for (const key of Object.keys(KNOWN_MODULES)) {
    mergedModules[key] = normalizeModule(key, (modulesRaw as any)[key]);
  }
  // then any extras from remote
  for (const key of Object.keys(modulesRaw)) {
    if (mergedModules[key]) continue;
    mergedModules[key] = normalizeModule(key, (modulesRaw as any)[key]);
  }

  return {
    active: incoming.active ?? DEFAULT_CONFIG.active,
    templates: Array.isArray(incoming.templates) && incoming.templates.length ? incoming.templates : DEFAULT_TEMPLATES,
    modules: mergedModules,
    notes: incoming.notes ?? "",
  };
}

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1280 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };

export default function PanelsPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<PanelDesignerConfig>(DEFAULT_CONFIG);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/panel-designer-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));
        setCfg(normalizeConfig(cfgJson?.config));
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
        const gName = String(gdJson?.guild?.name || "").trim();
        if (gName) localStorage.setItem("activeGuildName", gName);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load panels config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  function updateModule(key: string, patch: Partial<PanelModule>) {
    setCfg((prev) => ({
      ...prev,
      modules: { ...prev.modules, [key]: { ...prev.modules[key], ...patch, style: { ...prev.modules[key].style, ...(patch.style || {}) } } },
    }));
  }

  function addModule() {
    const key = prompt("Module key (no spaces):", "custom");
    if (!key) return;
    const clean = key.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    if (!clean) return;
    setCfg((prev) => {
      if (prev.modules[clean]) return prev;
      return {
        ...prev,
        modules: { ...prev.modules, [clean]: moduleDefaults(clean, "Open") },
      };
    });
  }

  function removeModule(key: string) {
    if (KNOWN_MODULES[key]) return; // protect core modules
    setCfg((prev) => {
      const nextModules = { ...prev.modules } as Record<string, PanelModule>;
      delete nextModules[key];
      return { ...prev, modules: nextModules };
    });
  }

  async function saveAll(nextCfg?: PanelDesignerConfig) {
    if (!guildId) return;
    const payload = nextCfg || cfg;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/setup/panel-designer-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setCfg(normalizeConfig(json?.config));
      setMsg("Panel designer saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function resetDefaults() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/setup/panel-designer-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, reset: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Reset failed");
      setCfg(normalizeConfig(json?.config));
      setMsg("Reset to defaults.");
    } catch (e: any) {
      setMsg(e?.message || "Reset failed.");
    } finally {
      setSaving(false);
    }
  }

  const moduleKeys = useMemo(() => Object.keys(cfg.modules || {}).sort((a, b) => {
    const aKnown = KNOWN_MODULES[a] ? 0 : 1;
    const bKnown = KNOWN_MODULES[b] ? 0 : 1;
    if (aKnown !== bKnown) return aKnown - bKnown;
    return a.localeCompare(b);
  }), [cfg.modules]);

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <div style={{ ...card, position: "sticky", top: 8, zIndex: 20 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Panels Control</h1>
            <div style={{ color: "#ff9c9c", marginTop: 4 }}>Guild: {typeof window !== "undefined" ? (localStorage.getItem("activeGuildName") || guildId) : guildId}</div>
            <div style={{ color: "#ffb5b5", fontSize: 12 }}>Controls every panel module (welcome, tickets, selfroles, store, customs). Saves to panel-designer-config.</div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Panels Active
          </label>
          <button onClick={addModule} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800 }}>+ Add Module</button>
          <button onClick={resetDefaults} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800, borderColor: "#a00000", color: "#ff9d9d" }}>Reset Defaults</button>
          <button onClick={() => saveAll()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
        {msg ? <div style={{ marginTop: 6, color: "#ffd27a" }}>{msg}</div> : null}
      </div>

      {loading ? (
        <div style={card}>Loading panel designer...</div>
      ) : (
        <>
          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ marginBottom: 6, color: "#ffb5b5", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>Templates</div>
                <div style={{ color: "#ff9c9c", fontSize: 12 }}>Layout presets available to all modules.</div>
              </div>
              <button onClick={() => setCfg((p) => ({ ...p, templates: [...p.templates, { key: `tpl_${p.templates.length + 1}`, title: "New Template" }] }))} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800 }}>+ Add Template</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10, marginTop: 10 }}>
              {cfg.templates.map((tpl, idx) => (
                <div key={tpl.key + idx} style={{ border: "1px solid #550000", borderRadius: 10, padding: 10, background: "#110000" }}>
                  <div style={{ marginBottom: 6 }}>Key</div>
                  <input style={input} value={tpl.key} onChange={(e) => setCfg((p) => {
                    const next = [...p.templates];
                    next[idx] = { ...next[idx], key: e.target.value };
                    return { ...p, templates: next };
                  })} />
                  <div style={{ marginTop: 8, marginBottom: 6 }}>Title</div>
                  <input style={input} value={tpl.title} onChange={(e) => setCfg((p) => {
                    const next = [...p.templates];
                    next[idx] = { ...next[idx], title: e.target.value };
                    return { ...p, templates: next };
                  })} />
                </div>
              ))}
            </div>
          </section>

          {moduleKeys.map((key) => {
            const mod = cfg.modules[key];
            if (!mod) return null;
            return (
              <section key={key} style={card}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ color: "#ff6666", fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>{key}</div>
                    <div style={{ color: "#ffb3b3", fontSize: 12 }}>Channel + visuals for this panel module.</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={mod.enabled} onChange={(e) => updateModule(key, { enabled: e.target.checked })} /> Enabled
                    </label>
                    {KNOWN_MODULES[key] ? null : (
                      <button onClick={() => removeModule(key)} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 700, borderColor: "#a00000", color: "#ff9d9d" }}>Remove</button>
                    )}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 10 }}>
                  <div>
                    <div style={{ marginBottom: 6 }}>Panel Title</div>
                    <input style={input} value={mod.title} onChange={(e) => updateModule(key, { title: e.target.value })} />
                  </div>
                  <div>
                    <div style={{ marginBottom: 6 }}>Button Label</div>
                    <input style={input} value={mod.buttonLabel} onChange={(e) => updateModule(key, { buttonLabel: e.target.value })} />
                  </div>
                  <div>
                    <div style={{ marginBottom: 6 }}>Channel</div>
                    <select style={input} value={mod.channelId || ""} onChange={(e) => updateModule(key, { channelId: e.target.value })}>
                      <option value="">Select channel</option>
                      {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ marginBottom: 6 }}>Layout Preset</div>
                    <select style={input} value={mod.layoutPreset} onChange={(e) => updateModule(key, { layoutPreset: e.target.value })}>
                      {cfg.templates.map((tpl) => <option key={tpl.key} value={tpl.key}>{tpl.title}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Description</div>
                  <textarea style={{ ...input, minHeight: 100 }} value={mod.description} onChange={(e) => updateModule(key, { description: e.target.value })} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10, marginTop: 10 }}>
                  <div>
                    <div style={{ marginBottom: 6 }}>Color</div>
                    <input style={input} value={mod.color} onChange={(e) => updateModule(key, { color: e.target.value })} />
                  </div>
                  <div>
                    <div style={{ marginBottom: 6 }}>Image URL</div>
                    <input style={input} value={mod.imageUrl} onChange={(e) => updateModule(key, { imageUrl: e.target.value })} />
                  </div>
                  <div>
                    <div style={{ marginBottom: 6 }}>Banner URL</div>
                    <input style={input} value={mod.bannerUrl} onChange={(e) => updateModule(key, { bannerUrl: e.target.value })} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18 }}>
                    <input type="checkbox" checked={mod.previewEnabled} onChange={(e) => updateModule(key, { previewEnabled: e.target.checked })} />
                    <span>Preview enabled</span>
                  </div>
                </div>

                <div style={{ marginTop: 12, borderTop: "1px solid #4a0000", paddingTop: 10 }}>
                  <div style={{ color: "#ffb3b3", marginBottom: 8, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}>Style</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={mod.style.compactMode} onChange={(e) => updateModule(key, { style: { ...mod.style, compactMode: e.target.checked } })} /> Compact mode
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={mod.style.borderGlow} onChange={(e) => updateModule(key, { style: { ...mod.style, borderGlow: e.target.checked } })} /> Border glow
                    </label>
                    <div>
                      <div style={{ marginBottom: 4 }}>Rounded</div>
                      <input style={input} type="number" min={0} value={mod.style.rounded} onChange={(e) => updateModule(key, { style: { ...mod.style, rounded: Number(e.target.value || 0) } })} />
                    </div>
                    <div>
                      <div style={{ marginBottom: 4 }}>Shadow</div>
                      <input style={input} type="number" min={0} value={mod.style.shadow} onChange={(e) => updateModule(key, { style: { ...mod.style, shadow: Number(e.target.value || 0) } })} />
                    </div>
                    <div>
                      <div style={{ marginBottom: 4 }}>Font scale</div>
                      <input style={input} type="number" step={0.05} min={0.5} max={3} value={mod.style.fontScale} onChange={(e) => updateModule(key, { style: { ...mod.style, fontScale: Number(e.target.value || 1) } })} />
                    </div>
                  </div>
                </div>
              </section>
            );
          })}

          <section style={card}>
            <div style={{ marginBottom: 6 }}>Notes</div>
            <textarea style={{ ...input, minHeight: 120 }} value={cfg.notes} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} />
          </section>

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => saveAll()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save All Panels"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}