"use client";

import { useState } from "react";
import { possum } from "@/styles/possumTheme";

type Section = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export function SplitModuleLayout({
  title,
  sections,
}: {
  title: string;
  sections: Section[];
}) {
  const [active, setActive] = useState(sections[0]?.key ?? "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Module Header */}
      <div>
        <div
          className="possum-red possum-glow"
          style={{
            fontSize: 28,
            fontWeight: 950,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      </div>

      {/* Split Layout */}
      <div style={{ display: "flex", gap: 18 }}>
        {/* Internal Left Rail */}
        <div
          style={{
            width: 220,
            border: `1px solid ${possum.border}`,
            borderRadius: 16,
            padding: 12,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {sections.map((s) => {
            const isActive = s.key === active;

            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActive(s.key)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${
                    isActive
                      ? "rgba(255,0,0,0.55)"
                      : "rgba(255,0,0,0.18)"
                  }`,
                  background: isActive
                    ? "rgba(255,0,0,0.16)"
                    : "transparent",
                  color: isActive ? "#fff" : possum.soft,
                  fontWeight: 900,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Control Surface */}
        <div
          style={{
            flex: 1,
            border: `1px solid ${possum.border}`,
            borderRadius: 16,
            padding: 18,
            background: "rgba(0,0,0,0.55)",
          }}
        >
          {sections.map((s) =>
            s.key === active ? <div key={s.key}>{s.content}</div> : null
          )}
        </div>
      </div>
    </div>
  );
}
