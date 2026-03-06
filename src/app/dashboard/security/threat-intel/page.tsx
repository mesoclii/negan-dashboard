import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Threat Intel Engine"
      description="Dedicated security sub-engine entity."
      runtimeId="engine/threatIntelEngine.js"
      commandId="(runtime)"
      links={[
        { href: "/dashboard/security/engines", label: "Open Security Engines" },
      ]}
    />
  );
}
