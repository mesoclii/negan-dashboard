"use client";

import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number | string };

type RadioBirthdayConfig = {
  active: boolean;
  birthday: {
    enabled: boolean;
    rewardCoins: number;
    roleId: string;
    broadcastChannelId: string;
    timezone: string;
    allowSelfSet: boolean;
  };
  radio: {
    enabled: boolean;
    announceChannelId: string;
    djRoleIds: string[];
    queueLimit: number;
    allowLinks: boolean;
    volumeDefault: number;
  };
};

const DEFAULT_CFG: RadioBirthdayConfig = {
  active: true,
  birthday: {
    enabled: true,
    rewardCoins: 500,
    roleId: "",
    broadcastChannelId: "",
    timezone: "America/Los_Angeles",
    allowSelfSet: true,
  },
  radio: {
    enabled: false,
    announceChannelId: "",
    djRoleIds: [],
    queueLimit: 50,
    allowLinks: true,
    volumeDefault: 60,
  },
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const guildId = (fromUrl || fromStore).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return guildId;
}

function mergeCfg(raw: any): RadioBirthdayConfig {
  return {
    ...DEFAULT_CFG,
    ...(raw || {}),
    birthday: { ...DEFAULT_CFG.birthday, ...(raw?.birthday || {}) },
    radio: {
      ...DEFAULT_CFG.radio,
      ...(raw?.radio || {}),
      djRoleIds: Array.isArray(raw?.radio?.djRoleIds)
        ? raw.radio.djRoleIds.map((x: any) => String(x).trim()).filter(Boolean)
        : DEFAULT_CFG.radio.djRoleIds,
    },
  };
}

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

const card: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.38)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(110,0,0,.10)",
  marginBottom: 12,
};

const input: React.CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  border: "1px solid rgba(255,0,0,.45)",
  color: "#ffd5d5",
  borderRadius: 8,
  padding: "10px 12px",
};

export default function RadioBirthdayPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<RadioBirthdayConfig>(DEFAULT_CFG);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/radio-birthday-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));

        setCfg(mergeCfg(cfgJson?.config));
        setRoles(
          (Array.isArray(gdJson?.roles) ? gdJson.roles : [])
            .map((r: any) => ({ id: String(r.id), name: String(r.name), position: Number(r.position || 0) }))
            .sort((a: Role, b: Role) => b.position! - a.position!)
        );
        setChannels(Array.isArray(gdJson?.channels) ? gdJson.channels : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load Radio/Birthday config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5),
    [channels]
  );

  async function savePatch(patch: Partial<RadioBirthdayConfig>, okLabel: string) {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/setup/radio-birthday-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setCfg(mergeCfg(json?.config || cfg));
      setMsg(okLabel);
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8585", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ maxWidth: 1260, color: "#ffd0d0" }}>
      <div style={{ ...card, position: "sticky", top: 8, zIndex: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, color: "#ff4747", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Radio / Birthday Engine
            </h1>
            <div style={{ marginTop: 6, color: "#ff9c9c", fontSize: 13 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
            <div style={{ marginTop: 3, color: "#ffb5b5", fontSize: 12 }}>
              Radio is the birthday engine surface. Config is saved here as one engine entity.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={!!cfg.active}
                onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))}
              />
              Engine Active
            </label>
            <button
              onClick={() => savePatch(cfg, "Saved Radio/Birthday engine.")}
              disabled={saving || loading}
              style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}
            >
              {saving ? "Saving..." : "Save All"}
            </button>
          </div>
        </div>
        {msg ? <div style={{ marginTop: 8, color: "#ffd27a", fontSize: 12 }}>{msg}</div> : null}
      </div>

      {loading ? <div style={{ padding: 12 }}>Loading...</div> : null}

      {!loading ? (
        <>
          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Birthday Controls
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(220px,1fr))", gap: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!cfg.birthday.enabled}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, birthday: { ...p.birthday, enabled: e.target.checked } }))
                  }
                />{" "}
                Birthday enabled
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={!!cfg.birthday.allowSelfSet}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, birthday: { ...p.birthday, allowSelfSet: e.target.checked } }))
                  }
                />{" "}
                Members can set their own birthday
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(180px,1fr))", gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5 }}>Birthday reward coins</label>
                <input
                  style={input}
                  type="number"
                  value={cfg.birthday.rewardCoins}
                  onChange={(e) =>
                    setCfg((p) => ({
                      ...p,
                      birthday: { ...p.birthday, rewardCoins: Number(e.target.value || 0) },
                    }))
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5 }}>Timezone</label>
                <input
                  style={input}
                  value={cfg.birthday.timezone || ""}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, birthday: { ...p.birthday, timezone: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5 }}>Birthday role</label>
                <select
                  style={input}
                  value={cfg.birthday.roleId || ""}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, birthday: { ...p.birthday, roleId: e.target.value } }))
                  }
                >
                  <option value="">No role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", marginBottom: 5 }}>Birthday broadcast channel</label>
              <select
                style={input}
                value={cfg.birthday.broadcastChannelId || ""}
                onChange={(e) =>
                  setCfg((p) => ({ ...p, birthday: { ...p.birthday, broadcastChannelId: e.target.value } }))
                }
              >
                <option value="">No channel</option>
                {textChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => savePatch({ birthday: cfg.birthday }, "Saved birthday settings.")}
                disabled={saving}
                style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800 }}
              >
                Save Birthday
              </button>
            </div>
          </section>

          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Radio Controls
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(220px,1fr))", gap: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!cfg.radio.enabled}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, radio: { ...p.radio, enabled: e.target.checked } }))
                  }
                />{" "}
                Radio enabled
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={!!cfg.radio.allowLinks}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, radio: { ...p.radio, allowLinks: e.target.checked } }))
                  }
                />{" "}
                Allow links
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(180px,1fr))", gap: 10, marginTop: 10 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5 }}>Queue limit</label>
                <input
                  style={input}
                  type="number"
                  value={cfg.radio.queueLimit}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, radio: { ...p.radio, queueLimit: Number(e.target.value || 0) } }))
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5 }}>Default volume</label>
                <input
                  style={input}
                  type="number"
                  min={0}
                  max={200}
                  value={cfg.radio.volumeDefault}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, radio: { ...p.radio, volumeDefault: Number(e.target.value || 0) } }))
                  }
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5 }}>Radio announce channel</label>
                <select
                  style={input}
                  value={cfg.radio.announceChannelId || ""}
                  onChange={(e) =>
                    setCfg((p) => ({ ...p, radio: { ...p.radio, announceChannelId: e.target.value } }))
                  }
                >
                  <option value="">No channel</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ marginBottom: 6, color: "#ffb3b3", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                DJ Roles
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 180, overflowY: "auto", padding: 8, border: "1px solid rgba(255,0,0,.28)", borderRadius: 8 }}>
                {roles.map((r) => {
                  const selected = cfg.radio.djRoleIds.includes(r.id);
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() =>
                        setCfg((p) => ({
                          ...p,
                          radio: { ...p.radio, djRoleIds: toggleId(p.radio.djRoleIds, r.id) },
                        }))
                      }
                      style={{
                        borderRadius: 999,
                        border: selected ? "1px solid #ff5555" : "1px solid #553030",
                        background: selected ? "rgba(255,0,0,.24)" : "rgba(255,255,255,.03)",
                        color: selected ? "#fff" : "#ffb3b3",
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => savePatch({ radio: cfg.radio }, "Saved radio settings.")}
                disabled={saving}
                style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 800 }}
              >
                Save Radio
              </button>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
