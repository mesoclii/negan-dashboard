import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.linkIntel"
      title="Link Intel Engine"
      description="Evaluate URL safety, shortener behavior, and spread velocity so suspicious links can be scored before they become a guild-wide wave."
      links={[
        { href: "/dashboard/security/threat-intel", label: "Threat Intel" },
        { href: "/dashboard/security/account-integrity", label: "Account Integrity" },
      ]}
    />
  );
}
