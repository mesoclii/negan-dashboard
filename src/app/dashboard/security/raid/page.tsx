import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="raid"
      title="Raid Engine"
      description="Edit the live anti-raid thresholds, exemption lists, and escalation preset that the bot reads for this guild. This page now writes directly to the runtime engine config."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/lockdown", label: "Lockdown Engine" },
      ]}
    />
  );
}
