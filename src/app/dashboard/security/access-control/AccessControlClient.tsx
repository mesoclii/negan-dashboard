"use client";

import { useEffect, useState } from "react";

type Role = { id: string; name: string; position?: number };

type AccessControlConfig = {
  active: boolean;
  ownerBypass: boolean;
  adminRoleIds: string[];
  staffRoleIds: string[];
  allowedUserIds: string[];
  deniedUserIds: string[];
  notes: string;
};

const DEFAULT_CFG: AccessControlConfig = {
  active: true,
  ownerBypass: true,
  adminRoleIds: [],
  staffRoleIds: [],
  allowedUserIds: [],
  deniedUserIds: [],
  notes: "",
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const id = (fromUrl || fromStore).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

function csvToIds(input: string): string[] {
  return input
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function idsToCsv(ids: string[]) {
  return (ids || []).join(", ");
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

const card: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.36)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(100,0,0,.10)",
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

export default function AccessControlClient() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<AccessControlConfig>(DEFAULT_CFG);
  const [roles, setRoles] = useState<Role[]>([]);
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
          fetch(`/api/setup/access-control-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));

        setCfg({ ...DEFAULT_CFG, ...(cfgJson?.config || {}) });
        setRoles(
          (Array.isArray(gdJson?.roles) ? gdJson.roles : [])
            .map((r: any) => ({ id: String(r.id), name: String(r.name), position: Number(r.position || 0) }))
            .sort((a: Role, b: Role) => b.position! - a.position!)
        );
      } catch (e: any) {
        setMsg(e?.message || "Failed to load access policy.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/setup/access-control-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setCfg({ ...DEFAULT_CFG, ...(json?.config || cfg) });
      setMsg("Saved access control policy.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8585", padding: 20 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ maxWidth: 1220, color: "#ffd0d0" }}>
      <div style={card}>
        <h1 style={{ marginTop: 0, color: "#ff4a4a", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Dashboard Access Control
        </h1>
        <div style={{ color: "#ff9f9f", marginBottom: 8 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
        <div style={{ color: "#ffb5b5", fontSize: 12 }}>
          Controls who can open dashboard pages. This is role-based and user-list based, no hardcoded IDs in code.
        </div>
      </div>

      {loading ? <div style={{ padding: 10 }}>Loading...</div> : null}

      {!loading ? (
        <>
          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Policy State
            </h3>
            <label style={{ marginRight: 16 }}>
              <input
                type="checkbox"
                checked={!!cfg.active}
                onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))}
              />{" "}
              Policy active
            </label>
            <label>
              <input
                type="checkbox"
                checked={!!cfg.ownerBypass}
                onChange={(e) => setCfg((p) => ({ ...p, ownerBypass: e.target.checked }))}
              />{" "}
              Guild owner bypass
            </label>
          </section>

          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Role Access
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6, color: "#ffb3b3", fontSize: 12 }}>Admin dashboard roles</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 180, overflowY: "auto", padding: 8, border: "1px solid rgba(255,0,0,.28)", borderRadius: 8 }}>
                  {roles.map((r) => {
                    const selected = cfg.adminRoleIds.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={`admin-${r.id}`}
                        onClick={() => setCfg((p) => ({ ...p, adminRoleIds: toggleId(p.adminRoleIds, r.id) }))}
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
                <div style={{ marginTop: 8 }}>
                  <input
                    style={input}
                    value={idsToCsv(cfg.adminRoleIds)}
                    onChange={(e) => setCfg((p) => ({ ...p, adminRoleIds: csvToIds(e.target.value) }))}
                    placeholder="Admin role IDs (csv)"
                  />
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 6, color: "#ffb3b3", fontSize: 12 }}>Staff dashboard roles</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 180, overflowY: "auto", padding: 8, border: "1px solid rgba(255,0,0,.28)", borderRadius: 8 }}>
                  {roles.map((r) => {
                    const selected = cfg.staffRoleIds.includes(r.id);
                    return (
                      <button
                        type="button"
                        key={`staff-${r.id}`}
                        onClick={() => setCfg((p) => ({ ...p, staffRoleIds: toggleId(p.staffRoleIds, r.id) }))}
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
                <div style={{ marginTop: 8 }}>
                  <input
                    style={input}
                    value={idsToCsv(cfg.staffRoleIds)}
                    onChange={(e) => setCfg((p) => ({ ...p, staffRoleIds: csvToIds(e.target.value) }))}
                    placeholder="Staff role IDs (csv)"
                  />
                </div>
              </div>
            </div>
          </section>

          <section style={card}>
            <h3 style={{ marginTop: 0, color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              User Lists
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Explicitly allowed user IDs</label>
                <textarea
                  style={{ ...input, minHeight: 100 }}
                  value={idsToCsv(cfg.allowedUserIds)}
                  onChange={(e) => setCfg((p) => ({ ...p, allowedUserIds: csvToIds(e.target.value) }))}
                  placeholder="111, 222, 333"
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6 }}>Explicitly denied user IDs</label>
                <textarea
                  style={{ ...input, minHeight: 100 }}
                  value={idsToCsv(cfg.deniedUserIds)}
                  onChange={(e) => setCfg((p) => ({ ...p, deniedUserIds: csvToIds(e.target.value) }))}
                  placeholder="444, 555"
                />
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", marginBottom: 6 }}>Notes</label>
              <textarea
                style={{ ...input, minHeight: 80 }}
                value={cfg.notes || ""}
                onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </section>

          <section style={{ ...card, position: "sticky", bottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ color: "#ffb3b3", fontSize: 12 }}>Save to apply role-based dashboard access policy.</div>
              <button
                onClick={save}
                disabled={saving}
                style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}
              >
                {saving ? "Saving..." : "Save Access Control"}
              </button>
            </div>
            {msg ? <div style={{ marginTop: 8, color: "#ffd27a", fontSize: 12 }}>{msg}</div> : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
