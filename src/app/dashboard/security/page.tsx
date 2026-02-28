"use client";

import { useEffect, useMemo, useState } from "react";

type GuildRole = {
  id: string;
  name: string;
  position?: number;
};

type GuildChannel = {
  id: string;
  name: string;
  type?: number;
  parentId?: string | null;
  position?: number;
};

type DeclineAction = "kick" | "role" | "timeout";
type LockPreset = "strict" | "balanced" | "contain" | "off";
type AutoModPreset = "off" | "warn" | "timeout" | "kick";

type PreOnboardingCfg = {
  enabled: boolean;
  autoKickOnFail: boolean;
  kickDelayMinutes: number;
  minAccountAgeDays: number;
  bypassRoleIds: string[];
  quarantineRoleId: string;
  failMessageTemplate: string;
  logChannelId: string;
};

type OnboardingCfg = {
  enabled: boolean;
  welcomeChannelId: string;
  welcomeMessageTemplate: string;
  panelBodyTemplate: string;
  rulesChannelId: string;
  dmTemplate: string;
  sendWelcomeDm: boolean;
};

type VerificationCfg = {
  enabled: boolean;
  idTimeoutMinutes: number;
  roleOnVerifyId: string;
  removeRoleIdsOnVerify: string[];
  declineAction: DeclineAction;
  ticketCategoryId: string;
  ticketChannelId: string;
  approverRoleIds: string[];
  autoKickOnTimeout: boolean;
};

type LockdownCfg = {
  enabled: boolean;
  mentionThreshold: number;
  linkThreshold: number;
  actionPreset: LockPreset;
  exemptRoleIds: string[];
  exemptChannelIds: string[];
};

type RaidCfg = {
  enabled: boolean;
  joinBurstThreshold: number;
  windowSeconds: number;
  actionPreset: LockPreset;
  exemptRoleIds: string[];
  exemptChannelIds: string[];
  autoEscalate: boolean;
};

type ModerationCfg = {
  enabled: boolean;
  logChannelId: string;
  ignoredChannelIds: string[];
  immunityRoleIds: string[];
  restrictedChannelIds: string[];
  blockCommands: boolean;
  blockImages: boolean;
  blockLinks: boolean;
  events: {
    memberJoined: boolean;
    memberLeft: boolean;
    memberBanned: boolean;
    memberUnbanned: boolean;
    roleCreated: boolean;
    roleDeleted: boolean;
    channelCreated: boolean;
    channelDeleted: boolean;
    messageDeleted: boolean;
    messageEdited: boolean;
  };
  automod: {
    preset: AutoModPreset;
    repeatThreshold: number;
    mentionThreshold: number;
    linkThreshold: number;
    timeoutMinutes: number;
  };
};

type SecurityCfg = {
  preOnboarding: PreOnboardingCfg;
  onboarding: OnboardingCfg;
  verification: VerificationCfg;
  lockdown: LockdownCfg;
  raid: RaidCfg;
  moderation: ModerationCfg;
};

type DraftState = {
  features: {
    securityEnabled: boolean;
  };
  security: SecurityCfg;
};

const DEFAULT_STATE: DraftState = {
  features: {
    securityEnabled: true,
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
      logChannelId: "",
    },
    onboarding: {
      enabled: true,
      welcomeChannelId: "",
      welcomeMessageTemplate: "",
      panelBodyTemplate: "",
      rulesChannelId: "",
      dmTemplate: "",
      sendWelcomeDm: true,
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
      autoKickOnTimeout: true,
    },
    lockdown: {
      enabled: true,
      mentionThreshold: 10,
      linkThreshold: 5,
      actionPreset: "strict",
      exemptRoleIds: [],
      exemptChannelIds: [],
    },
    raid: {
      enabled: true,
      joinBurstThreshold: 6,
      windowSeconds: 30,
      actionPreset: "contain",
      exemptRoleIds: [],
      exemptChannelIds: [],
      autoEscalate: true,
    },
    moderation: {
      enabled: false,
      logChannelId: "",
      ignoredChannelIds: [],
      immunityRoleIds: [],
      restrictedChannelIds: [],
      blockCommands: false,
      blockImages: false,
      blockLinks: false,
      events: {
        memberJoined: true,
        memberLeft: true,
        memberBanned: true,
        memberUnbanned: true,
        roleCreated: true,
        roleDeleted: true,
        channelCreated: true,
        channelDeleted: true,
        messageDeleted: true,
        messageEdited: true,
      },
      automod: {
        preset: "off",
        repeatThreshold: 5,
        mentionThreshold: 8,
        linkThreshold: 5,
        timeoutMinutes: 10,
      },
    },
  },
};

function cloneDefaults(): DraftState {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x || "").trim()).filter(Boolean);
}

function asBool(v: unknown, fallback: boolean): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function asNum(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeSecurity(raw: any): SecurityCfg {
  const d = cloneDefaults().security;
  const s = raw || {};

  return {
    preOnboarding: {
      enabled: asBool(s?.preOnboarding?.enabled, d.preOnboarding.enabled),
      autoKickOnFail: asBool(s?.preOnboarding?.autoKickOnFail, d.preOnboarding.autoKickOnFail),
      kickDelayMinutes: asNum(s?.preOnboarding?.kickDelayMinutes, d.preOnboarding.kickDelayMinutes),
      minAccountAgeDays: asNum(s?.preOnboarding?.minAccountAgeDays, d.preOnboarding.minAccountAgeDays),
      bypassRoleIds: asStringArray(s?.preOnboarding?.bypassRoleIds),
      quarantineRoleId: String(s?.preOnboarding?.quarantineRoleId || ""),
      failMessageTemplate: String(s?.preOnboarding?.failMessageTemplate || d.preOnboarding.failMessageTemplate),
      logChannelId: String(s?.preOnboarding?.logChannelId || ""),
    },
    onboarding: {
      enabled: asBool(s?.onboarding?.enabled, d.onboarding.enabled),
      welcomeChannelId: String(s?.onboarding?.welcomeChannelId || ""),
      welcomeMessageTemplate: String(s?.onboarding?.welcomeMessageTemplate || ""),
      panelBodyTemplate: String(s?.onboarding?.panelBodyTemplate || ""),
      rulesChannelId: String(s?.onboarding?.rulesChannelId || ""),
      dmTemplate: String(s?.onboarding?.dmTemplate || ""),
      sendWelcomeDm: asBool(s?.onboarding?.sendWelcomeDm, d.onboarding.sendWelcomeDm),
    },
    verification: {
      enabled: asBool(s?.verification?.enabled, d.verification.enabled),
      idTimeoutMinutes: asNum(s?.verification?.idTimeoutMinutes, d.verification.idTimeoutMinutes),
      roleOnVerifyId: String(s?.verification?.roleOnVerifyId || ""),
      removeRoleIdsOnVerify: asStringArray(s?.verification?.removeRoleIdsOnVerify),
      declineAction: (["kick", "role", "timeout"].includes(String(s?.verification?.declineAction))
        ? s?.verification?.declineAction
        : d.verification.declineAction) as DeclineAction,
      ticketCategoryId: String(s?.verification?.ticketCategoryId || ""),
      ticketChannelId: String(s?.verification?.ticketChannelId || ""),
      approverRoleIds: asStringArray(s?.verification?.approverRoleIds),
      autoKickOnTimeout: asBool(s?.verification?.autoKickOnTimeout, d.verification.autoKickOnTimeout),
    },
    lockdown: {
      enabled: asBool(s?.lockdown?.enabled, d.lockdown.enabled),
      mentionThreshold: asNum(s?.lockdown?.mentionThreshold, d.lockdown.mentionThreshold),
      linkThreshold: asNum(s?.lockdown?.linkThreshold, d.lockdown.linkThreshold),
      actionPreset: (["strict", "balanced", "contain", "off"].includes(String(s?.lockdown?.actionPreset))
        ? s?.lockdown?.actionPreset
        : d.lockdown.actionPreset) as LockPreset,
      exemptRoleIds: asStringArray(s?.lockdown?.exemptRoleIds),
      exemptChannelIds: asStringArray(s?.lockdown?.exemptChannelIds),
    },
    raid: {
      enabled: asBool(s?.raid?.enabled, d.raid.enabled),
      joinBurstThreshold: asNum(s?.raid?.joinBurstThreshold, d.raid.joinBurstThreshold),
      windowSeconds: asNum(s?.raid?.windowSeconds, d.raid.windowSeconds),
      actionPreset: (["strict", "balanced", "contain", "off"].includes(String(s?.raid?.actionPreset))
        ? s?.raid?.actionPreset
        : d.raid.actionPreset) as LockPreset,
      exemptRoleIds: asStringArray(s?.raid?.exemptRoleIds),
      exemptChannelIds: asStringArray(s?.raid?.exemptChannelIds),
      autoEscalate: asBool(s?.raid?.autoEscalate, d.raid.autoEscalate),
    },
    moderation: {
      enabled: asBool(s?.moderation?.enabled, d.moderation.enabled),
      logChannelId: String(s?.moderation?.logChannelId || ""),
      ignoredChannelIds: asStringArray(s?.moderation?.ignoredChannelIds),
      immunityRoleIds: asStringArray(s?.moderation?.immunityRoleIds),
      restrictedChannelIds: asStringArray(s?.moderation?.restrictedChannelIds),
      blockCommands: asBool(s?.moderation?.blockCommands, d.moderation.blockCommands),
      blockImages: asBool(s?.moderation?.blockImages, d.moderation.blockImages),
      blockLinks: asBool(s?.moderation?.blockLinks, d.moderation.blockLinks),
      events: {
        memberJoined: asBool(s?.moderation?.events?.memberJoined, d.moderation.events.memberJoined),
        memberLeft: asBool(s?.moderation?.events?.memberLeft, d.moderation.events.memberLeft),
        memberBanned: asBool(s?.moderation?.events?.memberBanned, d.moderation.events.memberBanned),
        memberUnbanned: asBool(s?.moderation?.events?.memberUnbanned, d.moderation.events.memberUnbanned),
        roleCreated: asBool(s?.moderation?.events?.roleCreated, d.moderation.events.roleCreated),
        roleDeleted: asBool(s?.moderation?.events?.roleDeleted, d.moderation.events.roleDeleted),
        channelCreated: asBool(s?.moderation?.events?.channelCreated, d.moderation.events.channelCreated),
        channelDeleted: asBool(s?.moderation?.events?.channelDeleted, d.moderation.events.channelDeleted),
        messageDeleted: asBool(s?.moderation?.events?.messageDeleted, d.moderation.events.messageDeleted),
        messageEdited: asBool(s?.moderation?.events?.messageEdited, d.moderation.events.messageEdited),
      },
      automod: {
        preset: (["off", "warn", "timeout", "kick"].includes(String(s?.moderation?.automod?.preset))
          ? s?.moderation?.automod?.preset
          : d.moderation.automod.preset) as AutoModPreset,
        repeatThreshold: asNum(s?.moderation?.automod?.repeatThreshold, d.moderation.automod.repeatThreshold),
        mentionThreshold: asNum(s?.moderation?.automod?.mentionThreshold, d.moderation.automod.mentionThreshold),
        linkThreshold: asNum(s?.moderation?.automod?.linkThreshold, d.moderation.automod.linkThreshold),
        timeoutMinutes: asNum(s?.moderation?.automod?.timeoutMinutes, d.moderation.automod.timeoutMinutes),
      },
    },
  };
}

function getInitialGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

const card: React.CSSProperties = {
  border: "1px solid #6f0000",
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
  background: "rgba(120,0,0,0.08)",
};

const input: React.CSSProperties = {
  width: "100%",
  background: "#0d0d0d",
  border: "1px solid #7a0000",
  borderRadius: 8,
  color: "#ffd0d0",
  padding: "10px",
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 82,
  resize: "vertical",
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "#ff9a9a",
  fontSize: 13,
};

function selectedValues(e: React.ChangeEvent<HTMLSelectElement>): string[] {
  return Array.from(e.currentTarget.selectedOptions).map((o) => o.value);
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

export default function SecurityPage() {
  const [guildId, setGuildId] = useState("");
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);

  const [draft, setDraft] = useState<DraftState>(cloneDefaults());
  const [saved, setSaved] = useState<DraftState>(cloneDefaults());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const gid = getInitialGuildId();
    if (!gid) {
      setLoading(false);
      return;
    }
    setGuildId(gid);
  }, []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const [cfgRes, guildRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
        ]);

        const cfg = await cfgRes.json().catch(() => ({}));
        const gd = await guildRes.json().catch(() => ({}));

        const loaded: DraftState = {
          features: {
            securityEnabled: asBool(cfg?.config?.features?.securityEnabled, true),
          },
          security: normalizeSecurity(cfg?.config?.security || {}),
        };

        setSaved(loaded);
        setDraft(JSON.parse(JSON.stringify(loaded)));

        const roleList = Array.isArray(gd?.roles) ? gd.roles : [];
        const channelList = Array.isArray(gd?.channels) ? gd.channels : [];

        setRoles(
          roleList
            .map((r: any) => ({ id: String(r.id), name: String(r.name || r.id), position: Number(r.position || 0) }))
            .sort((a: GuildRole, b: GuildRole) => (b.position || 0) - (a.position || 0))
        );

        setChannels(
          channelList
            .map((c: any) => ({
              id: String(c.id),
              name: String(c.name || c.id),
              type: Number(c.type || 0),
              parentId: c.parentId ?? null,
              position: Number(c.position || 0),
            }))
            .sort((a: GuildChannel, b: GuildChannel) => (a.position || 0) - (b.position || 0))
        );
      } catch (e: any) {
        setMsg(e?.message || "Failed to load security config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(saved),
    [draft, saved]
  );

  function sectionDirty<K extends keyof SecurityCfg>(key: K): boolean {
    return JSON.stringify(draft.security[key]) !== JSON.stringify(saved.security[key]);
  }

  async function postPatch(patch: any) {
    const res = await fetch("/api/bot/dashboard-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      throw new Error(data?.error || "Save failed");
    }
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      await postPatch({
        features: draft.features,
        security: draft.security,
      });
      setSaved(JSON.parse(JSON.stringify(draft)));
      setMsg("Security saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMasterToggle() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      await postPatch({ features: { securityEnabled: draft.features.securityEnabled } });
      setSaved((prev) => ({
        ...prev,
        features: { ...prev.features, securityEnabled: draft.features.securityEnabled },
      }));
      setMsg("Security master toggle saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveSection<K extends keyof SecurityCfg>(key: K) {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      await postPatch({ security: { [key]: draft.security[key] } });
      setSaved((prev) => ({
        ...prev,
        security: {
          ...prev.security,
          [key]: JSON.parse(JSON.stringify(draft.security[key])),
        },
      }));
      setMsg(`${String(key)} saved.`);
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function revertAll() {
    setDraft(JSON.parse(JSON.stringify(saved)));
    setMsg("Reverted unsaved changes.");
  }

  function channelLabel(c: GuildChannel): string {
    if (c.type === 4) return `[Category] ${c.name}`;
    if (c.type === 2) return `[Voice] ${c.name}`;
    return `#${c.name}`;
    }

  const textAndCategoryChannels = useMemo(() => {
    return channels.filter((c) => [0, 2, 4, 5, 11, 12, 15].includes(Number(c.type || 0)));
  }, [channels]);

  if (!guildId) {
    return (
      <div style={{ color: "#ff6b6b", padding: 24 }}>
        Missing guildId. Open from /guilds first.
      </div>
    );
  }

  return (
    <div style={{ color: "#ffd0d0", maxWidth: 1400 }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          padding: 12,
          marginBottom: 14,
          borderRadius: 12,
          border: "1px solid #7a0000",
          background: "rgba(8,0,0,0.92)",
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ff5050" }}>
          Security Center
        </div>

        <label style={{ display: "inline-flex", gap: 8, alignItems: "center", marginLeft: 10 }}>
          <input
            type="checkbox"
            checked={draft.features.securityEnabled}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                features: { ...prev.features, securityEnabled: e.target.checked },
              }))
            }
          />
          Master Security Enabled
        </label>

        <button
          onClick={saveMasterToggle}
          disabled={saving}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #7a0000",
            background: "#170000",
            color: "#ffd0d0",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Save Toggle
        </button>

        <button
          onClick={saveAll}
          disabled={saving || loading || !dirty}
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            border: "1px solid #8f0000",
            background: dirty ? "#b00000" : "#220000",
            color: "#fff",
            fontWeight: 800,
            cursor: dirty ? "pointer" : "default",
          }}
        >
          {saving ? "Saving..." : "Save All"}
        </button>

        <button
          onClick={revertAll}
          disabled={!dirty || loading}
          style={{
            padding: "9px 14px",
            borderRadius: 10,
            border: "1px solid #7a0000",
            background: "#120000",
            color: "#ffd0d0",
            fontWeight: 700,
            cursor: dirty ? "pointer" : "default",
          }}
        >
          Revert
        </button>

        <span style={{ marginLeft: "auto", ...pill(!dirty) }}>{dirty ? "UNSAVED" : "SAVED"}</span>
      </div>

      {msg ? (
        <div style={{ marginBottom: 12, padding: 10, border: "1px solid #7a0000", borderRadius: 8, color: "#ff9a9a" }}>
          {msg}
        </div>
      ) : null}

      {loading ? (
        <div>Loading security config...</div>
      ) : (
        <>
          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Pre-Onboarding
              </h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={pill(draft.security.preOnboarding.enabled)}>
                  {draft.security.preOnboarding.enabled ? "ON" : "OFF"}
                </span>
                <button onClick={() => saveSection("preOnboarding")} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#130000", color: "#ffd0d0" }}>
                  Save Section{sectionDirty("preOnboarding") ? " *" : ""}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={draft.security.preOnboarding.enabled} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, enabled: e.target.checked } } }))} /> enabled</label>
              <label><input type="checkbox" checked={draft.security.preOnboarding.autoKickOnFail} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, autoKickOnFail: e.target.checked } } }))} /> autoKickOnFail</label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label style={label}>kickDelayMinutes</label>
                <input style={input} type="number" value={draft.security.preOnboarding.kickDelayMinutes} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, kickDelayMinutes: Number(e.target.value || 0) } } }))} />
              </div>
              <div>
                <label style={label}>minAccountAgeDays</label>
                <input style={input} type="number" value={draft.security.preOnboarding.minAccountAgeDays} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, minAccountAgeDays: Number(e.target.value || 0) } } }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label style={label}>quarantineRoleId</label>
                <select style={input} value={draft.security.preOnboarding.quarantineRoleId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, quarantineRoleId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>logChannelId</label>
                <select style={input} value={draft.security.preOnboarding.logChannelId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, logChannelId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>bypassRoleIds</label>
              <select multiple size={6} style={input} value={draft.security.preOnboarding.bypassRoleIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, bypassRoleIds: selectedValues(e) } } }))}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>failMessageTemplate</label>
              <textarea style={textarea} value={draft.security.preOnboarding.failMessageTemplate} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, preOnboarding: { ...p.security.preOnboarding, failMessageTemplate: e.target.value } } }))} />
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Verification</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={pill(draft.security.verification.enabled)}>{draft.security.verification.enabled ? "ON" : "OFF"}</span>
                <button onClick={() => saveSection("verification")} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#130000", color: "#ffd0d0" }}>
                  Save Section{sectionDirty("verification") ? " *" : ""}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={draft.security.verification.enabled} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, enabled: e.target.checked } } }))} /> enabled</label>
              <label><input type="checkbox" checked={draft.security.verification.autoKickOnTimeout} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, autoKickOnTimeout: e.target.checked } } }))} /> autoKickOnTimeout</label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label style={label}>idTimeoutMinutes</label>
                <input style={input} type="number" value={draft.security.verification.idTimeoutMinutes} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, idTimeoutMinutes: Number(e.target.value || 0) } } }))} />
              </div>
              <div>
                <label style={label}>declineAction</label>
                <select style={input} value={draft.security.verification.declineAction} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, declineAction: e.target.value as DeclineAction } } }))}>
                  <option value="kick">kick</option>
                  <option value="role">role</option>
                  <option value="timeout">timeout</option>
                </select>
              </div>
              <div>
                <label style={label}>roleOnVerifyId</label>
                <select style={input} value={draft.security.verification.roleOnVerifyId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, roleOnVerifyId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label style={label}>ticketCategoryId</label>
                <select style={input} value={draft.security.verification.ticketCategoryId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, ticketCategoryId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {channels.filter((c) => c.type === 4).map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>ticketChannelId</label>
                <select style={input} value={draft.security.verification.ticketChannelId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, ticketChannelId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>removeRoleIdsOnVerify</label>
              <select multiple size={6} style={input} value={draft.security.verification.removeRoleIdsOnVerify} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, removeRoleIdsOnVerify: selectedValues(e) } } }))}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>approverRoleIds</label>
              <select multiple size={6} style={input} value={draft.security.verification.approverRoleIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, verification: { ...p.security.verification, approverRoleIds: selectedValues(e) } } }))}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Onboarding</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={pill(draft.security.onboarding.enabled)}>{draft.security.onboarding.enabled ? "ON" : "OFF"}</span>
                <button onClick={() => saveSection("onboarding")} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#130000", color: "#ffd0d0" }}>
                  Save Section{sectionDirty("onboarding") ? " *" : ""}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={draft.security.onboarding.enabled} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, enabled: e.target.checked } } }))} /> enabled</label>
              <label><input type="checkbox" checked={draft.security.onboarding.sendWelcomeDm} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, sendWelcomeDm: e.target.checked } } }))} /> sendWelcomeDm</label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label style={label}>welcomeChannelId</label>
                <select style={input} value={draft.security.onboarding.welcomeChannelId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, welcomeChannelId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                </select>
              </div>
              <div>
                <label style={label}>rulesChannelId</label>
                <select style={input} value={draft.security.onboarding.rulesChannelId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, rulesChannelId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>welcomeMessageTemplate</label>
              <textarea style={textarea} value={draft.security.onboarding.welcomeMessageTemplate} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, welcomeMessageTemplate: e.target.value } } }))} />
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>panelBodyTemplate</label>
              <textarea style={textarea} value={draft.security.onboarding.panelBodyTemplate} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, panelBodyTemplate: e.target.value } } }))} />
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>dmTemplate</label>
              <textarea style={textarea} value={draft.security.onboarding.dmTemplate} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, onboarding: { ...p.security.onboarding, dmTemplate: e.target.value } } }))} />
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Lockdown</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={pill(draft.security.lockdown.enabled)}>{draft.security.lockdown.enabled ? "ON" : "OFF"}</span>
                <button onClick={() => saveSection("lockdown")} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#130000", color: "#ffd0d0" }}>
                  Save Section{sectionDirty("lockdown") ? " *" : ""}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={draft.security.lockdown.enabled} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, enabled: e.target.checked } } }))} /> enabled</label>
              <div><label style={label}>mentionThreshold</label><input style={input} type="number" value={draft.security.lockdown.mentionThreshold} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, mentionThreshold: Number(e.target.value || 0) } } }))} /></div>
              <div><label style={label}>linkThreshold</label><input style={input} type="number" value={draft.security.lockdown.linkThreshold} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, linkThreshold: Number(e.target.value || 0) } } }))} /></div>
              <div><label style={label}>actionPreset</label><select style={input} value={draft.security.lockdown.actionPreset} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, actionPreset: e.target.value as LockPreset } } }))}><option value="strict">strict</option><option value="balanced">balanced</option><option value="contain">contain</option><option value="off">off</option></select></div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>exemptRoleIds</label>
              <select multiple size={6} style={input} value={draft.security.lockdown.exemptRoleIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, exemptRoleIds: selectedValues(e) } } }))}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>exemptChannelIds</label>
              <select multiple size={6} style={input} value={draft.security.lockdown.exemptChannelIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, lockdown: { ...p.security.lockdown, exemptChannelIds: selectedValues(e) } } }))}>
                {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
              </select>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Raid</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={pill(draft.security.raid.enabled)}>{draft.security.raid.enabled ? "ON" : "OFF"}</span>
                <button onClick={() => saveSection("raid")} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#130000", color: "#ffd0d0" }}>
                  Save Section{sectionDirty("raid") ? " *" : ""}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={draft.security.raid.enabled} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, enabled: e.target.checked } } }))} /> enabled</label>
              <label><input type="checkbox" checked={draft.security.raid.autoEscalate} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, autoEscalate: e.target.checked } } }))} /> autoEscalate</label>
              <div><label style={label}>joinBurstThreshold</label><input style={input} type="number" value={draft.security.raid.joinBurstThreshold} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, joinBurstThreshold: Number(e.target.value || 0) } } }))} /></div>
              <div><label style={label}>windowSeconds</label><input style={input} type="number" value={draft.security.raid.windowSeconds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, windowSeconds: Number(e.target.value || 0) } } }))} /></div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>actionPreset</label>
              <select style={input} value={draft.security.raid.actionPreset} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, actionPreset: e.target.value as LockPreset } } }))}>
                <option value="strict">strict</option>
                <option value="balanced">balanced</option>
                <option value="contain">contain</option>
                <option value="off">off</option>
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>exemptRoleIds</label>
              <select multiple size={6} style={input} value={draft.security.raid.exemptRoleIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, exemptRoleIds: selectedValues(e) } } }))}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>exemptChannelIds</label>
              <select multiple size={6} style={input} value={draft.security.raid.exemptChannelIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, raid: { ...p.security.raid, exemptChannelIds: selectedValues(e) } } }))}>
                {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
              </select>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ margin: 0, color: "#ff5f5f", letterSpacing: "0.08em", textTransform: "uppercase" }}>Moderation / Logs / Immunity</h3>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={pill(draft.security.moderation.enabled)}>{draft.security.moderation.enabled ? "ON" : "OFF"}</span>
                <button onClick={() => saveSection("moderation")} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #7a0000", background: "#130000", color: "#ffd0d0" }}>
                  Save Section{sectionDirty("moderation") ? " *" : ""}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={draft.security.moderation.enabled} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, enabled: e.target.checked } } }))} /> enabled</label>
              <div>
                <label style={label}>logChannelId</label>
                <select style={input} value={draft.security.moderation.logChannelId} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, logChannelId: e.target.value } } }))}>
                  <option value="">(none)</option>
                  {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>Immunity Roles</label>
              <select multiple size={6} style={input} value={draft.security.moderation.immunityRoleIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, immunityRoleIds: selectedValues(e) } } }))}>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>Restricted Channels</label>
              <select multiple size={6} style={input} value={draft.security.moderation.restrictedChannelIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, restrictedChannelIds: selectedValues(e) } } }))}>
                {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>Ignored Channels</label>
              <select multiple size={6} style={input} value={draft.security.moderation.ignoredChannelIds} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, ignoredChannelIds: selectedValues(e) } } }))}>
                {textAndCategoryChannels.map((c) => <option key={c.id} value={c.id}>{channelLabel(c)}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
              <label><input type="checkbox" checked={draft.security.moderation.blockCommands} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, blockCommands: e.target.checked } } }))} /> blockCommands</label>
              <label><input type="checkbox" checked={draft.security.moderation.blockImages} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, blockImages: e.target.checked } } }))} /> blockImages</label>
              <label><input type="checkbox" checked={draft.security.moderation.blockLinks} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, blockLinks: e.target.checked } } }))} /> blockLinks</label>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={label}>Audit Event Toggles</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(140px,1fr))", gap: 8 }}>
                {Object.keys(draft.security.moderation.events).map((k) => (
                  <label key={k} style={{ fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={(draft.security.moderation.events as Record<string, boolean>)[k]}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          security: {
                            ...p.security,
                            moderation: {
                              ...p.security.moderation,
                              events: {
                                ...p.security.moderation.events,
                                [k]: e.target.checked,
                              },
                            },
                          },
                        }))
                      }
                    />{" "}
                    {k}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 12, borderTop: "1px solid #4a0000", paddingTop: 10 }}>
              <div style={{ color: "#ff9a9a", marginBottom: 8, fontWeight: 700 }}>AutoMod Rules</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={label}>preset</label>
                  <select style={input} value={draft.security.moderation.automod.preset} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, automod: { ...p.security.moderation.automod, preset: e.target.value as AutoModPreset } } } }))}>
                    <option value="off">off</option>
                    <option value="warn">warn</option>
                    <option value="timeout">timeout</option>
                    <option value="kick">kick</option>
                  </select>
                </div>
                <div>
                  <label style={label}>repeatThreshold</label>
                  <input style={input} type="number" value={draft.security.moderation.automod.repeatThreshold} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, automod: { ...p.security.moderation.automod, repeatThreshold: Number(e.target.value || 0) } } } }))} />
                </div>
                <div>
                  <label style={label}>mentionThreshold</label>
                  <input style={input} type="number" value={draft.security.moderation.automod.mentionThreshold} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, automod: { ...p.security.moderation.automod, mentionThreshold: Number(e.target.value || 0) } } } }))} />
                </div>
                <div>
                  <label style={label}>linkThreshold</label>
                  <input style={input} type="number" value={draft.security.moderation.automod.linkThreshold} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, automod: { ...p.security.moderation.automod, linkThreshold: Number(e.target.value || 0) } } } }))} />
                </div>
                <div>
                  <label style={label}>timeoutMinutes</label>
                  <input style={input} type="number" value={draft.security.moderation.automod.timeoutMinutes} onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, moderation: { ...p.security.moderation, automod: { ...p.security.moderation.automod, timeoutMinutes: Number(e.target.value || 0) } } } }))} />
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
