import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.behavioralDrift"
      title="Behavioral Drift Engine"
      description="Track message volume, content shift, and interaction pattern drift for this guild so unusual changes can feed trust and escalation scoring."
      links={[
        { href: "/dashboard/security/engines", label: "Security Engines" },
        { href: "/dashboard/security/risk-escalation", label: "Risk Escalation" },
      ]}
    />
  );
}
