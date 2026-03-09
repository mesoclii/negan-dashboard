import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.forensics"
      title="Forensics Engine"
      description="Collect destructive audit-log bursts, moderation anomalies, and trace evidence so incidents can be reconstructed after the fact."
      links={[
        { href: "/dashboard/security/audit-trail", label: "Audit Trail" },
        { href: "/dashboard/security/staff-activity", label: "Staff Activity" },
      ]}
    />
  );
}
