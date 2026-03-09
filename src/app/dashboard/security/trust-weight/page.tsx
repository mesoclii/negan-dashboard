import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.trustWeight"
      title="Trust Weight Engine"
      description="Weight integrity, link, drift, and threat signals into the trust floor that downstream automation, escalation, and containment depend on."
      links={[
        { href: "/dashboard/security/risk-escalation", label: "Risk Escalation" },
        { href: "/dashboard/security/account-integrity", label: "Account Integrity" },
      ]}
    />
  );
}
