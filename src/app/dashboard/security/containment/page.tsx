import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.containment"
      title="Containment Engine"
      description="Control automated slowmode and isolation behavior when guild or category risk reaches the configured emergency threshold."
      links={[
        { href: "/dashboard/security/escalation", label: "Escalation" },
        { href: "/dashboard/security/policy", label: "Security Policy" },
      ]}
    />
  );
}
