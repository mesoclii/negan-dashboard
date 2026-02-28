"use client";

import { useState } from "react";
import { possum } from "@/styles/possumTheme";

export function PossumTabs({
  tabs,
}: {
  tabs: { key: string; label: string; content: React.ReactNode }[];
}) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 10,
          borderBottom: `1px solid ${possum.divider}`,
          paddingBottom: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {tabs.map((t) => {
          const isOn = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              style={{
                cursor: "pointer",
                borderRadius: 999,
                padding: "10px 14px",
                border: `1px solid ${isOn ? "rgba(255,0,0,0.55)" : "rgba(255,0,0,0.18)"}`,
                background: isOn ? "rgba(255,0,0,0.18)" : "transparent",
                color: isOn ? "#fff" : possum.soft,
                fontWeight: 950,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: 12,
                boxShadow: isOn ? "0 0 20px rgba(255,0,0,0.22)" : "none",
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div>
        {tabs.map((t) => (t.key === active ? <div key={t.key}>{t.content}</div> : null))}
      </div>
    </div>
  );
}
