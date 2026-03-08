import Link from "next/link";
import type { CSSProperties } from "react";
import { buildPublicInviteUrl } from "@/lib/publicLinks";
import {
  OPENAI_PLATFORM_PRICE_CHART,
  PREMIUM_FEATURES,
  PRIVATE_FEATURES,
  STANDARD_FEATURES,
} from "@/lib/premiumCatalog";

const shell: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(110,0,0,0.35) 0%, rgba(12,0,0,0.96) 38%, rgba(0,0,0,1) 100%)",
  color: "#ffd7d7",
  padding: "32px 24px 60px",
};

const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,0.34)",
  borderRadius: 18,
  background: "linear-gradient(180deg, rgba(110,0,0,0.18), rgba(0,0,0,0.72))",
  padding: 18,
  boxShadow: "0 18px 50px rgba(0,0,0,0.32)",
};

export default function FeaturesPage() {
  return (
    <div style={shell}>
      <div style={{ maxWidth: 1420, margin: "0 auto" }}>
        <section
          style={{
            ...card,
            padding: 28,
            marginBottom: 20,
            display: "grid",
            gridTemplateColumns: "minmax(0,1.4fr) minmax(320px,0.9fr)",
            gap: 18,
          }}
        >
          <div>
            <div style={{ color: "#ff9494", fontSize: 14, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              Possum SaaS Catalog
            </div>
            <h1
              style={{
                margin: "12px 0 10px",
                color: "#ff3e3e",
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                lineHeight: 0.92,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                textShadow: "0 0 28px rgba(255,0,0,0.48)",
              }}
            >
              Features
              <br />
              Pricing
              <br />
              Access
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.7, maxWidth: 880, color: "#ffd3d3" }}>
              New guilds start with the standard setup stack ready so owners only need to wire channels, messages,
              roles, webhooks, and images. Premium add-ons stay off until purchased. Pokemon stays private and
              owner-only.
            </p>
          </div>

          <div style={{ ...card, margin: 0 }}>
            <div style={{ color: "#ff8e8e", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              Quick Actions
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <a
                href={buildPublicInviteUrl()}
                target="_blank"
                rel="noreferrer"
                style={{
                  textDecoration: "none",
                  textAlign: "center",
                  borderRadius: 14,
                  border: "1px solid #ff4545",
                  padding: "14px 16px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#160000",
                  background: "linear-gradient(90deg, #ff3f3f, #ff8c3f)",
                }}
              >
                Invite Bot
              </a>
              <Link
                href="/status"
                style={{
                  textDecoration: "none",
                  textAlign: "center",
                  borderRadius: 14,
                  border: "1px solid rgba(255,0,0,0.45)",
                  padding: "14px 16px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#ffd7d7",
                  background: "#130707",
                }}
              >
                View System Status
              </Link>
              <Link
                href="/guilds"
                style={{
                  textDecoration: "none",
                  textAlign: "center",
                  borderRadius: 14,
                  border: "1px solid rgba(255,0,0,0.45)",
                  padding: "14px 16px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#ffd7d7",
                  background: "#130707",
                }}
              >
                Open Guild Selector
              </Link>
            </div>
          </div>
        </section>

        <section style={{ ...card, marginBottom: 20 }}>
          <div style={{ color: "#ff8e8e", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
            Premium Add-Ons
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
            {PREMIUM_FEATURES.map((feature) => (
              <div key={feature.id} style={{ ...card, margin: 0 }}>
                <div style={{ color: "#ffd49a", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  {feature.premiumLabel}
                </div>
                <div style={{ color: "#ff5656", fontSize: 22, fontWeight: 900, textTransform: "uppercase", marginTop: 8 }}>
                  {feature.label}
                </div>
                <div style={{ color: "#ffd1d1", lineHeight: 1.6, marginTop: 8 }}>{feature.summary}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <div style={{ ...card, margin: 0, flex: 1 }}>
                    <div style={{ color: "#ff9b9b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Monthly
                    </div>
                    <div style={{ color: "#fff1c7", fontSize: 30, fontWeight: 900 }}>${feature.monthlyUsd.toFixed(2)}</div>
                  </div>
                  <div style={{ ...card, margin: 0, flex: 1 }}>
                    <div style={{ color: "#ff9b9b", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Yearly
                    </div>
                    <div style={{ color: "#fff1c7", fontSize: 30, fontWeight: 900 }}>${feature.yearlyUsd.toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ color: "#ffb7b7", fontSize: 12, marginTop: 12 }}>{feature.pricingNote}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...card, marginBottom: 20 }}>
          <div style={{ color: "#ff8e8e", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
            OpenAI Platform Price Chart
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            {OPENAI_PLATFORM_PRICE_CHART.map((plan) => (
              <div key={plan.id} style={{ ...card, margin: 0 }}>
                <div style={{ color: "#ff5656", fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>{plan.label}</div>
                <div style={{ color: "#fff1c7", fontSize: 28, fontWeight: 900, marginTop: 10 }}>
                  ${plan.monthlyUsd.toFixed(2)}
                  <span style={{ color: "#ffb8b8", fontSize: 13, marginLeft: 8 }}>/ month</span>
                </div>
                <div style={{ color: "#ffd7d7", marginTop: 6 }}>${plan.yearlyUsd.toFixed(2)} yearly</div>
                <div style={{ color: "#ffbdbd", fontSize: 13, marginTop: 10, lineHeight: 1.6 }}>
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

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(320px,0.8fr)", gap: 20 }}>
          <div style={card}>
            <div style={{ color: "#8dffb9", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
              Included Standard Stack
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              {STANDARD_FEATURES.map((feature) => (
                <div key={feature.id} style={{ ...card, margin: 0, padding: 14 }}>
                  <div style={{ color: "#ff5252", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {feature.label}
                  </div>
                  <div style={{ color: "#ffd0d0", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{feature.summary}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div style={card}>
              <div style={{ color: "#7ee5ff", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
                Private / Owner-Only
              </div>
              {PRIVATE_FEATURES.map((feature) => (
                <div key={feature.id} style={{ ...card, margin: 0 }}>
                  <div style={{ color: "#ff5656", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {feature.label}
                  </div>
                  <div style={{ color: "#ffd0d0", fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>{feature.summary}</div>
                  <div style={{ color: "#9cecff", fontSize: 12, marginTop: 10 }}>{feature.policyNote}</div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ color: "#ff8e8e", fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
                SaaS Behavior
              </div>
              <div style={{ color: "#ffd3d3", lineHeight: 1.7, fontSize: 14 }}>
                New servers start with the free setup stack ready.
                <br />
                Owners configure webhooks, channels, messages, images, roles, and routing from the dashboard.
                <br />
                Every engine can still be turned off later if a guild does not want it.
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
