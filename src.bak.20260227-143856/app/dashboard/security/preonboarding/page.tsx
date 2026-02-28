"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyPreOnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const guildId = String(params.get("guildId") || "").trim();
    const qs = guildId ? `?guildId=${encodeURIComponent(guildId)}` : "";
    router.replace(`/dashboard/security/pre-onboarding${qs}`);
  }, [router]);

  return null;
}
