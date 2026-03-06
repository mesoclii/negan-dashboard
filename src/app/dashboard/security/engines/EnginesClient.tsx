"use client";



import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DashboardConfig = {
  features?: Record<string, boolean>;
  security?: {
    preOnboarding?: any;
    onboarding?: any;
    verification?: any;
    lockdown?: any;
    raid?: any;
  };
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function pill(on: boolean) {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${on ? "#1f8a3f" : "#8a2f2f"}`,
    color: on ? "#88ffb1" : "#ff9a9a",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.06em",
  } as React.CSSProperties;
}

const CORE_RUNTIME_SECURITY_ENGINES = [
  "accountIntegrityEngine",
  "linkIntelEngine",
  "threatIntelEngine",
  "governanceEngine",
  "containmentEngine",
  "behavioralDriftEngine",
  "trustWeightEngine",
  "riskEscalationEngine",
  "forensicsEngine",
  "crewSecurityEngine",
  "shadowLayerEngine",
  "staffActivityMonitorEngine",
  "securityEnforcerEngine",
  "blacklistEngine",
  "gateEngine",
];

export default function SecurityEnginesPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [cfg, setCfg] = useState<DashboardConfig>({});

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
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        setCfg(j?.config || {});
      } catch (e: any) {
        setMsg(e?.message || "Failed to load security engine config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const editable = useMemo(() => {
    const f = cfg?.features || {};
    const s = cfg?.security || {};
    const pre = s.preOnboarding || {};
    const onb = s.onboarding || {};
    const ver = s.verification || {};
    const lock = s.lockdown || {};
    const raid = s.raid || {};

    return [
      {
        key: "preOnboarding",
        label: "Pre-Onboarding",
        enabled: pre.enabled === true,
        route: "/dashboard/security/pre-onboarding",
        detail: "Join gate checks, bypass roles, fail handling",
        quality:
          pre.failMessageTemplate && pre.failMessageTemplate.trim() ? "Configured" : "Needs message template",
      },
      {
        key: "verification",
        label: "Verification",
        enabled: f.verificationEnabled !== false && ver.enabled !== false,
        route: "/dashboard/security/verification",
        detail: "Timeout/decline behavior, roles, ticket mapping",
        quality:
          ver.ticketCategoryId || ver.ticketChannelId ? "Configured" : "Needs ticket mapping",
      },
      {
        key: "onboarding",
        label: "Onboarding",
        enabled: f.onboardingEnabled !== false && onb.enabled !== false,
        route: "/dashboard/security/onboarding",
        detail: "Welcome copy, DM flow, rules/welcome channels",
        quality:
          onb.welcomeChannelId && onb.rulesChannelId ? "Configured" : "Needs channel mapping",
      },
      {
        key: "lockdown",
        label: "Lockdown",
        enabled: f.lockdownEnabled === true && lock.enabled === true,
        route: "/dashboard/security/lockdown",
        detail: "Emergency thresholds + exemptions",
        quality: "Configurable",
      },
      {
        key: "raid",
        label: "Raid",
        enabled: f.raidEnabled === true && raid.enabled === true,
        route: "/dashboard/security/raid",
        detail: "Join burst detection + escalation",
        quality: "Configurable",
      },
    ];
  }, [cfg]);

  const enabledCount = editable.filter((e) => e.enabled).length;

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ffd0d0", maxWidth: 1280 }}>
      <h1 style={{ margin: "0 0 8px", color: "#ff4f4f", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Security Engines
      </h1>
      <div style={{ marginBottom: 10, color: "#ff8d8d" }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      <div style={{ marginBottom: 14, color: "#ffb1b1" }}>
        Editable engines enabled: <b>{enabledCount}/{editable.length}</b>
      </div>

      {msg ? (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #7a0000", borderRadius: 8, background: "#180000" }}>
          {msg}
        </div>
      ) : null}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <section
            style={{
              marginBottom: 14,
              border: "1px solid #6f0000",
              borderRadius: 12,
              padding: 14,
              background: "rgba(120,0,0,0.08)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", color: "#ff6060", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Per-Guild Editable Security Engines
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
              {editable.map((e) => (
                <div
                  key={e.key}
                  style={{ border: "1px solid #5a0000", borderRadius: 10, padding: 10, background: "#100000" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <b>{e.label}</b>
                    <span style={pill(e.enabled)}>{e.enabled ? "ON" : "OFF"}</span>
                  </div>
                  <div style={{ marginTop: 8, color: "#ffb3b3", fontSize: 13 }}>{e.detail}</div>
                  <div style={{ marginTop: 6, color: "#ff8f8f", fontSize: 12 }}>{e.quality}</div>

                  <Link
                    href={`${e.route}?guildId=${encodeURIComponent(guildId)}`}
                    style={{
                      marginTop: 10,
                      display: "inline-block",
                      textDecoration: "none",
                      border: "1px solid #7a0000",
                      borderRadius: 8,
                      padding: "6px 10px",
                      color: "#ffd0d0",
                      background: "#140000",
                      fontWeight: 700,
                    }}
                  >
                    Open Engine
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              border: "1px solid #6f0000",
              borderRadius: 12,
              padding: 14,
              background: "rgba(120,0,0,0.08)",
            }}
          >
            <h2 style={{ margin: "0 0 10px", color: "#ff6060", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Core Runtime Security Engines
            </h2>
            <div style={{ color: "#ff9b9b", marginBottom: 10, fontSize: 13 }}>
              These are active in bot runtime. They are not yet per-guild editable in dashboard.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
              {CORE_RUNTIME_SECURITY_ENGINES.map((name) => (
                <div key={name} style={{ border: "1px solid #4f0000", borderRadius: 8, padding: "8px 10px", background: "#0e0000" }}>
                  <div style={{ fontWeight: 700 }}>{name}</div>
                  <div style={{ marginTop: 4, color: "#c99", fontSize: 12 }}>Runtime managed</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
