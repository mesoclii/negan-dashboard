"use client";

import { useEffect, useState } from "react";
import {
  FieldGrid,
  PageShell,
  SaveBar,
  SectionCard,
  TextAreaRow,
  TextRow,
  ToggleRow
} from "@/components/dashboard/StudioForm";

type Features = { verificationEnabled: boolean };

type VerifyCfg = {
  autoKickOnDecline: boolean;
  autoKickOnTimeout: boolean;
  declineKickReason: string;
  timeoutKickReason: string;
  declineReplyTemplate: string;
};

const DEFAULT_VERIFY: VerifyCfg = {
  autoKickOnDecline: true,
  autoKickOnTimeout: true,
  declineKickReason: "Declined ID verification",
  timeoutKickReason: "ID submission timeout",
  declineReplyTemplate: "You declined ID verification."
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const gid = (q || s).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function VerificationPage() {
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [features, setFeatures] = useState<Features>({ verificationEnabled: true });
  const [cfg, setCfg] = useState<VerifyCfg>(DEFAULT_VERIFY);

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

        const ft = j?.config?.features || {};
        const v = j?.config?.security?.verification || {};

        setFeatures({ verificationEnabled: Boolean(ft.verificationEnabled ?? true) });

        setCfg({
          autoKickOnDecline: Boolean(v.autoKickOnDecline ?? true),
          autoKickOnTimeout: Boolean(v.autoKickOnTimeout ?? true),
          declineKickReason: String(v.declineKickReason || DEFAULT_VERIFY.declineKickReason),
          timeoutKickReason: String(v.timeoutKickReason || DEFAULT_VERIFY.timeoutKickReason),
          declineReplyTemplate: String(v.declineReplyTemplate || DEFAULT_VERIFY.declineReplyTemplate)
        });
      } catch {
        setMsg("Failed to load verification config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

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
            security: { verification: cfg }
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
    <PageShell title="Verification Config" subtitle={`Guild: ${guildId}`}>
      <SectionCard title="Verification Engine Switch" description="If disabled, verification button/ticket actions stop.">
        <ToggleRow label="verificationEnabled" checked={features.verificationEnabled} onChange={(v) => setFeatures({ verificationEnabled: v })} />
      </SectionCard>

      <SectionCard title="Verification Outcomes">
        <ToggleRow label="autoKickOnDecline" checked={cfg.autoKickOnDecline} onChange={(v) => setCfg((p) => ({ ...p, autoKickOnDecline: v }))} />
        <ToggleRow label="autoKickOnTimeout" checked={cfg.autoKickOnTimeout} onChange={(v) => setCfg((p) => ({ ...p, autoKickOnTimeout: v }))} />
        <FieldGrid>
          <TextRow label="declineKickReason" value={cfg.declineKickReason} onChange={(v) => setCfg((p) => ({ ...p, declineKickReason: v }))} />
          <TextRow label="timeoutKickReason" value={cfg.timeoutKickReason} onChange={(v) => setCfg((p) => ({ ...p, timeoutKickReason: v }))} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Decline Reply Template">
        <TextAreaRow label="declineReplyTemplate" value={cfg.declineReplyTemplate} onChange={(v) => setCfg((p) => ({ ...p, declineReplyTemplate: v }))} rows={5} />
      </SectionCard>

      <SaveBar saving={saving} onSave={save} message={msg} />
    </PageShell>
  );
}
