"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { buildDashboardHref, readDashboardGuildId } from "@/lib/dashboardContext";
import { buildPublicInviteUrl } from "@/lib/publicLinks";
import { PRICING_FOOTNOTE, PREMIUM_FEATURES, PREMIUM_PLANS } from "@/lib/premiumCatalog";

type SubscriptionStatus = {
  active: boolean;
  plan: string;
  premiumTier: string | null;
  source: string;
  developerBypass?: boolean;
};

const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.36)",
  borderRadius: 16,
  padding: 18,
  background: "linear-gradient(180deg, rgba(100,0,0,.12), rgba(0,0,0,.70))",
};

const action: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 900,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  textDecoration: "none",
};

export default function PremiumFeaturesClient() {
  const guildId = readDashboardGuildId();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [canManagePremium, setCanManagePremium] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadStatus() {
    if (!guildId) return;
    const res = await fetch(`/api/subscriptions/status?guildId=${encodeURIComponent(guildId)}`, {
      cache: "no-store",
    }).catch(() => null);
    const json = await res?.json().catch(() => ({}));
    if (!res || !res.ok || json?.success === false) {
      setStatusMsg(json?.error || "Failed to load premium status.");
      return;
    }
    setStatus(json?.status || null);
    setCanManagePremium(Boolean(json?.canManagePremium));
    setStatusMsg("");
  }

  useEffect(() => {
    void loadStatus();
  }, [guildId]);

  async function savePlan(active: boolean, plan: string) {
    if (!guildId) return;
    setSaving(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/subscriptions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          active,
          plan,
          premiumTier: active ? plan : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || "Failed to update premium plan.");
      }
      setStatus(json?.status || null);
      setCanManagePremium(Boolean(json?.canManagePremium));
      setStatusMsg(active ? `${plan} enabled for this guild.` : "Premium disabled for this guild.");
    } catch (error: any) {
      setStatusMsg(error?.message || "Failed to update premium plan.");
    } finally {
      setSaving(false);
    }
  }

  const stateLabel = status?.developerBypass
    ? "Developer Access"
    : status?.active
      ? `${status.plan} Active`
      : "Premium Off";

  return (
    <div style={{ color: "#ffd0d0", maxWidth: 1380 }}>
      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(320px,0.8fr)", gap: 18 }}>
          <div>
            <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Paid Guild Features
            </div>
            <h1
              style={{
                marginTop: 10,
                marginBottom: 8,
                color: "#ff4a4a",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                fontSize: "clamp(2rem, 4vw, 3.6rem)",
              }}
            >
              Premium Features
            </h1>
            <p style={{ color: "#ffb5b5", lineHeight: 1.7, maxWidth: 860 }}>
              This page only lists paid guild add-ons, plan pricing, and master-owner trial controls. Standard features
              stay out of this surface, and Pokemon remains private-only.
            </p>
          </div>

          <div style={{ ...card, margin: 0 }}>
            <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Current Guild
            </div>
            <div style={{ color: "#fff0f0", fontSize: 28, fontWeight: 900, marginTop: 8 }}>{guildId || "No guild selected"}</div>
            <div style={{ color: "#ffd7d7", fontSize: 14, marginTop: 10 }}>
              {stateLabel}
              {status?.premiumTier ? ` | ${status.premiumTier}` : ""}
            </div>
            {statusMsg ? <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 8 }}>{statusMsg}</div> : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <a
                href={buildPublicInviteUrl()}
                target="_blank"
                rel="noreferrer"
                style={{ ...action, color: "#160000", background: "linear-gradient(90deg, #ff4141, #ff8c40)" }}
              >
                Invite Bot
              </a>
              <Link
                href="/features"
                style={{
                  ...action,
                  color: "#ffd7d7",
                  border: "1px solid rgba(255,0,0,.45)",
                  background: "#130707",
                }}
              >
                Features Page
              </Link>
            </div>
          </div>
        </div>
      </section>

      {canManagePremium ? (
        <section style={{ ...card, marginBottom: 16 }}>
          <div
            style={{
              color: "#ff9a9a",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Master Owner Trial Controls
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePlan(true, "PRO")}
              style={{
                ...action,
                cursor: saving ? "wait" : "pointer",
                color: "#ffd7d7",
                border: "1px solid rgba(255,0,0,.45)",
                background: "#130707",
              }}
            >
              Grant Pro
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePlan(true, "BUSINESS")}
              style={{
                ...action,
                cursor: saving ? "wait" : "pointer",
                color: "#ffd7d7",
                border: "1px solid rgba(255,0,0,.45)",
                background: "#130707",
              }}
            >
              Grant Business
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePlan(true, "ENTERPRISE")}
              style={{
                ...action,
                cursor: saving ? "wait" : "pointer",
                color: "#ffd7d7",
                border: "1px solid rgba(255,0,0,.45)",
                background: "#130707",
              }}
            >
              Grant Enterprise
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void savePlan(false, "FREE")}
              style={{
                ...action,
                cursor: saving ? "wait" : "pointer",
                color: "#ffd7d7",
                border: "1px solid rgba(255,160,0,.45)",
                background: "rgba(70,35,0,0.46)",
              }}
            >
              Set Free
            </button>
          </div>
        </section>
      ) : null}

      <section style={{ ...card, marginBottom: 16 }}>
        <div
          style={{
            color: "#ffd39a",
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Premium Add-Ons
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {PREMIUM_FEATURES.map((feature) => (
            <div key={feature.id} style={{ ...card, margin: 0 }}>
              <div style={{ color: "#ffd49a", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {feature.premiumLabel}
              </div>
              <div
                style={{
                  color: "#ff5a5a",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontSize: 22,
                  marginTop: 10,
                }}
              >
                {feature.label}
              </div>
              <div style={{ color: "#ffd0d0", lineHeight: 1.65, marginTop: 10 }}>{feature.summary}</div>
              <div style={{ color: "#ffb7b7", fontSize: 12, marginTop: 10 }}>Included in: {feature.includedIn.join(", ")}</div>
              <div style={{ color: "#ffb7b7", fontSize: 12, marginTop: 8 }}>{feature.pricingNote}</div>
              <Link
                href={buildDashboardHref(feature.route)}
                style={{
                  display: "inline-block",
                  textDecoration: "none",
                  marginTop: 14,
                  borderRadius: 12,
                  border: "1px solid rgba(255,0,0,.45)",
                  padding: "10px 14px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#ffd7d7",
                  background: "#130707",
                }}
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={card}>
        <div
          style={{
            color: "#ff9a9a",
            fontSize: 12,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Plan Pricing
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
          {PREMIUM_PLANS.map((plan) => (
            <div key={plan.id} style={{ ...card, margin: 0 }}>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 20 }}>
                {plan.label}
              </div>
              <div style={{ color: "#fff1c7", fontSize: 30, fontWeight: 900, marginTop: 10 }}>
                {plan.monthlyUsd === null ? "Custom" : `$${plan.monthlyUsd.toFixed(2)}`}
                <span style={{ color: "#ffb8b8", fontSize: 13, marginLeft: 8 }}>/ month</span>
              </div>
              <div style={{ color: "#ffd0d0", lineHeight: 1.7, marginTop: 10 }}>{plan.headline}</div>
              <div style={{ color: "#ffbdbd", fontSize: 13, lineHeight: 1.65, marginTop: 10 }}>
                {plan.included.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ color: "#ffb8b8", fontSize: 12, marginTop: 14 }}>{PRICING_FOOTNOTE}</div>
      </section>
    </div>
  );
}
