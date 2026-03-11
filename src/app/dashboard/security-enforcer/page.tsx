import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.enforcer"
      title="Security Enforcer"
      description="Live enforcement queue and execution surface for security decisions. This page now maps directly to the security enforcer engine instead of a dashboard-only compatibility store."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/governance", label: "Governance" },
        { href: "/dashboard/security/shadow-layer", label: "Shadow Layer" },
      ]}
    />
  );
}
