import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.governance"
      title="Security Governance"
      description="Live governance state for enforcement approvals, staff-AFK emergency mode, and request queue observability. This page is now bound directly to the security governance engine path."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security-enforcer", label: "Security Enforcer" },
      ]}
    />
  );
}
