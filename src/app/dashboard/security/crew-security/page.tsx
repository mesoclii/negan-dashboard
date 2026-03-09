import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";

export default function Page() {
  return (
    <CatalogEngineConsole
      engineKey="security.crewSecurity"
      title="Crew Security Engine"
      description="Monitor suspicious crew-to-crew patterns, funneling, and ping-pong behavior so GTA operations can be protected without flattening the whole guild."
      links={[
        { href: "/dashboard/crew", label: "Crew Engine" },
        { href: "/dashboard/security/engines", label: "Security Engines" },
      ]}
    />
  );
}
