"use client";



import { useEffect, useState } from "react";

type ProfilesConfig = {
  selectedProfile: "custom" | "chill" | "balanced" | "strict" | "siege";
  lastAppliedAt: string;
  notes: string;
  lastBackup: string | null;
};

const DEFAULT_CONFIG: ProfilesConfig = {
  selectedProfile: "custom",
  lastAppliedAt: "",
  notes: "",
  lastBackup: null
};

const PROFILES: Record<
  "chill" | "balanced" | "strict" | "siege",
  {
    title: string;
    subtitle: string;
    dashboardPatch: any;
    lockdownPatch: any;
    raidPatch: any;
  }
> = {
  chill: {
    title: "Chill",
    subtitle: "Low friction, light guardrails",
    dashboardPatch: {
      features: { securityEnabled: true, lockdownEnabled: false, raidEnabled: true },
      security: {
        lockdown: { enabled: false, mentionThreshold: 999, linkThreshold: 999, actionPreset: "soft" },
        raid: { enabled: true, joinBurstThreshold: 20, windowSeconds: 30, actionPreset: "observe", autoEscalate: false }
      }
    },
    lockdownPatch: {
      enabled: false,
      joinThresholdPerMinute: 999,
      mentionThresholdPerMinute: 999,
      autoEscalation: false,
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    raidPatch: {
      enabled: true,
      joinBurstThreshold: 20,
      windowSeconds: 30,
      actionPreset: "observe",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: false
    }
  },
  balanced: {
    title: "Balanced",
    subtitle: "Recommended default for most servers",
    dashboardPatch: {
      features: { securityEnabled: true, lockdownEnabled: true, raidEnabled: true },
      security: {
        lockdown: { enabled: true, mentionThreshold: 12, linkThreshold: 6, actionPreset: "strict" },
        raid: { enabled: true, joinBurstThreshold: 8, windowSeconds: 30, actionPreset: "contain", autoEscalate: true }
      }
    },
    lockdownPatch: {
      enabled: true,
      joinThresholdPerMinute: 12,
      mentionThresholdPerMinute: 18,
      autoEscalation: true,
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    raidPatch: {
      enabled: true,
      joinBurstThreshold: 8,
      windowSeconds: 30,
      actionPreset: "contain",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: true
    }
  },
  strict: {
    title: "Strict",
    subtitle: "High moderation posture",
    dashboardPatch: {
      features: { securityEnabled: true, lockdownEnabled: true, raidEnabled: true },
      security: {
        lockdown: { enabled: true, mentionThreshold: 8, linkThreshold: 4, actionPreset: "strict" },
        raid: { enabled: true, joinBurstThreshold: 6, windowSeconds: 30, actionPreset: "contain", autoEscalate: true }
      }
    },
    lockdownPatch: {
      enabled: true,
      joinThresholdPerMinute: 8,
      mentionThresholdPerMinute: 12,
      autoEscalation: true,
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    raidPatch: {
      enabled: true,
      joinBurstThreshold: 6,
      windowSeconds: 30,
      actionPreset: "contain",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: true
    }
  },
  siege: {
    title: "Siege",
    subtitle: "Emergency mode",
    dashboardPatch: {
      features: { securityEnabled: true, lockdownEnabled: true, raidEnabled: true },
      security: {
        lockdown: { enabled: true, mentionThreshold: 4, linkThreshold: 2, actionPreset: "hard" },
        raid: { enabled: true, joinBurstThreshold: 3, windowSeconds: 20, actionPreset: "lock", autoEscalate: true }
      }
    },
    lockdownPatch: {
      enabled: true,
      joinThresholdPerMinute: 4,
      mentionThresholdPerMinute: 6,
      autoEscalation: true,
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    raidPatch: {
      enabled: true,
      joinBurstThreshold: 3,
      windowSeconds: 20,
      actionPreset: "lock",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: true
    }
  }
};

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

function getGuildId() {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function SecurityProfilesPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<ProfilesConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
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
        const r = await fetch(`/api/setup/security-profiles?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        setCfg({ ...DEFAULT_CONFIG, ...(j?.config || {}) });
      } catch (e: any) {
        setMsg(e?.message || "Failed to load profiles");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function saveProfileState(patch: Partial<ProfilesConfig>) {
    const r = await fetch("/api/setup/security-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || j?.success === false) throw new Error(j?.error || "State save failed");
    setCfg({ ...cfg, ...patch });
  }

  async function applyProfile(profileId: "chill" | "balanced" | "strict" | "siege") {
    if (!guildId) return;
    const p = PROFILES[profileId];
    setApplying(profileId);
    setMsg("");

    try {
      const requests = [
        fetch("/api/bot/dashboard-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, patch: p.dashboardPatch })
        }),
        fetch("/api/bot/engine-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, engine: "lockdown", patch: p.lockdownPatch })
        }),
        fetch("/api/bot/engine-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, engine: "raid", patch: p.raidPatch })
        })
      ];

      const rs = await Promise.all(requests);
      const js = await Promise.all(rs.map((r) => r.json().catch(() => ({}))));
      for (let i = 0; i < rs.length; i += 1) {
        if (!rs[i].ok || js[i]?.success === false) {
          throw new Error(js[i]?.error || "Profile apply failed");
        }
      }

      const now = new Date().toISOString();
      await saveProfileState({ selectedProfile: profileId, lastAppliedAt: now });
      setMsg(`Applied profile: ${p.title}`);
    } catch (e: any) {
      setMsg(e?.message || "Apply failed");
    } finally {
      setApplying("");
    }
  }

  async function saveNotes() {
    if (!guildId) return;
    setSavingNotes(true);
    setMsg("");
    try {
      await saveProfileState({ notes: cfg.notes });
      setMsg("Saved notes.");
    } catch (e: any) {
      setMsg(e?.message || "Save notes failed");
    } finally {
      setSavingNotes(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ffb3b3", padding: 18, maxWidth: 1220 }}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Security Profiles
      </h1>
      <div style={{ marginBottom: 12 }}>
        Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId} {msg ? `• ${msg}` : ""}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ marginBottom: 6 }}>
              Current profile: <b>{cfg.selectedProfile}</b>
            </div>
            <div style={{ marginBottom: 6 }}>
              Last applied: {cfg.lastAppliedAt ? new Date(cfg.lastAppliedAt).toLocaleString() : "never"}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(280px,1fr))", gap: 12, marginBottom: 14 }}>
            {(Object.keys(PROFILES) as Array<"chill" | "balanced" | "strict" | "siege">).map((k) => (
              <div key={k} style={card}>
                <h3 style={{ marginTop: 0, color: "#ff4444" }}>{PROFILES[k].title}</h3>
                <div style={{ marginBottom: 10 }}>{PROFILES[k].subtitle}</div>
                <button style={btn} onClick={() => applyProfile(k)} disabled={applying.length > 0}>
                  {applying === k ? "Applying..." : `Apply ${PROFILES[k].title}`}
                </button>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Notes</h3>
            <textarea
              style={{ ...input, minHeight: 90 }}
              value={cfg.notes || ""}
              onChange={(e) => setCfg({ ...cfg, notes: e.target.value })}
              placeholder="Profile notes / runbook"
            />
            <div style={{ marginTop: 8 }}>
              <button style={btn} onClick={saveNotes} disabled={savingNotes}>
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
