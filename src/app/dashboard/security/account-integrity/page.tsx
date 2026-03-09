import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.accountIntegrity"
      title="Account Integrity Engine"
      description="Score account age, profile integrity, and baseline trust signals for this guild before those signals flow into the broader threat and escalation pipeline."
      links={[
        { href: "/dashboard/security/engines", label: "Security Engines" },
        { href: "/dashboard/security/trust-weight", label: "Trust Weight" },
      ]}
    />
  );
}
