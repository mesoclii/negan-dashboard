import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="preOnboarding"
      title="Pre-Onboarding Enforcement"
      description="Edit the live blacklist-rejoin, refusal-role, and enforcement-channel rules that the pre-onboarding enforcement runtime uses for this guild."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/onboarding", label: "Onboarding" },
        { href: "/dashboard/security/verification", label: "Verification" },
      ]}
    />
  );
}
