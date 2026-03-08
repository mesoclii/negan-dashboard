"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { buildDashboardHref, readDashboardGuildId } from "@/lib/dashboardContext";
import { PREMIUM_FEATURES, STANDARD_FEATURES } from "@/lib/premiumCatalog";

const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.36)",
  borderRadius: 12,
  padding: 16,
  background: "rgba(100,0,0,.10)",
};

const badge = (tone: "premium" | "standard") =>
  ({
    display: "inline-block",
    borderRadius: 999,
    padding: "3px 10px",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    border: tone === "premium" ? "1px solid #d39a00" : "1px solid #0f7a0f",
    color: tone === "premium" ? "#ffe6a8" : "#b8ffb8",
    background: tone === "premium" ? "rgba(125,86,0,0.22)" : "rgba(16,100,16,0.18)",
  }) as const;

function FeatureListItem({
  label,
  summary,
  href,
  tone,
  pill,
}: {
  label: string;
  summary: string;
  href: string;
  tone: "premium" | "standard";
  pill: string;
}) {
  return (
    <div style={{ ...card, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <span style={badge(tone)}>{pill}</span>
          </div>
          <div style={{ color: "#ff5a5a", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
          <div style={{ color: "#ffd0d0", marginTop: 8, lineHeight: 1.5 }}>{summary}</div>
        </div>
        <Link
          href={buildDashboardHref(href)}
          style={{
            textDecoration: "none",
            border: "1px solid #7a0000",
            borderRadius: 10,
            padding: "10px 12px",
            color: "#ffd7d7",
            background: "#130707",
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Open
        </Link>
      </div>
    </div>
  );
}

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
    <div style={{ color: "#ffd0d0", maxWidth: 1320 }}>
      <section style={{ ...card, marginBottom: 12 }}>
        <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>Monetization Surface</div>
        <h1 style={{ marginTop: 8, color: "#ff4a4a", letterSpacing: "0.12em", textTransform: "uppercase" }}>Premium Features</h1>
        <p style={{ color: "#ffb5b5", marginBottom: 10, lineHeight: 1.6 }}>
          This page separates what is paid from what stays standard in the public SaaS catalog. Private features like Pokemon are intentionally excluded from the premium list.
        </p>
        <div style={{ color: "#ffd8a8", fontSize: 13 }}>
          Active Guild: {guildId || "No guild selected"}
        </div>
        <div style={{ color: "#ffd8a8", fontSize: 13, marginTop: 6 }}>
          Current Premium Status: {status ? `${status.active ? "Active" : "Inactive"} | ${status.plan}` : "Loading..."}
          {status?.source ? ` | Source ${status.source}` : ""}
        </div>
        {statusMsg ? <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 8 }}>{statusMsg}</div> : null}
      </section>

      <section style={{ marginBottom: 18 }}>
        <h2 style={{ color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>Paid / Premium Catalog</h2>
        <p style={{ color: "#ffb5b5", marginBottom: 12 }}>
          Persona Engine AI here means the OpenAI persona path only. It does not include the handmade adaptive learning AI.
        </p>
        {PREMIUM_FEATURES.map((feature) => (
          <FeatureListItem
            key={feature.route}
            label={feature.label}
            summary={feature.summary}
            href={feature.route}
            tone="premium"
            pill={feature.premiumLabel}
          />
        ))}
      </section>

      <section>
        <h2 style={{ color: "#ff6666", letterSpacing: "0.08em", textTransform: "uppercase" }}>Standard / Included Features</h2>
        <p style={{ color: "#ffb5b5", marginBottom: 12 }}>
          These pages stay part of the standard dashboard experience unless you decide to monetize them later.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 12 }}>
          {STANDARD_FEATURES.map((feature) => (
            <FeatureListItem
              key={feature.route}
              label={feature.label}
              summary={feature.summary}
              href={feature.route}
              tone="standard"
              pill="Standard"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
