"use client";

import { useState } from "react";
import { possum } from "@/styles/possumTheme";

export function PossumToggle({
  label = "Active",
  defaultOn = true,
}: {
  label?: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        border: `1px solid ${on ? "rgba(255,0,0,0.55)" : "rgba(255,0,0,0.22)"}`,
        background: on ? "rgba(255,0,0,0.18)" : "rgba(0,0,0,0.25)",
        boxShadow: on
          ? "0 0 22px rgba(255,0,0,0.25), inset 0 0 18px rgba(255,0,0,0.14)"
          : "0 0 14px rgba(255,0,0,0.10)",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontWeight: 950,
          fontSize: 12,
          color: on ? "#fff" : possum.soft,
          textShadow: on ? possum.glowSoft : "none",
        }}
      >
        {label}
      </span>

      <span
        style={{
          width: 44,
          height: 24,
          borderRadius: 999,
          border: `1px solid ${possum.border}`,
          background: "rgba(0,0,0,0.55)",
          position: "relative",
          boxShadow: "inset 0 0 14px rgba(255,0,0,0.10)",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 22 : 3,
            width: 18,
            height: 18,
            borderRadius: 999,
            background: on ? possum.red : "rgba(255,80,80,0.35)",
            boxShadow: on ? possum.glowSoft : "none",
            transition: "left 140ms ease",
          }}
        />
      </span>
    </button>
  );
}
