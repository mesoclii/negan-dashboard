import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="lockdown"
      title="Lockdown Engine"
      description="Edit the live lockdown thresholds and exemption rules that the bot reads for this guild. This page now writes directly to the runtime engine config instead of dashboard mirrors."
      links={[
        { href: "/dashboard/security", label: "Security" },
        { href: "/dashboard/security/raid", label: "Raid Engine" },
      ]}
    />
  );
}
