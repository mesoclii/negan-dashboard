"use client";

import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type GuildChannel = { id: string; name: string; type?: number | string };
type GuildRole = { id: string; name: string };

type OnboardingConfig = {
  enabled: boolean;
  welcomeChannelId: string;
  mainChatChannelId: string;
  rulesChannelId: string;
  idChannelId: string;
  ticketCategoryId: string;
  transcriptChannelId: string;
  logChannelId: string;
  verifiedRoleId: string;
  declineRoleId: string;
  staffRoleIds: string[];
  removeOnVerifyRoleIds: string[];
  idTimeoutMinutes: number;
  hostingLegacyChannelId: string;
  hostingEnhancedChannelId: string;
  staffIntroChannelId: string;
  selfRolesChannelId: string;
  botGuideChannelId: string;
  updatesChannelId: string;
  funChannelId: string;
  subscriptionChannelId: string;
  dmTemplate: string;
  panelTitle: string;
  panelDescription: string;
  panelFooter: string;
  gateAnnouncementTemplate: string;
  idPanelTitle: string;
  idPanelDescription: string;
  idPanelContent: string;
  postVerifyTemplate: string;
};

const DEFAULTS: OnboardingConfig = {
  enabled: true,
  welcomeChannelId: "",
  mainChatChannelId: "",
  rulesChannelId: "",
  idChannelId: "",
  ticketCategoryId: "",
  transcriptChannelId: "",
  logChannelId: "",
  verifiedRoleId: "",
  declineRoleId: "",
  staffRoleIds: [],
  removeOnVerifyRoleIds: [],
  idTimeoutMinutes: 30,
  hostingLegacyChannelId: "",
  hostingEnhancedChannelId: "",
  staffIntroChannelId: "",
  selfRolesChannelId: "",
  botGuideChannelId: "",
  updatesChannelId: "",
  funChannelId: "",
  subscriptionChannelId: "",
  dmTemplate: "Welcome to {{guildName}}.\n\nStart onboarding in <#{{welcomeChannelId}}>.",
  panelTitle: "Welcome to {{guildName}}",
  panelDescription: "Read the rules in <#{{rulesChannelId}}> and confirm below to continue.",
  panelFooter: "Complete onboarding to unlock the server.",
  gateAnnouncementTemplate: "Survivor <@{{userId}}> has reached the gates.",
  idPanelTitle: "ID Verification - Final Gate",
  idPanelDescription: "<@{{userId}}> choose how you proceed.\n\nThose who refuse will be removed.",
  idPanelContent: "Survivor <@{{userId}}>",
  postVerifyTemplate: "<@{{userId}}> is now verified. Welcome to {{guildName}}.",
};

const styles = {
  page: { color: "#ffb3b3", padding: 14, maxWidth: 1320 },
  card: {
    border: "1px solid #5f0000",
    borderRadius: 12,
    padding: 14,
    background: "rgba(120,0,0,0.10)",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #6f0000",
    background: "#0a0a0a",
    color: "#ffd7d7",
  },
  area: {
    width: "100%",
    minHeight: 92,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #6f0000",
    background: "#0a0a0a",
    color: "#ffd7d7",
  },
};

function toggleRole(list: string[], id: string) {
  const set = new Set(list || []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return Array.from(set);
}

export default function OnboardingPage() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    channels,
    roles,
    summary,
    details,
    loading,
    saving,
    message,
    save,
  } = useGuildEngineEditor<OnboardingConfig>("onboarding", DEFAULTS);

  const textChannels = (channels as GuildChannel[]).filter(
    (channel) => Number(channel?.type) === 0 || Number(channel?.type) === 5 || String(channel?.type || "").toLowerCase().includes("text")
  );
  const categoryChannels = (channels as GuildChannel[]).filter(
    (channel) => Number(channel?.type) === 4 || String(channel?.type || "").toLowerCase().includes("category")
  );

  const channelFields: Array<{ key: keyof Pick<
    OnboardingConfig,
    | "welcomeChannelId"
    | "mainChatChannelId"
    | "rulesChannelId"
    | "idChannelId"
    | "transcriptChannelId"
    | "logChannelId"
    | "hostingLegacyChannelId"
    | "hostingEnhancedChannelId"
    | "staffIntroChannelId"
    | "selfRolesChannelId"
    | "botGuideChannelId"
    | "updatesChannelId"
    | "funChannelId"
    | "subscriptionChannelId"
  >; label: string }> = [
    { key: "welcomeChannelId", label: "Welcome Channel" },
    { key: "mainChatChannelId", label: "Main Chat Channel" },
    { key: "rulesChannelId", label: "Rules Channel" },
    { key: "idChannelId", label: "ID Verification Channel" },
    { key: "transcriptChannelId", label: "Transcript Channel" },
    { key: "logChannelId", label: "Log Channel" },
    { key: "hostingLegacyChannelId", label: "Hosting Legacy Channel" },
    { key: "hostingEnhancedChannelId", label: "Hosting Enhanced Channel" },
    { key: "staffIntroChannelId", label: "Staff Intro Channel" },
    { key: "selfRolesChannelId", label: "Self Roles Channel" },
    { key: "botGuideChannelId", label: "Bot Guide Channel" },
    { key: "updatesChannelId", label: "Updates Channel" },
    { key: "funChannelId", label: "Fun Channel" },
    { key: "subscriptionChannelId", label: "Subscription Channel" },
  ];

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading onboarding...</div>;

  return (
    <div style={styles.page}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Onboarding
      </h1>
      <p style={{ marginTop: 0 }}>Guild: {guildName || guildId}</p>
      {message ? <div style={{ color: "#ffd27a", marginBottom: 8 }}>{message}</div> : null}

      <EngineInsights summary={summary} details={details} />

      <div style={styles.card}>
        <label><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine enabled</label>
        <div style={{ marginTop: 10, maxWidth: 320 }}>
          <label>ID timeout minutes</label>
          <input style={styles.input} type="number" value={cfg.idTimeoutMinutes || 0} onChange={(e) => setCfg({ ...cfg, idTimeoutMinutes: Number(e.target.value || 0) })} />
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Channel and Role IDs</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {channelFields.map((field) => (
            <div key={field.key}>
              <label>{field.label}</label>
              <select
                style={styles.input}
                value={cfg[field.key] ?? ""}
                onChange={(e) => setCfg({ ...cfg, [field.key]: e.target.value })}
              >
                <option value="">Select channel</option>
                {textChannels.map((channel) => (
                  <option key={channel.id} value={channel.id}>
                    #{channel.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div>
            <label>Ticket Category</label>
            <select style={styles.input} value={cfg.ticketCategoryId || ""} onChange={(e) => setCfg({ ...cfg, ticketCategoryId: e.target.value })}>
              <option value="">Select category</option>
              {categoryChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Verified Role</label>
            <select style={styles.input} value={cfg.verifiedRoleId || ""} onChange={(e) => setCfg({ ...cfg, verifiedRoleId: e.target.value })}>
              <option value="">Select role</option>
              {(roles as GuildRole[]).map((role) => (
                <option key={role.id} value={role.id}>
                  @{role.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Decline Role</label>
            <select style={styles.input} value={cfg.declineRoleId || ""} onChange={(e) => setCfg({ ...cfg, declineRoleId: e.target.value })}>
              <option value="">Select role</option>
              {(roles as GuildRole[]).map((role) => (
                <option key={role.id} value={role.id}>
                  @{role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Staff Roles (can operate onboarding)</label>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #5a0000", borderRadius: 8, padding: 8 }}>
              {(roles as GuildRole[]).map((role) => (
                <label key={`staff_${role.id}`} style={{ display: "block", marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={(cfg.staffRoleIds || []).includes(role.id)}
                    onChange={() => setCfg({ ...cfg, staffRoleIds: toggleRole(cfg.staffRoleIds || [], role.id) })}
                  />{" "}
                  @{role.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label>Remove On Verify Roles</label>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #5a0000", borderRadius: 8, padding: 8 }}>
              {(roles as GuildRole[]).map((role) => (
                <label key={`remove_${role.id}`} style={{ display: "block", marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={(cfg.removeOnVerifyRoleIds || []).includes(role.id)}
                    onChange={() => setCfg({ ...cfg, removeOnVerifyRoleIds: toggleRole(cfg.removeOnVerifyRoleIds || [], role.id) })}
                  />{" "}
                  @{role.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Templates</h3>
        {[
          "dmTemplate",
          "panelTitle",
          "panelDescription",
          "panelFooter",
          "gateAnnouncementTemplate",
          "idPanelTitle",
          "idPanelDescription",
          "idPanelContent",
          "postVerifyTemplate",
        ].map((key) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <label>{key}</label>
            {key.toLowerCase().includes("title") ? (
              <input style={styles.input} value={(cfg as any)[key] || ""} onChange={(e) => setCfg({ ...cfg, [key]: e.target.value } as OnboardingConfig)} />
            ) : (
              <textarea style={styles.area} value={(cfg as any)[key] || ""} onChange={(e) => setCfg({ ...cfg, [key]: e.target.value } as OnboardingConfig)} />
            )}
          </div>
        ))}
      </div>

      <ConfigJsonEditor
        title="Advanced Onboarding Config"
        value={cfg}
        disabled={saving}
        onApply={(next) => setCfg({ ...DEFAULTS, ...(next as OnboardingConfig) })}
      />

      <button onClick={() => void save()} disabled={saving} style={{ ...styles.input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
        {saving ? "Saving..." : "Save Onboarding"}
      </button>
    </div>
  );
}
