"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
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
    <div className="possum-bg" style={{ minHeight: "100vh" }}>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "center",
          padding: "60px 20px 30px 20px",
        }}
      >
        <div>
          <div
            className="possum-red possum-glow"
            style={{
              fontSize: "78px",
              fontWeight: 950,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              lineHeight: 1.05,
            }}
          >
            POSSUM
            <br />
            CONTROL
            <br />
            ROOM
          </div>
        </div>

        <div style={{ maxWidth: "900px" }}>
          <div
            className="possum-red possum-glow-soft"
            style={{
              fontSize: "20px",
              letterSpacing: "0.40em",
              textTransform: "uppercase",
              opacity: 0.95,
              marginBottom: "40px",
            }}
          >
            Engine Governance • Security Oversight • System Control
          </div>

          <div style={{ display: "flex", gap: "28px", justifyContent: "center" }}>
            <a
              href="/guilds"
              className="possum-btn"
              style={{
                display: "inline-block",
                padding: "16px 26px",
                borderRadius: "14px",
                textDecoration: "none",
                fontWeight: 950,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#000",
                background: "rgba(255, 26, 26, 0.95)",
              }}
            >
              Enter Dashboard
            </a>

            <a
              href="/guilds"
              className="possum-btn"
              style={{
                display: "inline-block",
                padding: "16px 26px",
                borderRadius: "14px",
                textDecoration: "none",
                fontWeight: 950,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255, 80, 80, 0.92)",
                background: "transparent",
              }}
            >
              System Status
            </a>
          </div>
        </div>

        <div>
          <div
            className="possum-red"
            style={{
              fontSize: "28px",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              opacity: 0.95,
              marginBottom: "14px",
            }}
          >
            {dateLine}
            <br />
            {timeLine}
          </div>

          <div
            className="possum-soft"
            style={{
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              fontSize: "16px",
              opacity: 0.9,
            }}
          >
            Designed by AstonedPossum & aCityRaccoon
          </div>
        </div>
      </div>
    </div>
  );
}
