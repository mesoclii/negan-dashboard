import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.staffActivityMonitor"
      title="Staff Activity Monitor Engine"
      description="Track staff action velocity and moderation anomalies so owner teams can see risky internal patterns instead of only member-side threats."
      links={[
        { href: "/dashboard/security/forensics", label: "Forensics" },
        { href: "/dashboard/security/audit-trail", label: "Audit Trail" },
      ]}
    />
  );
}
