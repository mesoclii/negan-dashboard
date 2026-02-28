"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FieldGrid,
  MultiSelectRow,
  NumberRow,
  PageShell,
  SaveBar,
  SectionCard,
  SelectRow,
  TextAreaRow,
  TextRow,
  ToggleRow,
  type SelectOption
} from "@/components/dashboard/StudioForm";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type: number };

type Features = {
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
};

type OnCfg = {
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

const DEFAULT_ON: OnCfg = {
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
  dmTemplate: "",
  panelTitle: "",
  panelDescription: "",
  panelFooter: "",
  gateAnnouncementTemplate: "",
  idPanelTitle: "",
  idPanelDescription: "",
  idPanelContent: "",
  postVerifyTemplate: ""
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const gid = (q || s).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function OnboardingPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [features, setFeatures] = useState<Features>({ onboardingEnabled: true, verificationEnabled: true });
  const [cfg, setCfg] = useState<OnCfg>(DEFAULT_ON);

  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

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

        const [confRes, guildRes] = await Promise.all([
          fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const conf = await confRes.json();
        const gd = await guildRes.json();

        const on = conf?.config?.security?.onboarding || {};
        const ft = conf?.config?.features || {};

        setFeatures({
          onboardingEnabled: Boolean(ft.onboardingEnabled ?? true),
          verificationEnabled: Boolean(ft.verificationEnabled ?? true)
        });

        setCfg({
          welcomeChannelId: String(on.welcomeChannelId || ""),
          mainChatChannelId: String(on.mainChatChannelId || ""),
          rulesChannelId: String(on.rulesChannelId || ""),
          idChannelId: String(on.idChannelId || ""),
          ticketCategoryId: String(on.ticketCategoryId || ""),
          transcriptChannelId: String(on.transcriptChannelId || ""),
          logChannelId: String(on.logChannelId || ""),
          verifiedRoleId: String(on.verifiedRoleId || ""),
          declineRoleId: String(on.declineRoleId || ""),
          staffRoleIds: Array.isArray(on.staffRoleIds) ? on.staffRoleIds : [],
          removeOnVerifyRoleIds: Array.isArray(on.removeOnVerifyRoleIds) ? on.removeOnVerifyRoleIds : [],
          idTimeoutMinutes: Number(on.idTimeoutMinutes || 30),
          dmTemplate: String(on.dmTemplate || ""),
          panelTitle: String(on.panelTitle || ""),
          panelDescription: String(on.panelDescription || ""),
          panelFooter: String(on.panelFooter || ""),
          gateAnnouncementTemplate: String(on.gateAnnouncementTemplate || ""),
          idPanelTitle: String(on.idPanelTitle || ""),
          idPanelDescription: String(on.idPanelDescription || ""),
          idPanelContent: String(on.idPanelContent || ""),
          postVerifyTemplate: String(on.postVerifyTemplate || "")
        });

        setRoles(Array.isArray(gd?.roles) ? gd.roles : []);
        setChannels(Array.isArray(gd?.channels) ? gd.channels : []);
      } catch {
        setMsg("Failed to load onboarding config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const roleOptions: SelectOption[] = useMemo(
    () =>
      [...roles]
        .sort((a, b) => Number(b.position || 0) - Number(a.position || 0))
        .map((r) => ({ value: r.id, label: `${r.name} (${r.id})` })),
    [roles]
  );

  const textChannelOptions: SelectOption[] = useMemo(
    () =>
      channels
        .filter((c) => Number(c.type) === 0 || Number(c.type) === 5)
        .map((c) => ({ value: c.id, label: `#${c.name} (${c.id})` })),
    [channels]
  );

  const categoryOptions: SelectOption[] = useMemo(
    () =>
      channels
        .filter((c) => Number(c.type) === 4)
        .map((c) => ({ value: c.id, label: `${c.name} (${c.id})` })),
    [channels]
  );

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
            features,
            security: { onboarding: cfg }
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

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  if (loading) return <div style={{ color: "#ff5252", padding: 24 }}>Loading...</div>;

  return (
    <PageShell title="Onboarding Config" subtitle={`Guild: ${guildId}`}>
      <SectionCard title="Join Flow Master Switches" description="Keep both enabled for full gate + verification + onboarding chain.">
        <ToggleRow label="onboardingEnabled" checked={features.onboardingEnabled} onChange={(v) => setFeatures((p) => ({ ...p, onboardingEnabled: v }))} />
        <ToggleRow label="verificationEnabled" checked={features.verificationEnabled} onChange={(v) => setFeatures((p) => ({ ...p, verificationEnabled: v }))} />
      </SectionCard>

      <SectionCard title="Core Channels + Roles">
        <FieldGrid>
          <SelectRow label="welcomeChannelId" value={cfg.welcomeChannelId} onChange={(v) => setCfg((p) => ({ ...p, welcomeChannelId: v }))} options={textChannelOptions} />
          <SelectRow label="mainChatChannelId" value={cfg.mainChatChannelId} onChange={(v) => setCfg((p) => ({ ...p, mainChatChannelId: v }))} options={textChannelOptions} />
          <SelectRow label="rulesChannelId" value={cfg.rulesChannelId} onChange={(v) => setCfg((p) => ({ ...p, rulesChannelId: v }))} options={textChannelOptions} />
          <SelectRow label="idChannelId" value={cfg.idChannelId} onChange={(v) => setCfg((p) => ({ ...p, idChannelId: v }))} options={textChannelOptions} />
          <SelectRow label="ticketCategoryId" value={cfg.ticketCategoryId} onChange={(v) => setCfg((p) => ({ ...p, ticketCategoryId: v }))} options={categoryOptions} />
          <SelectRow label="transcriptChannelId" value={cfg.transcriptChannelId} onChange={(v) => setCfg((p) => ({ ...p, transcriptChannelId: v }))} options={textChannelOptions} />
          <SelectRow label="logChannelId" value={cfg.logChannelId} onChange={(v) => setCfg((p) => ({ ...p, logChannelId: v }))} options={textChannelOptions} />
          <SelectRow label="verifiedRoleId" value={cfg.verifiedRoleId} onChange={(v) => setCfg((p) => ({ ...p, verifiedRoleId: v }))} options={roleOptions} />
          <SelectRow label="declineRoleId" value={cfg.declineRoleId} onChange={(v) => setCfg((p) => ({ ...p, declineRoleId: v }))} options={roleOptions} />
          <NumberRow label="idTimeoutMinutes" value={cfg.idTimeoutMinutes} onChange={(v) => setCfg((p) => ({ ...p, idTimeoutMinutes: v }))} min={1} max={720} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Staff Access + Role Transitions">
        <FieldGrid>
          <MultiSelectRow label="staffRoleIds" values={cfg.staffRoleIds} onChange={(v) => setCfg((p) => ({ ...p, staffRoleIds: v }))} options={roleOptions} size={8} />
          <MultiSelectRow label="removeOnVerifyRoleIds" values={cfg.removeOnVerifyRoleIds} onChange={(v) => setCfg((p) => ({ ...p, removeOnVerifyRoleIds: v }))} options={roleOptions} size={8} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Message + Panel Templates">
        <TextAreaRow label="dmTemplate" value={cfg.dmTemplate} onChange={(v) => setCfg((p) => ({ ...p, dmTemplate: v }))} rows={4} />
        <FieldGrid>
          <TextRow label="panelTitle" value={cfg.panelTitle} onChange={(v) => setCfg((p) => ({ ...p, panelTitle: v }))} />
          <TextRow label="panelFooter" value={cfg.panelFooter} onChange={(v) => setCfg((p) => ({ ...p, panelFooter: v }))} />
        </FieldGrid>
        <div style={{ marginTop: 10 }}>
          <TextAreaRow label="panelDescription" value={cfg.panelDescription} onChange={(v) => setCfg((p) => ({ ...p, panelDescription: v }))} rows={4} />
        </div>
        <div style={{ marginTop: 10 }}>
          <TextAreaRow label="gateAnnouncementTemplate" value={cfg.gateAnnouncementTemplate} onChange={(v) => setCfg((p) => ({ ...p, gateAnnouncementTemplate: v }))} rows={3} />
        </div>
        <FieldGrid>
          <TextRow label="idPanelTitle" value={cfg.idPanelTitle} onChange={(v) => setCfg((p) => ({ ...p, idPanelTitle: v }))} />
          <TextAreaRow label="idPanelDescription" value={cfg.idPanelDescription} onChange={(v) => setCfg((p) => ({ ...p, idPanelDescription: v }))} rows={4} />
        </FieldGrid>
        <div style={{ marginTop: 10 }}>
          <TextAreaRow label="idPanelContent" value={cfg.idPanelContent} onChange={(v) => setCfg((p) => ({ ...p, idPanelContent: v }))} rows={4} />
        </div>
        <div style={{ marginTop: 10 }}>
          <TextAreaRow label="postVerifyTemplate" value={cfg.postVerifyTemplate} onChange={(v) => setCfg((p) => ({ ...p, postVerifyTemplate: v }))} rows={4} />
        </div>
      </SectionCard>

      <SaveBar saving={saving} onSave={save} message={msg} />
    </PageShell>
  );
}
