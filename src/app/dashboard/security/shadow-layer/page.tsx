import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.shadowLayer"
      title="Shadow Layer Engine"
      description="Apply hidden suppression and interaction deny rules for high-risk users when you want quiet containment instead of visible enforcement."
      links={[
        { href: "/dashboard/security/containment", label: "Containment" },
        { href: "/dashboard/security/policy", label: "Security Policy" },
      ]}
    />
  );
}
