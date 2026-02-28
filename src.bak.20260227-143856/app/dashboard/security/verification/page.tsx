"use client";

import { useEffect, useState } from "react";

type Role = { id: string; name: string };
type Channel = { id: string; name: string; type: number };

type VerificationConfig = {
  enabled: boolean;
  idTimeoutMinutes: number;
  roleOnVerifyId: string;
  removeRoleIdsOnVerify: string[];
  declineAction: "kick" | "role" | "timeout";
  ticketCategoryId: string;
  ticketChannelId: string;
  approverRoleIds: string[];
  autoKickOnTimeout: boolean;
};

const DEFAULTS: VerificationConfig = {
  enabled: true,
  idTimeoutMinutes: 30,
  roleOnVerifyId: "",
  removeRoleIdsOnVerify: [],
  declineAction: "kick",
  ticketCategoryId: "",
  ticketChannelId: "",
  approverRoleIds: [],
  autoKickOnTimeout: true
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStorage = localStorage.getItem("activeGuildId") || "";
  const guildId = (fromUrl || fromStorage).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return guildId;
}

export default function VerificationPage() {
  const [guildId, setGuildId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [form, setForm] = useState<VerificationConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setGuildId(getGuildId());
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

        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const cfg = await cfgRes.json();
        const gd = await gdRes.json();

        const verification = cfg?.config?.security?.verification || {};
        setForm({ ...DEFAULTS, ...verification });

        setRoles(Array.isArray(gd?.roles) ? gd.roles : []);
        setChannels(Array.isArray(gd?.channels) ? gd.channels : []);
      } catch {
        setMsg("Failed to load configuration.");
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
      const res = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: { security: { verification: form } }
        })
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.error || "Save failed");
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  const categoryChannels = channels.filter((c) => c.type === 4);
  const textChannels = channels.filter((c) => c.type === 0 || c.type === 5);

  return (
    <div style={{ color: "#ff5555", padding: 24, maxWidth: 980 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>Verification Config</h1>

      {loading ? <p>Loading...</p> : (
        <>
          <label><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label><br />
          <label><input type="checkbox" checked={form.autoKickOnTimeout} onChange={(e) => setForm({ ...form, autoKickOnTimeout: e.target.checked })} /> Auto-kick on timeout</label><br /><br />

          <div>
            <label>ID timeout minutes</label><br />
            <input type="number" value={form.idTimeoutMinutes} onChange={(e) => setForm({ ...form, idTimeoutMinutes: Number(e.target.value || 0) })} />
          </div><br />

          <div>
            <label>Role to grant on verify</label><br />
            <select value={form.roleOnVerifyId} onChange={(e) => setForm({ ...form, roleOnVerifyId: e.target.value })} style={{ width: "100%" }}>
              <option value="">(none)</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div><br />

          <div>
            <label>Roles to remove on verify</label><br />
            <select
              multiple
              size={8}
              value={form.removeRoleIdsOnVerify}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                setForm({ ...form, removeRoleIdsOnVerify: values });
              }}
              style={{ width: "100%" }}
            >
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div><br />

          <div>
            <label>Decline action</label><br />
            <select value={form.declineAction} onChange={(e) => setForm({ ...form, declineAction: e.target.value as VerificationConfig["declineAction"] })}>
              <option value="kick">kick</option>
              <option value="role">role</option>
              <option value="timeout">timeout</option>
            </select>
          </div><br />

          <div>
            <label>Ticket category</label><br />
            <select value={form.ticketCategoryId} onChange={(e) => setForm({ ...form, ticketCategoryId: e.target.value })} style={{ width: "100%" }}>
              <option value="">(none)</option>
              {categoryChannels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div><br />

          <div>
            <label>Ticket channel</label><br />
            <select value={form.ticketChannelId} onChange={(e) => setForm({ ...form, ticketChannelId: e.target.value })} style={{ width: "100%" }}>
              <option value="">(none)</option>
              {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div><br />

          <div>
            <label>Approver roles</label><br />
            <select
              multiple
              size={8}
              value={form.approverRoleIds}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions).map((o) => o.value);
                setForm({ ...form, approverRoleIds: values });
              }}
              style={{ width: "100%" }}
            >
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div><br />

          <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Verification"}</button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
