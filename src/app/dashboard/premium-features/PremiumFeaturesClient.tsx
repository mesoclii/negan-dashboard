"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { buildDashboardHref, readDashboardGuildId } from "@/lib/dashboardContext";
import { buildPublicInviteUrl } from "@/lib/publicLinks";
import {
  OPENAI_PLATFORM_PRICE_CHART,
  PREMIUM_FEATURES,
  PRIVATE_FEATURES,
  STANDARD_FEATURES,
} from "@/lib/premiumCatalog";

const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.36)",
  borderRadius: 16,
  padding: 18,
  background: "linear-gradient(180deg, rgba(100,0,0,.12), rgba(0,0,0,.70))",
};

export default function PremiumFeaturesClient() {
  const guildId = readDashboardGuildId();
  const [status, setStatus] = useState<{ active: boolean; plan: string; premiumTier: string | null; source: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      const res = await fetch(`/api/subscriptions/status?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }).catch(() => null);
      const json = await res?.json().catch(() => ({}));
      if (!res || !res.ok || json?.success === false) {
        setStatusMsg(json?.error || "Failed to load live premium status.");
        return;
      }
      setStatus(json?.status || null);
      setStatusMsg("");
    })();
  }, [guildId]);

  return (
    <div style={{ color: "#ffd0d0", maxWidth: 1380 }}>
      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(320px,0.8fr)", gap: 18 }}>
          <div>
            <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Public SaaS Catalog
            </div>
            <h1 style={{ marginTop: 10, marginBottom: 8, color: "#ff4a4a", letterSpacing: "0.10em", textTransform: "uppercase", fontSize: "clamp(2rem, 4vw, 3.6rem)" }}>
              Premium Features
            </h1>
            <p style={{ color: "#ffb5b5", lineHeight: 1.7, maxWidth: 860 }}>
              Premium is limited to the hosted add-ons only. The standard setup stack stays available by default, and
              Pokemon remains private-only instead of entering the public SaaS catalog.
            </p>
          </div>

          <div style={{ ...card, margin: 0 }}>
            <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Current Guild
            </div>
            <div style={{ color: "#fff0f0", fontSize: 28, fontWeight: 900, marginTop: 8 }}>{guildId || "No guild selected"}</div>
            <div style={{ color: "#ffd8a8", fontSize: 13, marginTop: 10 }}>
              Plan: {status ? `${status.active ? "ACTIVE" : "FREE"} | ${status.plan}` : "Loading..."}
              {status?.source ? ` | ${status.source}` : ""}
            </div>
            {statusMsg ? <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 8 }}>{statusMsg}</div> : null}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <a href={buildPublicInviteUrl()} target="_blank" rel="noreferrer" style={{ textDecoration: "none", borderRadius: 12, padding: "10px 14px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#160000", background: "linear-gradient(90deg, #ff4141, #ff8c40)" }}>
                Invite Bot
              </a>
              <Link href="/features" style={{ textDecoration: "none", borderRadius: 12, padding: "10px 14px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ffd7d7", border: "1px solid rgba(255,0,0,.45)", background: "#130707" }}>
                Public Features Page
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ color: "#ffd39a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
          Paid Add-Ons
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
          {PREMIUM_FEATURES.map((feature) => (
            <div key={feature.id} style={{ ...card, margin: 0 }}>
              <div style={{ color: "#ffd49a", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>{feature.premiumLabel}</div>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 22, marginTop: 10 }}>{feature.label}</div>
              <div style={{ color: "#ffd0d0", lineHeight: 1.65, marginTop: 10 }}>{feature.summary}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                <div style={{ ...card, margin: 0, flex: 1 }}>
                  <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Monthly</div>
                  <div style={{ color: "#fff1c7", fontSize: 28, fontWeight: 900, marginTop: 8 }}>${feature.monthlyUsd.toFixed(2)}</div>
                </div>
                <div style={{ ...card, margin: 0, flex: 1 }}>
                  <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Yearly</div>
                  <div style={{ color: "#fff1c7", fontSize: 28, fontWeight: 900, marginTop: 8 }}>${feature.yearlyUsd.toFixed(2)}</div>
                </div>
              </div>
              <div style={{ color: "#ffb7b7", fontSize: 12, marginTop: 10 }}>{feature.pricingNote}</div>
              <Link href={buildDashboardHref(feature.route)} style={{ display: "inline-block", textDecoration: "none", marginTop: 14, borderRadius: 12, border: "1px solid rgba(255,0,0,.45)", padding: "10px 14px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ffd7d7", background: "#130707" }}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
          OpenAI Platform Plans
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
          {OPENAI_PLATFORM_PRICE_CHART.map((plan) => (
            <div key={plan.id} style={{ ...card, margin: 0 }}>
              <div style={{ color: "#ff5a5a", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 20 }}>
                {plan.label}
              </div>
              <div style={{ color: "#fff1c7", fontSize: 26, fontWeight: 900, marginTop: 12 }}>${plan.monthlyUsd.toFixed(2)}</div>
              <div style={{ color: "#ffd0d0", marginTop: 4 }}>${plan.yearlyUsd.toFixed(2)} yearly</div>
              <div style={{ color: "#ffb7b7", fontSize: 12, lineHeight: 1.6, marginTop: 10 }}>
                {plan.includedMessages.toLocaleString()} messages
                <br />
                {plan.includedImages.toLocaleString()} images
                <br />
                {plan.includedBackstory.toLocaleString()} backstory ops
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.45fr) minmax(320px,0.8fr)", gap: 16 }}>
        <div style={card}>
          <div style={{ color: "#8effbd", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
            Included Standard Stack
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {STANDARD_FEATURES.map((feature) => (
              <div key={feature.id} style={{ ...card, margin: 0, padding: 14 }}>
                <div style={{ color: "#ff5757", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{feature.label}</div>
                <div style={{ color: "#ffd0d0", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{feature.summary}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={card}>
            <div style={{ color: "#7fe5ff", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
              Private Features
            </div>
            {PRIVATE_FEATURES.map((feature) => (
              <div key={feature.id} style={{ ...card, margin: 0 }}>
                <div style={{ color: "#ff5757", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{feature.label}</div>
                <div style={{ color: "#ffd0d0", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{feature.summary}</div>
                <div style={{ color: "#9cecff", fontSize: 12, marginTop: 10 }}>{feature.policyNote}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
              Deployment Rule
            </div>
            <div style={{ color: "#ffd7d7", lineHeight: 1.75 }}>
              New guilds start with the free setup stack ready. Owners wire channels, custom messages, images, roles,
              webhook identity, and permissions, then turn off anything they do not want.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

