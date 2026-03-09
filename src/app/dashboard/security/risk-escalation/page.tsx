import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.riskEscalation"
      title="Risk Escalation Engine"
      description="Combine trust, drift, integrity, and threat signals into user, crew, and guild escalation states with decay and threshold controls."
      links={[
        { href: "/dashboard/security/containment", label: "Containment" },
        { href: "/dashboard/security/trust-weight", label: "Trust Weight" },
      ]}
    />
  );
}
