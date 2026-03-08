"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { buildPublicInviteUrl } from "@/lib/publicLinks";

type LandingSession = {
  loggedIn: boolean;
  oauthConfigured: boolean;
  isMasterOwner: boolean;
  canEnterDashboard: boolean;
  accessibleGuildCount: number;
  counts?: {
    adminGuilds: number;
    installedGuilds: number;
  };
  user?: {
    id: string;
    username: string;
    globalName: string | null;
  } | null;
};

const primaryButton: CSSProperties = {
  display: "inline-block",
  padding: "16px 20px",
  borderRadius: 16,
  textDecoration: "none",
  fontWeight: 950,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#1a0000",
  background: "linear-gradient(90deg, rgba(255,46,46,0.98), rgba(255,132,74,0.96))",
  boxShadow: "0 14px 34px rgba(255,0,0,0.22)",
};

const secondaryButton: CSSProperties = {
  display: "inline-block",
  padding: "16px 20px",
  borderRadius: 16,
  textDecoration: "none",
  fontWeight: 950,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#ffd7d7",
  background: "rgba(20,0,0,0.72)",
  border: "1px solid rgba(255,0,0,0.38)",
};

export default function Home() {
  const [now, setNow] = useState(() => new Date());
  const [session, setSession] = useState<LandingSession>({
    loggedIn: false,
    oauthConfigured: false,
    isMasterOwner: false,
    canEnterDashboard: false,
    accessibleGuildCount: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/session", { cache: "no-store" }).catch(() => null);
      const json = await res?.json().catch(() => ({}));
      setSession({
        loggedIn: Boolean(json?.loggedIn),
        oauthConfigured: Boolean(json?.oauthConfigured),
        isMasterOwner: Boolean(json?.isMasterOwner),
        canEnterDashboard: Boolean(json?.canEnterDashboard),
        accessibleGuildCount: Number(json?.accessibleGuildCount || 0),
        counts: json?.counts || { adminGuilds: 0, installedGuilds: 0 },
        user: json?.user || null,
      });
    })();
  }, []);

  const dateLine = useMemo(
    () =>
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "2-digit",
        year: "numeric",
        timeZone: "America/Los_Angeles",
      }),
    [now]
  );

  const timeLine = useMemo(
    () =>
      now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "America/Los_Angeles",
        timeZoneName: "short",
      }),
    [now]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(130,0,0,0.36) 0%, rgba(18,0,0,0.96) 38%, rgba(0,0,0,1) 100%)",
        color: "#ffd7d7",
      }}
    >
      <div style={{ maxWidth: 1480, margin: "0 auto", padding: "28px 24px 48px" }}>
        <section
          style={{
            border: "1px solid rgba(255,0,0,0.36)",
            borderRadius: 26,
            background: "linear-gradient(180deg, rgba(120,0,0,0.16), rgba(0,0,0,0.72))",
            padding: 28,
            boxShadow: "0 24px 60px rgba(0,0,0,0.34)",
            marginBottom: 22,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(320px,0.85fr)", gap: 24 }}>
            <div>
              <div style={{ color: "#ff8f8f", fontSize: 15, letterSpacing: "0.30em", textTransform: "uppercase" }}>
                Control Surface
              </div>
              <div
                className="possum-red possum-glow"
                style={{
                  fontSize: "clamp(3.4rem, 9vw, 7rem)",
                  fontWeight: 950,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  lineHeight: 0.88,
                  marginTop: 16,
                  marginBottom: 18,
                }}
              >
                Possum
                <br />
                Control
                <br />
                Room
              </div>
              <div
                style={{
                  color: "#ffd8d8",
                  fontSize: "clamp(1rem, 1.7vw, 1.15rem)",
                  lineHeight: 1.8,
                  maxWidth: 920,
                }}
              >
                Bot governance, status, SaaS onboarding, per-guild personalization, engine setup, and live control in
                one place. New guilds start with the standard free stack ready so owners only need to finish setup,
                not rebuild the bot from zero.
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                {!session.loggedIn ? (
                  <a href="/api/auth/discord/login" style={primaryButton}>
                    Login With Discord
                  </a>
                ) : null}

                {session.loggedIn && session.canEnterDashboard ? (
                  <a href="/guilds" style={primaryButton}>
                    Enter Dashboard
                  </a>
                ) : null}

                <a href="/features" style={secondaryButton}>
                  Features + Pricing
                </a>
                <a href="/status" style={secondaryButton}>
                  System Status
                </a>
                <a href={buildPublicInviteUrl()} target="_blank" rel="noreferrer" style={secondaryButton}>
                  Invite Bot
                </a>
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div
                style={{
                  border: "1px solid rgba(255,0,0,0.32)",
                  borderRadius: 18,
                  background: "rgba(18,0,0,0.68)",
                  padding: 18,
                }}
              >
                <div style={{ color: "#ff9d9d", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Session
                </div>
                <div style={{ color: "#fff0f0", fontSize: 28, fontWeight: 900, marginTop: 8 }}>
                  {session.loggedIn
                    ? session.user?.globalName || session.user?.username || "Connected"
                    : "Guest"}
                </div>
                <div style={{ color: "#ffd4d4", lineHeight: 1.7, marginTop: 10 }}>
                  {session.loggedIn
                    ? session.canEnterDashboard
                      ? `Dashboard-ready across ${session.accessibleGuildCount} accessible guild${session.accessibleGuildCount === 1 ? "" : "s"}.`
                      : "Logged in, but no dashboard access is available yet. The guild owner still needs to grant Bot Masters access or add the bot."
                    : session.oauthConfigured
                      ? "Login shows servers you manage and unlocks dashboard entry once access exists."
                      : "Discord OAuth is not configured yet on this deployment."}
                </div>
              </div>

              <div
                style={{
                  border: "1px solid rgba(255,0,0,0.32)",
                  borderRadius: 18,
                  background: "rgba(18,0,0,0.68)",
                  padding: 18,
                }}
              >
                <div style={{ color: "#ff9d9d", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  Baseline Policy
                </div>
                <div style={{ color: "#fff0f0", fontSize: 22, fontWeight: 900, marginTop: 8 }}>
                  Free Stack Ready
                </div>
                <div style={{ color: "#ffd4d4", lineHeight: 1.7, marginTop: 10 }}>
                  Saviors keeps its full original baseline untouched. New guilds get the free setup stack ready by
                  default. Premium add-ons stay off, and Pokemon remains private-only.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            {
              title: "Ready On Arrival",
              body: "Tickets, selfroles, invite tracking, economy, contracts, crew, dominion, cat drops, rare spawns, range, truth or dare, and Possum AI start ready for setup.",
            },
            {
              title: "Premium Off By Default",
              body: "TTS, Persona Engine AI, and the Heist signup engine stay off until the guild buys them or you enable them for your own admin use.",
            },
            {
              title: "Private Systems Stay Private",
              body: "Pokemon catching, battle, and trade remain owner-only and are never listed in public monetization.",
            },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                border: "1px solid rgba(255,0,0,0.28)",
                borderRadius: 18,
                background: "rgba(12,0,0,0.72)",
                padding: 18,
              }}
            >
              <div style={{ color: "#ff5b5b", fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {item.title}
              </div>
              <div style={{ color: "#ffd4d4", lineHeight: 1.75, marginTop: 12 }}>{item.body}</div>
            </div>
          ))}
        </section>

        <section
          style={{
            border: "1px solid rgba(255,0,0,0.26)",
            borderRadius: 22,
            background: "rgba(12,0,0,0.72)",
            padding: 22,
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(320px,0.8fr)",
            gap: 18,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#ff8e8e", fontSize: 14, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Live Entry Rules
            </div>
            <div style={{ color: "#fff1f1", fontSize: 28, fontWeight: 900, marginTop: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Login First, Then Enter
            </div>
            <div style={{ color: "#ffd7d7", lineHeight: 1.8, marginTop: 12 }}>
              Public visitors see the feature list, system status, and invite flow. Dashboard entry only appears after a
              Discord login and valid guild access.
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#ff7d7d", fontSize: 26, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase" }}>
              {dateLine}
            </div>
            <div style={{ color: "#ffd6d6", fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 10 }}>
              {timeLine}
            </div>
            <div
              style={{
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: "14px",
                opacity: 0.9,
                marginTop: 18,
                color: "#ff9a9a",
              }}
            >
              Designed by AstonedPossum & aCityRaccoon
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
