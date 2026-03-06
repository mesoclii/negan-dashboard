import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Blacklist Engine"
      description="Dedicated entity for blacklist add/remove/show and enforcement integration."
      runtimeId="engine/blacklistEngine.js"
      commandId="/blacklist"
      links={[
        { href: "/dashboard/security/engines", label: "Open Security Engines" },
        { href: "/dashboard/governance", label: "Open Governance" },
      ]}
    />
  );
}
