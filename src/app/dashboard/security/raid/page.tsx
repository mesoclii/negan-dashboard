"use client";

import { useEffect, useState } from "react";
import { PossumCard } from "@/components/possum/PossumCard";
import { possum } from "@/styles/possumTheme";

type Role = { id: string; name: string };
type Channel = { id: string; name: string };

type RaidProfile = {
  enabled: boolean;
  responseMode: "monitor" | "mitigate" | "lockdown";
  burstJoinThreshold: number;
  burstWindowSeconds: number;
  mentionBurstThreshold: number;
  autoSlowmode: boolean;
  slowmodeSeconds: number;
  lockdownOnRaid: boolean;
  notifyRoleId: string | null;
  alertChannelId: string | null;
};

const DEFAULT_RAID: RaidProfile = {
  enabled: false,
  responseMode: "mitigate",
  burstJoinThreshold: 8,
  burstWindowSeconds: 15,
  mentionBurstThreshold: 15,
  autoSlowmode: true,
  slowmodeSeconds: 10,
  lockdownOnRaid: false,
  notifyRoleId: null,
  alertChannelId: null,
};

export default function RaidPage() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [raid, setRaid] = useState<RaidProfile>(DEFAULT_RAID);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("guildId") || "";
    setGuildId(String(id).trim());
  }, []);

  useEffect(() => {
    if (!guildId) return;

    async function load() {
      try {
        setStatus("Loading raid profile...");
        const [cfgRes, guildRes] = await Promise.all([
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=lockdown`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
        ]);

        const cfgData = await cfgRes.json();
        const guildData = await guildRes.json();

        if (!cfgData?.success) throw new Error(cfgData?.error || "Failed to load engine config");
        if (!guildData?.success) throw new Error(guildData?.error || "Failed to load guild data");

        const existingRaid = cfgData?.config?.raid || {};
        setRaid({ ...DEFAULT_RAID, ...existingRaid });

        setGuildName(String(guildData?.guild?.name || ""));
        setRoles(Array.isArray(guildData.roles) ? guildData.roles : []);
        setChannels(Array.isArray(guildData.channels) ? guildData.channels : []);
        setStatus("");
      } catch (err: any) {
        setStatus(String(err?.message || err));
      }
    }

    load();
  }, [guildId]);

  function applyPreset(kind: "light" | "balanced" | "aggressive") {
    if (kind === "light") {
      setRaid((v) => ({
        ...v,
        responseMode: "monitor",
        burstJoinThreshold: 12,
        burstWindowSeconds: 20,
        mentionBurstThreshold: 25,
        autoSlowmode: false,
        lockdownOnRaid: false,
      }));
      return;
    }

    if (kind === "balanced") {
      setRaid((v) => ({
        ...v,
        responseMode: "mitigate",
        burstJoinThreshold: 8,
        burstWindowSeconds: 15,
        mentionBurstThreshold: 15,
        autoSlowmode: true,
        slowmodeSeconds: 10,
        lockdownOnRaid: false,
      }));
      return;
    }

    setRaid((v) => ({
      ...v,
      responseMode: "lockdown",
      burstJoinThreshold: 5,
      burstWindowSeconds: 10,
      mentionBurstThreshold: 10,
      autoSlowmode: true,
      slowmodeSeconds: 20,
      lockdownOnRaid: true,
    }));
  }

  async function save() {
    if (!guildId) return;
    try {
      setSaving(true);
      setStatus("");

      const payload: RaidProfile = {
        ...raid,
        burstJoinThreshold: Math.max(1, Number(raid.burstJoinThreshold || 1)),
        burstWindowSeconds: Math.max(1, Number(raid.burstWindowSeconds || 1)),
        mentionBurstThreshold: Math.max(1, Number(raid.mentionBurstThreshold || 1)),
        slowmodeSeconds: Math.max(1, Number(raid.slowmodeSeconds || 1)),
      };

      const res = await fetch("/api/bot/engine-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          engine: "lockdown",
          config: { raid: payload },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) throw new Error(data?.error || "Save failed");

      setStatus("Raid profile saved");
    } catch (err: any) {
      setStatus(String(err?.message || err));
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: possum.soft }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        className="possum-red possum-glow"
        style={{ fontSize: 30, fontWeight: 950, letterSpacing: "0.22em", textTransform: "uppercase" }}
      >
        Raid Response Config
      </div>

      <div style={{ color: possum.soft, letterSpacing: "0.08em" }}>
        Burst detection and response profile for {guildName || guildId}
      </div>

      {status ? <div style={{ color: possum.soft }}>{status}</div> : null}

      <PossumCard title="Raid Controls">
        <div style={{ display: "grid", gap: 12 }}>
          <label style={{ color: possum.soft }}>
            <input
              type="checkbox"
              checked={raid.enabled}
              onChange={(e) => setRaid((v) => ({ ...v, enabled: e.target.checked }))}
            />{" "}
            Enable raid response profile
          </label>

          <label style={{ color: possum.soft }}>
            <input
              type="checkbox"
              checked={raid.autoSlowmode}
              onChange={(e) => setRaid((v) => ({ ...v, autoSlowmode: e.target.checked }))}
            />{" "}
            Auto-slowmode when triggered
          </label>

          <label style={{ color: possum.soft }}>
            <input
              type="checkbox"
              checked={raid.lockdownOnRaid}
              onChange={(e) => setRaid((v) => ({ ...v, lockdownOnRaid: e.target.checked }))}
            />{" "}
            Lockdown immediately on raid trigger
          </label>
        </div>
      </PossumCard>

      <PossumCard title="Response Mode + Presets">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="possum-btn" style={{ padding: "8px 12px" }} onClick={() => setRaid((v) => ({ ...v, responseMode: "monitor" }))}>Monitor</button>
            <button type="button" className="possum-btn" style={{ padding: "8px 12px" }} onClick={() => setRaid((v) => ({ ...v, responseMode: "mitigate" }))}>Mitigate</button>
            <button type="button" className="possum-btn" style={{ padding: "8px 12px" }} onClick={() => setRaid((v) => ({ ...v, responseMode: "lockdown" }))}>Lockdown</button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="possum-btn" style={{ padding: "8px 12px" }} onClick={() => applyPreset("light")}>Preset: Light</button>
            <button type="button" className="possum-btn" style={{ padding: "8px 12px" }} onClick={() => applyPreset("balanced")}>Preset: Balanced</button>
            <button type="button" className="possum-btn" style={{ padding: "8px 12px" }} onClick={() => applyPreset("aggressive")}>Preset: Aggressive</button>
          </div>
        </div>
      </PossumCard>

      <PossumCard title="Raid Thresholds">
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ color: possum.soft, marginBottom: 4 }}>Join burst threshold</div>
            <input
              type="number"
              min={1}
              value={raid.burstJoinThreshold}
              onChange={(e) => setRaid((v) => ({ ...v, burstJoinThreshold: Number(e.target.value || 1) }))}
              style={{ width: 260, padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            />
          </div>

          <div>
            <div style={{ color: possum.soft, marginBottom: 4 }}>Burst window (seconds)</div>
            <input
              type="number"
              min={1}
              value={raid.burstWindowSeconds}
              onChange={(e) => setRaid((v) => ({ ...v, burstWindowSeconds: Number(e.target.value || 1) }))}
              style={{ width: 260, padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            />
          </div>

          <div>
            <div style={{ color: possum.soft, marginBottom: 4 }}>Mention burst threshold</div>
            <input
              type="number"
              min={1}
              value={raid.mentionBurstThreshold}
              onChange={(e) => setRaid((v) => ({ ...v, mentionBurstThreshold: Number(e.target.value || 1) }))}
              style={{ width: 260, padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            />
          </div>

          <div>
            <div style={{ color: possum.soft, marginBottom: 4 }}>Auto-slowmode seconds</div>
            <input
              type="number"
              min={1}
              value={raid.slowmodeSeconds}
              onChange={(e) => setRaid((v) => ({ ...v, slowmodeSeconds: Number(e.target.value || 1) }))}
              style={{ width: 260, padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            />
          </div>
        </div>
      </PossumCard>

      <PossumCard title="Alert Routing">
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ color: possum.soft, marginBottom: 4 }}>Notify Role ID</div>
            <input
              value={raid.notifyRoleId || ""}
              onChange={(e) => setRaid((v) => ({ ...v, notifyRoleId: e.target.value.trim() || null }))}
              placeholder="Role ID"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            />
            <select
              value={raid.notifyRoleId || ""}
              onChange={(e) => setRaid((v) => ({ ...v, notifyRoleId: e.target.value || null }))}
              style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            >
              <option value="">-- choose role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ color: possum.soft, marginBottom: 4 }}>Alert Channel ID</div>
            <input
              value={raid.alertChannelId || ""}
              onChange={(e) => setRaid((v) => ({ ...v, alertChannelId: e.target.value.trim() || null }))}
              placeholder="Channel ID"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            />
            <select
              value={raid.alertChannelId || ""}
              onChange={(e) => setRaid((v) => ({ ...v, alertChannelId: e.target.value || null }))}
              style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 10, border: `1px solid ${possum.border}`, background: "#0b0b0b", color: "#fff" }}
            >
              <option value="">-- choose channel --</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </PossumCard>

      <div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="possum-btn"
          style={{ padding: "12px 18px", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving..." : "Save Raid Profile"}
        </button>
      </div>
    </div>
  );
}
