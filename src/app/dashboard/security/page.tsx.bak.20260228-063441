"use client";

import { useEffect, useState } from "react";

type LockdownCfg = {
  enabled: boolean;
  mentionThreshold: number;
  linkThreshold: number;
  actionPreset: string;
  exemptRoleIds: string[];
  exemptChannelIds: string[];
};

type RaidCfg = {
  enabled: boolean;
  joinBurstThreshold: number;
  windowSeconds: number;
  actionPreset: string;
  exemptRoleIds: string[];
  exemptChannelIds: string[];
  autoEscalate: boolean;
};

type PersonaCfg = {
  guildNickname: string;
  webhookName: string;
  webhookAvatarUrl: string;
  useWebhookPersona: boolean;
};

const DEFAULT_LOCKDOWN: LockdownCfg = {
  enabled: true,
  mentionThreshold: 10,
  linkThreshold: 5,
  actionPreset: "strict",
  exemptRoleIds: [],
  exemptChannelIds: []
};

const DEFAULT_RAID: RaidCfg = {
  enabled: true,
  joinBurstThreshold: 6,
  windowSeconds: 30,
  actionPreset: "contain",
  exemptRoleIds: [],
  exemptChannelIds: [],
  autoEscalate: true
};

const DEFAULT_PERSONA: PersonaCfg = {
  guildNickname: "",
  webhookName: "",
  webhookAvatarUrl: "",
  useWebhookPersona: false
};

function parseCsv(v: string): string[] {
  return v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toCsv(v: string[]): string {
  return (v || []).join(", ");
}

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function SecurityCommandPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [lockdown, setLockdown] = useState<LockdownCfg>(DEFAULT_LOCKDOWN);
  const [raid, setRaid] = useState<RaidCfg>(DEFAULT_RAID);
  const [persona, setPersona] = useState<PersonaCfg>(DEFAULT_PERSONA);

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

        const res = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const data = await res.json();

        const ld = data?.config?.security?.lockdown || {};
        const rd = data?.config?.security?.raid || {};
        const ps = data?.config?.persona || {};

        setLockdown({ ...DEFAULT_LOCKDOWN, ...ld });
        setRaid({ ...DEFAULT_RAID, ...rd });
        setPersona({ ...DEFAULT_PERSONA, ...ps });
      } catch {
        setMsg("Failed to load security config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");

    try {
      const res = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            security: { lockdown, raid },
            persona
          }
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
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 980 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Security Command</h1>
      <p>Guild: {guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <h2>Lockdown</h2>
          <label><input type="checkbox" checked={lockdown.enabled} onChange={(e) => setLockdown({ ...lockdown, enabled: e.target.checked })} /> Enabled</label><br />
          <label>Mention threshold</label><br />
          <input type="number" value={lockdown.mentionThreshold} onChange={(e) => setLockdown({ ...lockdown, mentionThreshold: Number(e.target.value || 0) })} /><br />
          <label>Link threshold</label><br />
          <input type="number" value={lockdown.linkThreshold} onChange={(e) => setLockdown({ ...lockdown, linkThreshold: Number(e.target.value || 0) })} /><br />
          <label>Action preset</label><br />
          <input value={lockdown.actionPreset} onChange={(e) => setLockdown({ ...lockdown, actionPreset: e.target.value })} style={{ width: "100%" }} /><br />
          <label>Exempt role IDs (comma-separated)</label><br />
          <input value={toCsv(lockdown.exemptRoleIds)} onChange={(e) => setLockdown({ ...lockdown, exemptRoleIds: parseCsv(e.target.value) })} style={{ width: "100%" }} /><br />
          <label>Exempt channel IDs (comma-separated)</label><br />
          <input value={toCsv(lockdown.exemptChannelIds)} onChange={(e) => setLockdown({ ...lockdown, exemptChannelIds: parseCsv(e.target.value) })} style={{ width: "100%" }} /><br /><br />

          <h2>Raid</h2>
          <label><input type="checkbox" checked={raid.enabled} onChange={(e) => setRaid({ ...raid, enabled: e.target.checked })} /> Enabled</label><br />
          <label><input type="checkbox" checked={raid.autoEscalate} onChange={(e) => setRaid({ ...raid, autoEscalate: e.target.checked })} /> Auto escalate</label><br />
          <label>Join burst threshold</label><br />
          <input type="number" value={raid.joinBurstThreshold} onChange={(e) => setRaid({ ...raid, joinBurstThreshold: Number(e.target.value || 0) })} /><br />
          <label>Window seconds</label><br />
          <input type="number" value={raid.windowSeconds} onChange={(e) => setRaid({ ...raid, windowSeconds: Number(e.target.value || 0) })} /><br />
          <label>Action preset</label><br />
          <input value={raid.actionPreset} onChange={(e) => setRaid({ ...raid, actionPreset: e.target.value })} style={{ width: "100%" }} /><br />
          <label>Exempt role IDs (comma-separated)</label><br />
          <input value={toCsv(raid.exemptRoleIds)} onChange={(e) => setRaid({ ...raid, exemptRoleIds: parseCsv(e.target.value) })} style={{ width: "100%" }} /><br />
          <label>Exempt channel IDs (comma-separated)</label><br />
          <input value={toCsv(raid.exemptChannelIds)} onChange={(e) => setRaid({ ...raid, exemptChannelIds: parseCsv(e.target.value) })} style={{ width: "100%" }} /><br /><br />

          <h2>Persona</h2>
          <label><input type="checkbox" checked={persona.useWebhookPersona} onChange={(e) => setPersona({ ...persona, useWebhookPersona: e.target.checked })} /> Use webhook persona</label><br />
          <label>Guild nickname</label><br />
          <input value={persona.guildNickname} onChange={(e) => setPersona({ ...persona, guildNickname: e.target.value })} style={{ width: "100%" }} /><br />
          <label>Webhook name</label><br />
          <input value={persona.webhookName} onChange={(e) => setPersona({ ...persona, webhookName: e.target.value })} style={{ width: "100%" }} /><br />
          <label>Webhook avatar URL</label><br />
          <input value={persona.webhookAvatarUrl} onChange={(e) => setPersona({ ...persona, webhookAvatarUrl: e.target.value })} style={{ width: "100%" }} /><br /><br />

          <button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save Security + Persona"}</button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
