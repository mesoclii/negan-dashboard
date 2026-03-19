function isEnabled(raw: string) {
  return ["1", "true", "yes", "on", "enabled"].includes(String(raw || "").trim().toLowerCase());
}

export function isPremiumEnforcementEnabled() {
  return isEnabled(
    String(
      process.env.NEXT_PUBLIC_SAAS_PREMIUM_ENFORCEMENT ||
      process.env.NEXT_PUBLIC_PREMIUM_ENFORCEMENT ||
      process.env.SAAS_PREMIUM_ENFORCEMENT ||
      ""
    )
  );
}
