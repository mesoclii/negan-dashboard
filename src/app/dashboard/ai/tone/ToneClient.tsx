"use client";

import { useEffect } from "react";

export default function AiToneRedirectPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gid = params.get("guildId") || localStorage.getItem("activeGuildId") || "";
    const next = `/dashboard/ai/learning${gid ? `?guildId=${encodeURIComponent(gid)}` : ""}`;
    window.location.replace(next);
  }, []);

  return <div style={{ color: "#ff6b6b", padding: 24 }}>Redirecting to Possum AI...</div>;
}
