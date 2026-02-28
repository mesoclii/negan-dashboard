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

function parseCsv(v: string): string[] {
  return String(v || "")
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

export default function SecurityPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [lockdown, setLockdown] = useState<LockdownCfg>(DEFAULT_LOCKDOWN);
  const [raid, setRaid] = useState<RaidCfg>(DEFAULT_RAID);

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

        setLockdown({ ...DEFAULT_LOCKDOWN, ...(data?.config?.security?.lockdown || {}) });
        setRaid({ ...DEFAULT_RAID, ...(data?.config?.security?.raid || {}) });
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
          patch: { security: { lockdown, raid } }
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #7a0000",
    background: "#0d0d0d",
    color: "#ffd2d2"
  };

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 1100 }}>
      <h1 style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>Security Command</h1>
      <p>Guild: {guildId}</p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <h2 style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>Lockdown</h2>
          <label><input type="checkbox" checked={lockdown.enabled} onChange={(e) => setLockdown({ ...lockdown, enabled: e.target.checked })} /> enabled</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <input style={inputStyle} type="number" value={lockdown.mentionThreshold} onChange={(e) => setLockdown({ ...lockdown, mentionThreshold: Number(e.target.value || 0) })} placeholder="mentionThreshold" />
            <input style={inputStyle} type="number" value={lockdown.linkThreshold} onChange={(e) => setLockdown({ ...lockdown, linkThreshold: Number(e.target.value || 0) })} placeholder="linkThreshold" />
          </div>
          <div style={{ marginTop: 10 }}>
            <input style={inputStyle} value={lockdown.actionPreset} onChange={(e) => setLockdown({ ...lockdown, actionPreset: e.target.value })} placeholder="actionPreset" />
          </div>
          <div style={{ marginTop: 10 }}>
            <input style={inputStyle} value={toCsv(lockdown.exemptRoleIds)} onChange={(e) => setLockdown({ ...lockdown, exemptRoleIds: parseCsv(e.target.value) })} placeholder="exemptRoleIds (comma-separated)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <input style={inputStyle} value={toCsv(lockdown.exemptChannelIds)} onChange={(e) => setLockdown({ ...lockdown, exemptChannelIds: parseCsv(e.target.value) })} placeholder="exemptChannelIds (comma-separated)" />
          </div>

          <h2 style={{ letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 20 }}>Raid</h2>
          <label><input type="checkbox" checked={raid.enabled} onChange={(e) => setRaid({ ...raid, enabled: e.target.checked })} /> enabled</label>
          <label style={{ marginLeft: 14 }}><input type="checkbox" checked={raid.autoEscalate} onChange={(e) => setRaid({ ...raid, autoEscalate: e.target.checked })} /> autoEscalate</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
            <input style={inputStyle} type="number" value={raid.joinBurstThreshold} onChange={(e) => setRaid({ ...raid, joinBurstThreshold: Number(e.target.value || 0) })} placeholder="joinBurstThreshold" />
            <input style={inputStyle} type="number" value={raid.windowSeconds} onChange={(e) => setRaid({ ...raid, windowSeconds: Number(e.target.value || 0) })} placeholder="windowSeconds" />
          </div>
          <div style={{ marginTop: 10 }}>
            <input style={inputStyle} value={raid.actionPreset} onChange={(e) => setRaid({ ...raid, actionPreset: e.target.value })} placeholder="actionPreset" />
          </div>
          <div style={{ marginTop: 10 }}>
            <input style={inputStyle} value={toCsv(raid.exemptRoleIds)} onChange={(e) => setRaid({ ...raid, exemptRoleIds: parseCsv(e.target.value) })} placeholder="exemptRoleIds (comma-separated)" />
          </div>
          <div style={{ marginTop: 10 }}>
            <input style={inputStyle} value={toCsv(raid.exemptChannelIds)} onChange={(e) => setRaid({ ...raid, exemptChannelIds: parseCsv(e.target.value) })} placeholder="exemptChannelIds (comma-separated)" />
          </div>

          <div style={{ marginTop: 16 }}>
            <button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save Security"}</button>
            {msg ? <span style={{ marginLeft: 12 }}>{msg}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}
