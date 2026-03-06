"use client";



import { useEffect, useMemo, useState } from "react";

type MatrixConfig = {
  preOnboardingEnabled: boolean;
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
  lockdownEnabled: boolean;
  raidEnabled: boolean;
  moderatorEnabled: boolean;
  automationStudioEnabled: boolean;
  commandCenterEnabled: boolean;
  welcomeGoodbyeEnabled: boolean;
  profilesEnabled: boolean;
  notes: string;
};

const DEFAULT_MATRIX: MatrixConfig = {
  preOnboardingEnabled: true,
  onboardingEnabled: true,
  verificationEnabled: true,
  lockdownEnabled: true,
  raidEnabled: true,
  moderatorEnabled: true,
  automationStudioEnabled: true,
  commandCenterEnabled: true,
  welcomeGoodbyeEnabled: true,
  profilesEnabled: true,
  notes: ""
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

const card: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.09)"
};

const btn: React.CSSProperties = {
  border: "1px solid #a30000",
  borderRadius: 10,
  background: "#1a0000",
  color: "#ffcccc",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700
};

const input: React.CSSProperties = {
  width: "100%",
  background: "#0c0c0c",
  color: "#ffd6d6",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "9px 10px"
};

export default function SecurityEngineMatrixPage() {
  const [guildId, setGuildId] = useState("");
  const [matrix, setMatrix] = useState<MatrixConfig>(DEFAULT_MATRIX);
  const [features, setFeatures] = useState<any>({});
  const [lockdownEnabledActual, setLockdownEnabledActual] = useState<boolean>(true);
  const [raidEnabledActual, setRaidEnabledActual] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const rows = useMemo(
    () => [
      { key: "preOnboardingEnabled", label: "Pre-Onboarding", desc: "Gate + refusal/ban flow" },
      { key: "onboardingEnabled", label: "Onboarding", desc: "Join flow + panels + tickets" },
      { key: "verificationEnabled", label: "Verification", desc: "ID timeout + verify decisions" },
      { key: "lockdownEnabled", label: "Lockdown", desc: "Lockdown thresholds + containment" },
      { key: "raidEnabled", label: "Raid", desc: "Join burst + escalation policy" },
      { key: "moderatorEnabled", label: "Moderator", desc: "Moderator logs + automod matrix" },
      { key: "automationStudioEnabled", label: "Automation Studio", desc: "Automated rule engine UI" },
      { key: "commandCenterEnabled", label: "Command Center", desc: "Security command ACL manager" },
      { key: "welcomeGoodbyeEnabled", label: "Welcome + Goodbye", desc: "Message/card templates" },
      { key: "profilesEnabled", label: "Profiles", desc: "One-click security profile presets" }
    ],
    []
  );

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

        const [mRes, dRes, lockRes, raidRes] = await Promise.all([
          fetch(`/api/setup/security-engine-matrix-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=lockdown`),
          fetch(`/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=raid`)
        ]);

        const mJson = await mRes.json().catch(() => ({}));
        const dJson = await dRes.json().catch(() => ({}));
        const lockJson = await lockRes.json().catch(() => ({}));
        const raidJson = await raidRes.json().catch(() => ({}));

        setMatrix({ ...DEFAULT_MATRIX, ...(mJson?.config || {}) });
        setFeatures(dJson?.config?.features || {});
        setLockdownEnabledActual(Boolean(lockJson?.config?.enabled ?? true));
        setRaidEnabledActual(Boolean(raidJson?.config?.enabled ?? true));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load engine matrix");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  function statusPill(enabled: boolean) {
    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: 999,
          border: `1px solid ${enabled ? "#2e8b57" : "#8b2e2e"}`,
          color: enabled ? "#91ffba" : "#ff9e9e",
          fontSize: 12,
          fontWeight: 700
        }}
      >
        {enabled ? "ON" : "OFF"}
      </span>
    );
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      // save matrix UI config
      let r = await fetch("/api/setup/security-engine-matrix-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: matrix })
      });
      let j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Matrix save failed");

      // sync core feature toggles to bot dashboard-config
      const dashPatch = {
        features: {
          securityEnabled: true,
          onboardingEnabled: matrix.onboardingEnabled,
          verificationEnabled: matrix.verificationEnabled,
          lockdownEnabled: matrix.lockdownEnabled,
          raidEnabled: matrix.raidEnabled
        }
      };

      r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: dashPatch })
      });
      j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "dashboard-config sync failed");

      // sync lockdown engine enabled
      r = await fetch("/api/bot/engine-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, engine: "lockdown", patch: { enabled: matrix.lockdownEnabled } })
      });
      j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "lockdown sync failed");

      // sync raid engine enabled
      r = await fetch("/api/bot/engine-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, engine: "raid", patch: { enabled: matrix.raidEnabled } })
      });
      j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "raid sync failed");

      setFeatures((f: any) => ({
        ...f,
        onboardingEnabled: matrix.onboardingEnabled,
        verificationEnabled: matrix.verificationEnabled,
        lockdownEnabled: matrix.lockdownEnabled,
        raidEnabled: matrix.raidEnabled
      }));
      setLockdownEnabledActual(matrix.lockdownEnabled);
      setRaidEnabledActual(matrix.raidEnabled);

      setMsg("Saved engine matrix and synced bot toggles.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffb3b3", padding: 18, maxWidth: 1240 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h1 style={{ margin: 0, color: "#ff3b3b", letterSpacing: "0.09em", textTransform: "uppercase" }}>
          Security Engine Matrix
        </h1>
        <button style={btn} onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save Matrix"}
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId} {msg ? `• ${msg}` : ""}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={{ ...card, marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Live Bot Status</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(180px,1fr))", gap: 8 }}>
              <div>Onboarding: {statusPill(Boolean(features?.onboardingEnabled))}</div>
              <div>Verification: {statusPill(Boolean(features?.verificationEnabled))}</div>
              <div>Lockdown Feature: {statusPill(Boolean(features?.lockdownEnabled))}</div>
              <div>Raid Feature: {statusPill(Boolean(features?.raidEnabled))}</div>
              <div>Lockdown Engine: {statusPill(lockdownEnabledActual)}</div>
              <div>Raid Engine: {statusPill(raidEnabledActual)}</div>
            </div>
          </div>

          <div style={{ ...card, marginBottom: 12 }}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Dashboard Engine Visibility + Toggles</h3>
            <div style={{ display: "grid", gap: 8 }}>
              {rows.map((r) => (
                <label
                  key={r.key}
                  style={{
                    border: "1px solid #5f0000",
                    borderRadius: 8,
                    padding: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: "#ff9999" }}>{r.desc}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={Boolean((matrix as any)[r.key])}
                    onChange={(e) => setMatrix({ ...(matrix as any), [r.key]: e.target.checked })}
                  />
                </label>
              ))}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Notes</h3>
            <textarea
              style={{ ...input, minHeight: 90 }}
              value={matrix.notes || ""}
              onChange={(e) => setMatrix({ ...matrix, notes: e.target.value })}
            />
          </div>

          <button style={btn} onClick={saveAll} disabled={saving}>
            {saving ? "Saving..." : "Save Matrix"}
          </button>
        </>
      )}
    </div>
  );
}
