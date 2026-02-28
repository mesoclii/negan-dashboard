"use client";

import { useEffect, useState } from "react";

type Channel = { id: string; name: string; type: number };

type OnboardingConfig = {
  enabled: boolean;
  welcomeChannelId: string;
  welcomeMessageTemplate: string;
  panelBodyTemplate: string;
  rulesChannelId: string;
  dmTemplate: string;
  sendWelcomeDm: boolean;
};

const DEFAULTS: OnboardingConfig = {
  enabled: true,
  welcomeChannelId: "",
  welcomeMessageTemplate: "",
  panelBodyTemplate: "",
  rulesChannelId: "",
  dmTemplate: "",
  sendWelcomeDm: true
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStorage = localStorage.getItem("activeGuildId") || "";
  const guildId = (fromUrl || fromStorage).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return guildId;
}

export default function OnboardingPage() {
  const [guildId, setGuildId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [form, setForm] = useState<OnboardingConfig>(DEFAULTS);
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

        const onboarding = cfg?.config?.security?.onboarding || {};
        setForm({ ...DEFAULTS, ...onboarding });

        setChannels(
          Array.isArray(gd?.channels) ? gd.channels.filter((c: Channel) => c.type === 0 || c.type === 5) : []
        );
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
          patch: { security: { onboarding: form } }
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

  return (
    <div style={{ color: "#ff5555", padding: 24, maxWidth: 980 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>Onboarding Config</h1>

      {loading ? <p>Loading...</p> : (
        <>
          <label><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label><br />
          <label><input type="checkbox" checked={form.sendWelcomeDm} onChange={(e) => setForm({ ...form, sendWelcomeDm: e.target.checked })} /> Send welcome DM</label><br /><br />

          <div>
            <label>Welcome channel</label><br />
            <select value={form.welcomeChannelId} onChange={(e) => setForm({ ...form, welcomeChannelId: e.target.value })} style={{ width: "100%" }}>
              <option value="">(none)</option>
              {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div><br />

          <div>
            <label>Rules channel</label><br />
            <select value={form.rulesChannelId} onChange={(e) => setForm({ ...form, rulesChannelId: e.target.value })} style={{ width: "100%" }}>
              <option value="">(none)</option>
              {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
            </select>
          </div><br />

          <div>
            <label>Welcome message template</label><br />
            <textarea value={form.welcomeMessageTemplate} onChange={(e) => setForm({ ...form, welcomeMessageTemplate: e.target.value })} rows={4} style={{ width: "100%" }} />
          </div><br />

          <div>
            <label>Panel body template</label><br />
            <textarea value={form.panelBodyTemplate} onChange={(e) => setForm({ ...form, panelBodyTemplate: e.target.value })} rows={5} style={{ width: "100%" }} />
          </div><br />

          <div>
            <label>DM template</label><br />
            <textarea value={form.dmTemplate} onChange={(e) => setForm({ ...form, dmTemplate: e.target.value })} rows={4} style={{ width: "100%" }} />
          </div><br />

          <button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Onboarding"}</button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
