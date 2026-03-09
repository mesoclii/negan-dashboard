"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  PROGRESSION_STACK,
  type ProgressionStackKey,
} from "@/lib/dashboardEngineCatalog";
import { buildDashboardHref } from "@/lib/dashboardContext";

const shellCard: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.34)",
  borderRadius: 14,
  background: "rgba(90,0,0,.12)",
  padding: 16,
};

const tabBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid rgba(255,0,0,.30)",
};

export default function ProgressionStackShell({
  activeKey,
  title,
  subtitle,
  children,
}: {
  activeKey: ProgressionStackKey;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 14, marginBottom: 14 }}>
      <section style={shellCard}>
        <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Linked Progression Stack
        </div>
        <div
          style={{
            color: "#ff4040",
            fontSize: 28,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            marginTop: 8,
          }}
        >
          {title}
        </div>
        <div style={{ color: "#ffd0d0", lineHeight: 1.7, maxWidth: 980, marginTop: 8 }}>{subtitle}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {PROGRESSION_STACK.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={buildDashboardHref(item.route)}
                style={{
                  ...tabBase,
                  color: active ? "#190000" : "#ffd6d6",
                  background: active ? "linear-gradient(90deg,#ff3f3f,#ff8440)" : "#120707",
                  borderColor: active ? "rgba(255,120,80,.65)" : "rgba(255,0,0,.30)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      {children}
    </div>
  );
}
