"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type Guild = { id: string; name: string; icon?: string | null };

type DashboardConfig = {
  features: {
    coreEnabled: boolean;
    securityEnabled: boolean;
    onboardingEnabled: boolean;
    verificationEnabled: boolean;
    lockdownEnabled: boolean;
    raidEnabled: boolean;
    giveawaysEnabled: boolean;
    economyEnabled: boolean;
    heistEnabled: boolean;
    ticketsEnabled: boolean;
    pokemonEnabled: boolean;
    pokemonPrivateOnly: boolean;
    aiEnabled: boolean;
    ttsEnabled: boolean;
  };
  persona: {
    guildNickname: string;
    webhookName: string;
    webhookAvatarUrl: string;
    useWebhookPersona: boolean;
  };
  security: {
    preOnboarding: {
      enabled: boolean;
      autoKickOnFail: boolean;
      kickDelayMinutes: number;
      minAccountAgeDays: number;
      bypassRoleIds: string[];
      quarantineRoleId: string;
      failMessageTemplate: string;
      logChannelId: string;
    };
    onboarding: {
      enabled: boolean;
      welcomeChannelId: string;
      welcomeMessageTemplate: string;
      panelBodyTemplate: string;
      rulesChannelId: string;
      dmTemplate: string;
      sendWelcomeDm: boolean;
    };
    verification: {
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
    lockdown: {
      enabled: boolean;
      mentionThreshold: number;
      linkThreshold: number;
      actionPreset: string;
      exemptRoleIds: string[];
      exemptChannelIds: string[];
    };
    raid: {
      enabled: boolean;
      joinBurstThreshold: number;
      windowSeconds: number;
      actionPreset: string;
      exemptRoleIds: string[];
      exemptChannelIds: string[];
      autoEscalate: boolean;
    };
  };
};

const DEFAULT_CONFIG: DashboardConfig = {
  features: {
    coreEnabled: true,
    securityEnabled: true,
    onboardingEnabled: true,
    verificationEnabled: true,
    lockdownEnabled: true,
    raidEnabled: true,
    giveawaysEnabled: true,
    economyEnabled: true,
    heistEnabled: true,
    ticketsEnabled: true,
    pokemonEnabled: true,
    pokemonPrivateOnly: true,
    aiEnabled: true,
    ttsEnabled: true
  },
  persona: {
    guildNickname: "",
    webhookName: "",
    webhookAvatarUrl: "",
    useWebhookPersona: false
  },
  security: {
    preOnboarding: {
      enabled: true,
      autoKickOnFail: true,
      kickDelayMinutes: 10,
      minAccountAgeDays: 7,
      bypassRoleIds: [],
      quarantineRoleId: "",
      failMessageTemplate: "Verification required before access.",
      logChannelId: ""
    },
    onboarding: {
      enabled: true,
      welcomeChannelId: "",
      welcomeMessageTemplate: "",
      panelBodyTemplate: "",
      rulesChannelId: "",
      dmTemplate: "",
      sendWelcomeDm: true
    },
    verification: {
      enabled: true,
      idTimeoutMinutes: 30,
      roleOnVerifyId: "",
      removeRoleIdsOnVerify: [],
      declineAction: "kick",
      ticketCategoryId: "",
      ticketChannelId: "",
      approverRoleIds: [],
      autoKickOnTimeout: true
    },
    lockdown: {
      enabled: true,
      mentionThreshold: 10,
      linkThreshold: 5,
      actionPreset: "strict",
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    raid: {
      enabled: true,
      joinBurstThreshold: 6,
      windowSeconds: 30,
      actionPreset: "contain",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: true
    }
  }
};

function cloneDefaults(): DashboardConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function fromCsv(v: string): string[] {
  return v.split(",").map((x) => x.trim()).filter(Boolean);
}

function toCsv(v: string[]): string {
  return (v || []).join(", ");
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ border: "1px solid #6f0000", borderRadius: 12, padding: 16, marginBottom: 14, background: "rgba(120,0,0,0.08)" }}>
      <h3 style={{ margin: "0 0 12px", color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>{title}</h3>
      {children}
    </div>
  );
}

function rowStyle(): React.CSSProperties {
  return { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 };
}

function inputStyle(): React.CSSProperties {
  return { width: "100%", padding: 10, background: "#0d0d0d", border: "1px solid #7a0000", color: "#ffd2d2", borderRadius: 8 };
}

export default function DashboardPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [config, setConfig] = useState<DashboardConfig>(cloneDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const guildName = useMemo(() => guilds.find((g) => g.id === guildId)?.name || guildId, [guilds, guildId]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const urlGuild = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("guildId") || "" : "";
        const stored = typeof window !== "undefined" ? localStorage.getItem("activeGuildId") || "" : "";
        const next = urlGuild || stored || list[0]?.id || "";
        if (next) {
          setGuildId(next);
          if (typeof window !== "undefined") {
            localStorage.setItem("activeGuildId", next);
            const url = new URL(window.location.href);
            url.searchParams.set("guildId", next);
            window.history.replaceState({}, "", url.toString());
          }
        } else {
          setLoading(false);
        }
      } catch {
        setLoading(false);
        setMsg("Failed to load guild list.");
      }
    })();
  }, []);

  useEffect(() => {
    if (!guildId) return;

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
        const j = await r.json();

        const merged = cloneDefaults();
        if (j?.config?.features) merged.features = { ...merged.features, ...j.config.features };
        if (j?.config?.persona) merged.persona = { ...merged.persona, ...j.config.persona };
        if (j?.config?.security?.preOnboarding) merged.security.preOnboarding = { ...merged.security.preOnboarding, ...j.config.security.preOnboarding };
        if (j?.config?.security?.onboarding) merged.security.onboarding = { ...merged.security.onboarding, ...j.config.security.onboarding };
        if (j?.config?.security?.verification) merged.security.verification = { ...merged.security.verification, ...j.config.security.verification };
        if (j?.config?.security?.lockdown) merged.security.lockdown = { ...merged.security.lockdown, ...j.config.security.lockdown };
        if (j?.config?.security?.raid) merged.security.raid = { ...merged.security.raid, ...j.config.security.raid };

        setConfig(merged);
      } catch {
        setMsg("Failed to load guild config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  function switchGuild(next: string) {
    setGuildId(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeGuildId", next);
      const url = new URL(window.location.href);
      url.searchParams.set("guildId", next);
      window.history.replaceState({}, "", url.toString());
    }
  }

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            features: config.features,
            persona: config.persona,
            security: config.security
          }
        })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setMsg("Saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 22, color: "#ff4a4a" }}>
      <h1 style={{ margin: 0, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ff2a2a" }}>SaaS Control Center</h1>
      <p style={{ marginTop: 8 }}>Per-guild deep config. No overlap. No global bleed.</p>

      <div style={{ ...rowStyle(), gridTemplateColumns: "2fr 1fr" }}>
        <div>
          <label>Guild</label>
          <select value={guildId} onChange={(e) => switchGuild(e.target.value)} style={inputStyle()}>
            {guilds.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.id})</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "end", gap: 10 }}>
          <button onClick={save} disabled={saving || !guildId} style={{ padding: "10px 16px", border: "1px solid #a70000", background: "#1a0000", color: "#ff6767", borderRadius: 8 }}>
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      <p style={{ color: "#ff8a8a" }}>{guildName ? `Active: ${guildName}` : ""} {msg ? `• ${msg}` : ""}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <Card title="Features">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
              {Object.keys(config.features).map((k) => (
                <label key={k} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 8 }}>
                  <input
                    type="checkbox"
                    checked={(config.features as any)[k]}
                    onChange={(e) => setConfig((p) => ({ ...p, features: { ...p.features, [k]: e.target.checked } }))}
                  />{" "}
                  {k}
                </label>
              ))}
            </div>
          </Card>

          <Card title="Pre-Onboarding">
            <div style={rowStyle()}>
              <label><input type="checkbox" checked={config.security.preOnboarding.enabled} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, enabled: e.target.checked } } }))} /> enabled</label>
              <label><input type="checkbox" checked={config.security.preOnboarding.autoKickOnFail} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, autoKickOnFail: e.target.checked } } }))} /> autoKickOnFail</label>
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} type="number" value={config.security.preOnboarding.kickDelayMinutes} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, kickDelayMinutes: Number(e.target.value || 0) } } }))} placeholder="kickDelayMinutes" />
              <input style={inputStyle()} type="number" value={config.security.preOnboarding.minAccountAgeDays} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, minAccountAgeDays: Number(e.target.value || 0) } } }))} placeholder="minAccountAgeDays" />
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} value={config.security.preOnboarding.logChannelId} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, logChannelId: e.target.value } } }))} placeholder="logChannelId" />
              <input style={inputStyle()} value={config.security.preOnboarding.quarantineRoleId} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, quarantineRoleId: e.target.value } } }))} placeholder="quarantineRoleId" />
            </div>
            <input style={inputStyle()} value={toCsv(config.security.preOnboarding.bypassRoleIds)} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, bypassRoleIds: fromCsv(e.target.value) } } }))} placeholder="bypassRoleIds (comma-separated)" />
            <div style={{ marginTop: 10 }}>
              <textarea style={{ ...inputStyle(), minHeight: 80 }} value={config.security.preOnboarding.failMessageTemplate} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, failMessageTemplate: e.target.value } } }))} placeholder="failMessageTemplate" />
            </div>
          </Card>

          <Card title="Onboarding">
            <div style={rowStyle()}>
              <label><input type="checkbox" checked={config.security.onboarding.enabled} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, enabled: e.target.checked } } }))} /> enabled</label>
              <label><input type="checkbox" checked={config.security.onboarding.sendWelcomeDm} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, sendWelcomeDm: e.target.checked } } }))} /> sendWelcomeDm</label>
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} value={config.security.onboarding.welcomeChannelId} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, welcomeChannelId: e.target.value } } }))} placeholder="welcomeChannelId" />
              <input style={inputStyle()} value={config.security.onboarding.rulesChannelId} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, rulesChannelId: e.target.value } } }))} placeholder="rulesChannelId" />
            </div>
            <textarea style={{ ...inputStyle(), minHeight: 70, marginBottom: 8 }} value={config.security.onboarding.welcomeMessageTemplate} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, welcomeMessageTemplate: e.target.value } } }))} placeholder="welcomeMessageTemplate" />
            <textarea style={{ ...inputStyle(), minHeight: 70, marginBottom: 8 }} value={config.security.onboarding.panelBodyTemplate} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, panelBodyTemplate: e.target.value } } }))} placeholder="panelBodyTemplate" />
            <textarea style={{ ...inputStyle(), minHeight: 70 }} value={config.security.onboarding.dmTemplate} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, dmTemplate: e.target.value } } }))} placeholder="dmTemplate" />
          </Card>

          <Card title="Verification">
            <div style={rowStyle()}>
              <label><input type="checkbox" checked={config.security.verification.enabled} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, enabled: e.target.checked } } }))} /> enabled</label>
              <label><input type="checkbox" checked={config.security.verification.autoKickOnTimeout} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, autoKickOnTimeout: e.target.checked } } }))} /> autoKickOnTimeout</label>
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} type="number" value={config.security.verification.idTimeoutMinutes} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, idTimeoutMinutes: Number(e.target.value || 0) } } }))} placeholder="idTimeoutMinutes" />
              <select style={inputStyle()} value={config.security.verification.declineAction} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, declineAction: e.target.value as "kick" | "role" | "timeout" } } }))}>
                <option value="kick">kick</option>
                <option value="role">role</option>
                <option value="timeout">timeout</option>
              </select>
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} value={config.security.verification.ticketCategoryId} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, ticketCategoryId: e.target.value } } }))} placeholder="ticketCategoryId" />
              <input style={inputStyle()} value={config.security.verification.ticketChannelId} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, ticketChannelId: e.target.value } } }))} placeholder="ticketChannelId" />
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} value={config.security.verification.roleOnVerifyId} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, roleOnVerifyId: e.target.value } } }))} placeholder="roleOnVerifyId" />
              <input style={inputStyle()} value={toCsv(config.security.verification.approverRoleIds)} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, approverRoleIds: fromCsv(e.target.value) } } }))} placeholder="approverRoleIds (comma-separated)" />
            </div>
            <input style={inputStyle()} value={toCsv(config.security.verification.removeRoleIdsOnVerify)} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, removeRoleIdsOnVerify: fromCsv(e.target.value) } } }))} placeholder="removeRoleIdsOnVerify (comma-separated)" />
          </Card>

          <Card title="Lockdown + Raid + Persona">
            <div style={rowStyle()}>
              <input style={inputStyle()} type="number" value={config.security.lockdown.mentionThreshold} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, mentionThreshold: Number(e.target.value || 0) } } }))} placeholder="lockdown mentionThreshold" />
              <input style={inputStyle()} type="number" value={config.security.lockdown.linkThreshold} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, linkThreshold: Number(e.target.value || 0) } } }))} placeholder="lockdown linkThreshold" />
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} type="number" value={config.security.raid.joinBurstThreshold} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, joinBurstThreshold: Number(e.target.value || 0) } } }))} placeholder="raid joinBurstThreshold" />
              <input style={inputStyle()} type="number" value={config.security.raid.windowSeconds} onChange={(e) => setConfig((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, windowSeconds: Number(e.target.value || 0) } } }))} placeholder="raid windowSeconds" />
            </div>
            <div style={rowStyle()}>
              <input style={inputStyle()} value={config.persona.guildNickname} onChange={(e) => setConfig((p) => ({ ...p, persona: { ...p.persona, guildNickname: e.target.value } }))} placeholder="persona guildNickname" />
              <input style={inputStyle()} value={config.persona.webhookName} onChange={(e) => setConfig((p) => ({ ...p, persona: { ...p.persona, webhookName: e.target.value } }))} placeholder="persona webhookName" />
            </div>
            <input style={inputStyle()} value={config.persona.webhookAvatarUrl} onChange={(e) => setConfig((p) => ({ ...p, persona: { ...p.persona, webhookAvatarUrl: e.target.value } }))} placeholder="persona webhookAvatarUrl" />
            <div style={{ marginTop: 8 }}>
              <label><input type="checkbox" checked={config.persona.useWebhookPersona} onChange={(e) => setConfig((p) => ({ ...p, persona: { ...p.persona, useWebhookPersona: e.target.checked } }))} /> useWebhookPersona</label>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
