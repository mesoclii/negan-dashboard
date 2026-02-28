import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { engineCatalog } from "@/lib/engineCatalog";

type ConfigMap = Record<string, any>;

type GuildData = {
  roles: { id: string; name: string }[];
  channels: { id: string; name: string }[];
};

export default function EngineDetail() {
  const router = useRouter();
  const { engineId } = router.query;

  const guildId = useMemo(() => {
    const raw = router.query.guildId;
    if (Array.isArray(raw)) return raw[0] || "";
    return typeof raw === "string" ? raw : "";
  }, [router.query.guildId]);

  const engine = useMemo(() => {
    if (!engineId || typeof engineId !== "string") return null;
    return engineCatalog.find((e) => e.engineId === engineId) || null;
  }, [engineId]);

  const [config, setConfig] = useState<ConfigMap>({});
  const [guildData, setGuildData] = useState<GuildData>({ roles: [], channels: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!engine || !guildId) return;

    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`/api/control/engine-config/${engine.engineId}?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
      fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
    ])
      .then(async ([configRes, guildRes]) => {
        const c = await configRes.json();
        const g = await guildRes.json();

        if (!mounted) return;

        if (!configRes.ok) throw new Error(c?.error || "Config fetch failed");
        if (!guildRes.ok) throw new Error(g?.error || "Guild fetch failed");

        setConfig(c?.config || {});
        setGuildData({
          roles: Array.isArray(g?.roles) ? g.roles : [],
          channels: Array.isArray(g?.channels) ? g.channels : [],
        });
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load engine data");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [engine, guildId]);

  if (!engine) return <div style={{ padding: 24 }}>Engine not found</div>;
  if (!guildId) return <div style={{ padding: 24 }}>Missing guildId in URL (?guildId=...)</div>;

  function setValue(key: string, value: any) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!engine || !guildId) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(
        `/api/control/engine-config/${engine.engineId}?guildId=${encodeURIComponent(guildId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, config }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Save failed");
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>{engine.displayName}</h1>
      <div style={{ opacity: 0.8, marginTop: 6 }}>Guild: {guildId}</div>
      {loading ? <div style={{ marginTop: 12 }}>Loading...</div> : null}
      {error ? <div style={{ marginTop: 12, color: "#ff6b6b" }}>{error}</div> : null}

      <div style={{ marginTop: 16, display: "grid", gap: 14 }}>
        {engine.controls.map((control) => {
          const value = config[control.key];

          if (control.type === "role") {
            return (
              <div key={control.key}>
                <label>{control.label}</label>
                <select value={value || ""} onChange={(e) => setValue(control.key, e.target.value)}>
                  <option value="">Select Role</option>
                  {guildData.roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            );
          }

          if (control.type === "channel") {
            return (
              <div key={control.key}>
                <label>{control.label}</label>
                <select value={value || ""} onChange={(e) => setValue(control.key, e.target.value)}>
                  <option value="">Select Channel</option>
                  {guildData.channels.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            );
          }

          if (control.type === "toggle") {
            return (
              <label key={control.key}>
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => setValue(control.key, e.target.checked)}
                />
                {control.label}
              </label>
            );
          }

          return (
            <div key={control.key}>
              <label>{control.label}</label>
              <input
                type={control.type === "number" ? "number" : "text"}
                value={value ?? ""}
                onChange={(e) =>
                  setValue(
                    control.key,
                    control.type === "number" ? Number(e.target.value) : e.target.value
                  )
                }
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={save}
        disabled={saving}
        style={{
          marginTop: 20,
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid rgba(255,0,0,0.4)",
          background: "rgba(255,0,0,0.16)",
          color: "#fff",
          fontWeight: 900,
        }}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
