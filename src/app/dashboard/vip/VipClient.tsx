"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Channel = { id: string; name: string; type?: number | string };

type VipConfig = {
  active: boolean;
  vipRoleId: string;
  supporterRoleId: string;
  nitroRoleId: string;
  grantLogChannelId: string;
  autoExpire: boolean;
  expiryDays: number;
  syncWithLoyalty: boolean;
  notes: string;
};

const EMPTY: VipConfig = {
  active: true,
  vipRoleId: "",
  supporterRoleId: "",
  nitroRoleId: "",
  grantLogChannelId: "",
  autoExpire: true,
  expiryDays: 30,
  syncWithLoyalty: true,
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

function withGuild(href: string, guildId: string) {
  if (!guildId) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}guildId=${encodeURIComponent(guildId)}`;
}

const card = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.10)",
};

const input = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "10px 12px",
};

export default function VipClient() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<VipConfig>(EMPTY);
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
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/vip-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);

        const cfgJson = await cfgRes.json().catch(() => ({}));
        const gdJson = await gdRes.json().catch(() => ({}));

        setCfg({ ...EMPTY, ...(cfgJson?.config || {}) });
        setChannels((Array.isArray(gdJson?.channels) ? gdJson.channels : []).filter((c: any) => Number(c?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load VIP config.");
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
      const r = await fetch("/api/setup/vip-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg({ ...EMPTY, ...(j?.config || cfg) });
      setMsg("VIP engine settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>VIP Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginBottom: 12 }}>
        VIP is a separate engine. Loyalty is a linked engine and is configured directly from VIP Loyalty.
      </div>

      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={card}>
            <label>
              <input
                type="checkbox"
                checked={cfg.active}
                onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))}
              />{" "}
              VIP Engine Enabled
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <div>VIP Role ID</div>
                <input style={input} value={cfg.vipRoleId} onChange={(e) => setCfg((p) => ({ ...p, vipRoleId: e.target.value }))} />
              </div>
              <div>
                <div>Supporter Role ID</div>
                <input style={input} value={cfg.supporterRoleId} onChange={(e) => setCfg((p) => ({ ...p, supporterRoleId: e.target.value }))} />
              </div>
              <div>
                <div>Nitro Booster Role ID</div>
                <input style={input} value={cfg.nitroRoleId} onChange={(e) => setCfg((p) => ({ ...p, nitroRoleId: e.target.value }))} />
              </div>
              <div>
                <div>Grant Log Channel</div>
                <select
                  style={input}
                  value={cfg.grantLogChannelId || ""}
                  onChange={(e) => setCfg((p) => ({ ...p, grantLogChannelId: e.target.value }))}
                >
                  <option value="">Select channel</option>
                  {channels.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={cfg.autoExpire}
                  onChange={(e) => setCfg((p) => ({ ...p, autoExpire: e.target.checked }))}
                />{" "}
                Auto Expire VIP
              </label>
              <div>
                <div>Expiry Days</div>
                <input
                  style={input}
                  type="number"
                  value={cfg.expiryDays}
                  onChange={(e) => setCfg((p) => ({ ...p, expiryDays: Number(e.target.value || 0) }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={cfg.syncWithLoyalty}
                  onChange={(e) => setCfg((p) => ({ ...p, syncWithLoyalty: e.target.checked }))}
                />{" "}
                Sync VIP with Loyalty Engine
              </label>
            </div>

            <div style={{ marginTop: 10 }}>
              <div>Notes</div>
              <textarea style={{ ...input, minHeight: 100 }} value={cfg.notes} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </section>

          <section style={card}>
            <div style={{ fontWeight: 900, marginBottom: 8, color: "#ff6b6b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Linked Engines
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
              <Link href={withGuild("/dashboard/vip/loyalty", guildId)} style={{ ...input, textDecoration: "none", textAlign: "center", fontWeight: 900 }}>
                Open VIP Loyalty
              </Link>
              <Link href={withGuild("/dashboard/loyalty", guildId)} style={{ ...input, textDecoration: "none", textAlign: "center", fontWeight: 900 }}>
                Open Loyalty Engine
              </Link>
              <Link href={withGuild("/dashboard/economy/progression", guildId)} style={{ ...input, textDecoration: "none", textAlign: "center", fontWeight: 900 }}>
                Open Progression Multipliers
              </Link>
            </div>
          </section>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save VIP"}
          </button>
        </div>
      )}
    </div>
  );
}
