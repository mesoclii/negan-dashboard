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
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: "22px 26px 56px" }}>
        <section
          style={{
            border: "1px solid rgba(255,0,0,0.32)",
            borderRadius: 28,
            background: "linear-gradient(180deg, rgba(85,0,0,0.18), rgba(0,0,0,0.74))",
            padding: "42px 34px 34px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.34)",
            overflow: "hidden",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              className="possum-red possum-glow"
              style={{
                fontSize: "clamp(4.8rem, 11vw, 8.8rem)",
                fontWeight: 950,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                lineHeight: 0.86,
                margin: 0,
              }}
            >
              Possum
              <br />
              Control
              <br />
              Room
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginTop: 34 }}>
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

            <div style={{ color: "#ffbcbc", fontSize: 14, marginTop: 18, minHeight: 24 }}>
              {session.loggedIn
                ? `Discord connected as ${session.user?.globalName || session.user?.username || "Connected"}`
                : session.oauthConfigured
                  ? "Login with Discord to unlock guild selection"
                  : "Discord OAuth is not configured yet on this deployment."}
            </div>
          </div>

          <div
            style={{
              marginTop: 34,
              minHeight: 340,
              borderRadius: 24,
              border: "1px solid rgba(255,0,0,0.22)",
              background: `linear-gradient(180deg, rgba(15,0,0,0.12), rgba(0,0,0,0.42)), center / contain no-repeat url(${HERO_IMAGE})`,
              boxShadow: "inset 0 0 80px rgba(0,0,0,0.30)",
            }}
          />
        </section>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <div style={{ color: "#ff8c8c", fontSize: 26, fontWeight: 900, letterSpacing: "0.10em", textTransform: "uppercase" }}>
            {dateLine}
          </div>
          <div style={{ color: "#ffd7d7", fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 10 }}>
            {timeLine}
          </div>
          <div
            style={{
              color: "#ff9a9a",
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              marginTop: 16,
              textShadow: "0 0 18px rgba(255,54,54,0.18)",
            }}
          >
            Designed by aStonedPossum &amp; aCityRaccoon
          </div>
        </div>
      </div>
    </div>
  );
}
