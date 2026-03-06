import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Staff Activity Monitor Engine"
      description="Dedicated security sub-engine entity."
      runtimeId="engine/staffActivityMonitorEngine.js"
      commandId="(runtime)"
      links={[
        { href: "/dashboard/security/engines", label: "Open Security Engines" },
      ]}
    />
  );
}
