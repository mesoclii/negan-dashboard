"use client";

import { useEffect } from "react";

export default function CustomCommandsAliasPage() {
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const gid = p.get("guildId") || localStorage.getItem("activeGuildId") || "";
    const target = `/dashboard/commands${gid ? `?guildId=${encodeURIComponent(gid)}` : ""}`;
    window.location.replace(target);
  }, []);

  return <div style={{ color: "#ff6b6b", padding: 24 }}>Redirecting to Command Studio…</div>;
}
