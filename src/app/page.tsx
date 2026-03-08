"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type LandingSession = {
  loggedIn: boolean;
  oauthConfigured: boolean;
  canEnterDashboard: boolean;
  user?: {
    id: string;
    username: string;
    globalName: string | null;
  } | null;
};

const HERO_IMAGE =
  "https://cdn.discordapp.com/attachments/1479944571336261914/1480026031883554856/possum_dashbaord.jg.png?ex=69ae2d27&is=69acdba7&hm=723340d4be8013cc1764d2d337f660fd840aaeaceebc0240f0ff99d96359dcdc&";

const buttonBase: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 220,
  padding: "16px 18px",
  borderRadius: 16,
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 900,
  fontSize: 14,
};

const primaryButton: CSSProperties = {
  ...buttonBase,
  color: "#190000",
  background: "linear-gradient(90deg, #ff3636 0%, #ff8340 100%)",
  boxShadow: "0 18px 40px rgba(255,0,0,0.26)",
};

const secondaryButton: CSSProperties = {
  ...buttonBase,
  color: "#ffe0e0",
  border: "1px solid rgba(255,0,0,0.42)",
  background: "rgba(18,0,0,0.72)",
};

export default function Home() {
  const [session, setSession] = useState<LandingSession>({
    loggedIn: false,
    oauthConfigured: false,
    canEnterDashboard: false,
    user: null,
  });
  const [now, setNow] = useState(() => new Date());

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
        canEnterDashboard: Boolean(json?.canEnterDashboard),
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

  const entryHref = session.loggedIn && session.canEnterDashboard ? "/guilds" : "/api/auth/discord/login";
  const entryLabel = session.loggedIn && session.canEnterDashboard ? "Select Guild" : "Login To Discord";

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(120,0,0,0.22) 0%, rgba(18,0,0,0.94) 34%, rgba(0,0,0,1) 100%)",
        color: "#ffe2e2",
      }}
    >
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "32px 26px 56px" }}>
        <section
          style={{
            border: "1px solid rgba(255,0,0,0.32)",
            borderRadius: 28,
            background: "linear-gradient(180deg, rgba(85,0,0,0.18), rgba(0,0,0,0.74))",
            padding: 30,
            boxShadow: "0 24px 60px rgba(0,0,0,0.34)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.1fr) minmax(320px,0.9fr)",
              gap: 26,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "#ff9898", fontSize: 15, letterSpacing: "0.30em", textTransform: "uppercase" }}>
                Control Surface
              </div>
              <div
                className="possum-red possum-glow"
                style={{
                  fontSize: "clamp(4rem, 10vw, 8rem)",
                  fontWeight: 950,
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  lineHeight: 0.88,
                  marginTop: 18,
                }}
              >
                Possum
                <br />
                Control
                <br />
                Room
              </div>
              <div style={{ color: "#ffd6d6", fontSize: 18, lineHeight: 1.8, maxWidth: 900, marginTop: 22 }}>
                Status first. Features second. Discord login third. Guild selection after that. The dashboard opens
                only after a valid Discord login and guild access.
              </div>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 }}>
                <a href="/status" style={secondaryButton}>
                  System Status
                </a>
                <a href="/features" style={secondaryButton}>
                  Features
                </a>
                <a href={entryHref} style={primaryButton}>
                  {entryLabel}
                </a>
              </div>

              <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 18, lineHeight: 1.7 }}>
                {session.loggedIn
                  ? `Discord connected as ${session.user?.globalName || session.user?.username || "Connected"}.`
                  : session.oauthConfigured
                    ? "Use Discord login to unlock guild selection and dashboard entry."
                    : "Discord OAuth is not configured yet on this deployment."}
              </div>
            </div>

            <div
              style={{
                minHeight: 520,
                borderRadius: 24,
                border: "1px solid rgba(255,0,0,0.28)",
                background: `linear-gradient(180deg, rgba(35,0,0,0.10), rgba(0,0,0,0.62)), center / cover no-repeat url(${HERO_IMAGE})`,
                boxShadow: "inset 0 0 80px rgba(0,0,0,0.34)",
                display: "flex",
                alignItems: "flex-end",
                padding: 22,
              }}
            >
              <div
                style={{
                  width: "100%",
                  borderRadius: 18,
                  background: "rgba(10,0,0,0.68)",
                  border: "1px solid rgba(255,0,0,0.24)",
                  padding: 16,
                }}
              >
                <div style={{ color: "#ff8f8f", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                  Live Flow
                </div>
                <div style={{ color: "#fff1f1", fontSize: 24, fontWeight: 900, marginTop: 8, textTransform: "uppercase" }}>
                  Home
                  <span style={{ color: "#ff7f7f" }}> → </span>
                  Login
                  <span style={{ color: "#ff7f7f" }}> → </span>
                  Guild
                  <span style={{ color: "#ff7f7f" }}> → </span>
                  Dashboard
                </div>
                <div style={{ color: "#ffd5d5", lineHeight: 1.7, marginTop: 10 }}>
                  New guilds land on the ready baseline with premium features off. Owners finish setup inside the
                  dashboard without touching Saviors.
                </div>
              </div>
            </div>
          </div>
        </section>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <div style={{ color: "#ff8c8c", fontSize: 26, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            {dateLine}
          </div>
          <div style={{ color: "#ffd7d7", fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 10 }}>
            {timeLine}
          </div>
        </div>
      </div>
    </div>
  );
}
