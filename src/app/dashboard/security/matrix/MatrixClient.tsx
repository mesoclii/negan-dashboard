"use client";



import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Config = {
  features?: Record<string, boolean>;
  security?: any;
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function SecurityMatrixPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<Config>({});
  const [loading, setLoading] = useState(true);
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
        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();
        setCfg(j?.config || {});
      } catch (e: any) {
        setMsg(e?.message || "Failed to load config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const wired = useMemo(() => {
    const s = cfg?.security || {};
    return [
      {
        id: "preOnboarding",
        label: "Pre-Onboarding",
        enabled: !!s?.preOnboarding?.enabled,
        route: "/dashboard/security/pre-onboarding",
        detail: "Gate checks before access",
      },
      {
        id: "onboarding",
        label: "Onboarding",
        enabled: !!s?.onboarding?.enabled,
        route: "/dashboard/security/onboarding",
        detail: "Welcome + join flow",
      },
      {
        id: "verification",
        label: "Verification",
        enabled: !!s?.verification?.enabled,
        route: "/dashboard/security/verification",
        detail: "Verification + timeout/decline behavior",
      },
      {
        id: "lockdown",
        label: "Lockdown",
        enabled: !!s?.lockdown?.enabled,
        route: "/dashboard/security/lockdown",
        detail: "Threshold controls + exemptions",
      },
      {
        id: "raid",
        label: "Raid",
        enabled: !!s?.raid?.enabled,
        route: "/dashboard/security/raid",
        detail: "Join burst controls + escalation",
      },
    ];
  }, [cfg]);

  const coreManaged = [
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

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ffd0d0", maxWidth: 1200 }}>
      <h1 style={{ margin: "0 0 8px", color: "#ff4f4f", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Security Matrix
      </h1>
      <div style={{ marginBottom: 14, color: "#ff8d8d" }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>

      {msg ? (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #7a0000", borderRadius: 8, background: "#180000" }}>
          {msg}
        </div>
      ) : null}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <section style={{ marginBottom: 14, border: "1px solid #6f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 10px", color: "#ff6060", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Wired And Editable
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10 }}>
              {wired.map((e) => (
                <div key={e.id} style={{ border: "1px solid #5a0000", borderRadius: 10, padding: 10, background: "#100000" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <b>{e.label}</b>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 999,
                        border: `1px solid ${e.enabled ? "#1f8a3f" : "#8a2f2f"}`,
                        color: e.enabled ? "#88ffb1" : "#ff9a9a",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {e.enabled ? "ON" : "OFF"}
                    </span>
                  </div>
                  <div style={{ marginTop: 8, color: "#ffb3b3", fontSize: 13 }}>{e.detail}</div>
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
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.08)" }}>
            <h2 style={{ margin: "0 0 10px", color: "#ff6060", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Core Security Engines (Runtime Managed)
            </h2>
            <div style={{ color: "#ff9b9b", marginBottom: 10, fontSize: 13 }}>
              These are active in bot runtime but not yet exposed as per-guild editable controls.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
              {coreManaged.map((name) => (
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
