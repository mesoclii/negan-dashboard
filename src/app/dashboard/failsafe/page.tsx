import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Failsafe Engine"
      description="Dedicated entity for emergency pause gate and runtime safety behavior."
      runtimeId="engine/failsafeEngine.js"
      commandId="/failsafe"
      links={[
        { href: "/dashboard/system-health", label: "Open System Health" },
        { href: "/dashboard/security/policy", label: "Open Security Policy" },
      ]}
    />
  );
}
