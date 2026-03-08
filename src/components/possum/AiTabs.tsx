"use client";

import Link from "next/link";
import { buildDashboardHref } from "@/lib/dashboardContext";

type TabId = "personalizer" | "possum" | "persona";

type Props = {
  current: TabId;
};

const TABS: Array<{ id: TabId; label: string; href: string }> = [
  { id: "personalizer", label: "Bot Personalizer", href: "/dashboard/bot-personalizer" },
  { id: "possum", label: "Possum AI", href: "/dashboard/ai/learning" },
  { id: "persona", label: "Persona AI", href: "/dashboard/ai/persona" },
];

export default function AiTabs({ current }: Props) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
      }}
    >
      {TABS.map((tab) => {
        const active = tab.id === current;
        return (
          <Link
            key={tab.id}
            href={buildDashboardHref(tab.href)}
            style={{
              border: active ? "1px solid rgba(255,70,70,.78)" : "1px solid rgba(255,0,0,.36)",
              borderRadius: 999,
              background: active ? "rgba(140,0,0,.38)" : "rgba(12,0,0,.72)",
              color: active ? "#fff1f1" : "#ffd0d0",
              padding: "10px 14px",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: active ? "0 0 18px rgba(255,0,0,.18)" : "none",
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
