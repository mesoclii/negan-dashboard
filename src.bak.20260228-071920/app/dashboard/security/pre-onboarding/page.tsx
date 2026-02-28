"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FieldGrid,
  MultiSelectRow,
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

type Features = { onboardingEnabled: boolean; verificationEnabled: boolean };

type PreCfg = {
  autoBanOnBlacklistRejoin: boolean;
  autoBanOnRefusalRole: boolean;
  refusalRoleId: string;
  enforcementChannelId: string;
  contactUser: string;
  banDmTemplate: string;
};

const DEFAULT_PRE: PreCfg = {
  autoBanOnBlacklistRejoin: true,
  autoBanOnRefusalRole: true,
  refusalRoleId: "",
  enforcementChannelId: "",
  contactUser: "Support Team",
  banDmTemplate: ""
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const gid = (q || s).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function PreOnboardingPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [features, setFeatures] = useState<Features>({ onboardingEnabled: true, verificationEnabled: true });
  const [cfg, setCfg] = useState<PreCfg>(DEFAULT_PRE);

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

        const pre = conf?.config?.security?.preOnboarding || {};
        const ft = conf?.config?.features || {};

        setFeatures({
          onboardingEnabled: Boolean(ft.onboardingEnabled ?? true),
          verificationEnabled: Boolean(ft.verificationEnabled ?? true)
        });

        setCfg({
          autoBanOnBlacklistRejoin: Boolean(pre.autoBanOnBlacklistRejoin ?? true),
          autoBanOnRefusalRole: Boolean(pre.autoBanOnRefusalRole ?? true),
          refusalRoleId: String(pre.refusalRoleId || ""),
          enforcementChannelId: String(pre.enforcementChannelId || ""),
          contactUser: String(pre.contactUser || "Support Team"),
          banDmTemplate: String(pre.banDmTemplate || "")
        });

        setRoles(Array.isArray(gd?.roles) ? gd.roles : []);
        setChannels(Array.isArray(gd?.channels) ? gd.channels : []);
      } catch {
        setMsg("Failed to load pre-onboarding config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const roleOptions: SelectOption[] = useMemo(
    () => [...roles]
      .sort((a, b) => Number(b.position || 0) - Number(a.position || 0))
      .map((r) => ({ value: r.id, label: `${r.name} (${r.id})` })),
    [roles]
  );

  const channelOptions: SelectOption[] = useMemo(
    () => channels
      .filter((c) => Number(c.type) === 0 || Number(c.type) === 5)
      .map((c) => ({ value: c.id, label: `#${c.name} (${c.id})` })),
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
            security: { preOnboarding: cfg }
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
    <PageShell title="Pre-Onboarding Config" subtitle={`Guild: ${guildId}`}>
      <SectionCard title="Join Flow Master Switches" description="These must stay enabled for pre-onboarding logic to execute.">
        <ToggleRow label="onboardingEnabled" checked={features.onboardingEnabled} onChange={(v) => setFeatures((p) => ({ ...p, onboardingEnabled: v }))} />
        <ToggleRow label="verificationEnabled" checked={features.verificationEnabled} onChange={(v) => setFeatures((p) => ({ ...p, verificationEnabled: v }))} />
      </SectionCard>

      <SectionCard title="Pre-Onboarding Enforcement" description="Refusal role + enforcement channel handling before full onboarding.">
        <ToggleRow label="autoBanOnBlacklistRejoin" checked={cfg.autoBanOnBlacklistRejoin} onChange={(v) => setCfg((p) => ({ ...p, autoBanOnBlacklistRejoin: v }))} />
        <ToggleRow label="autoBanOnRefusalRole" checked={cfg.autoBanOnRefusalRole} onChange={(v) => setCfg((p) => ({ ...p, autoBanOnRefusalRole: v }))} />
        <FieldGrid>
          <SelectRow label="refusalRoleId" value={cfg.refusalRoleId} onChange={(v) => setCfg((p) => ({ ...p, refusalRoleId: v }))} options={roleOptions} />
          <SelectRow label="enforcementChannelId" value={cfg.enforcementChannelId} onChange={(v) => setCfg((p) => ({ ...p, enforcementChannelId: v }))} options={channelOptions} />
        </FieldGrid>
        <div style={{ marginTop: 10 }}>
          <TextRow label="contactUser" value={cfg.contactUser} onChange={(v) => setCfg((p) => ({ ...p, contactUser: v }))} />
        </div>
      </SectionCard>

      <SectionCard title="Ban DM Template" description="Optional DM template when enforcement action triggers.">
        <TextAreaRow
          label="banDmTemplate"
          value={cfg.banDmTemplate}
          onChange={(v) => setCfg((p) => ({ ...p, banDmTemplate: v }))}
          rows={6}
        />
      </SectionCard>

      <SaveBar saving={saving} onSave={save} message={msg} />
    </PageShell>
  );
}
