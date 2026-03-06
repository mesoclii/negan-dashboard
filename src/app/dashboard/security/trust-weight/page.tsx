import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Trust Weight Engine"
      description="Dedicated security sub-engine entity."
      runtimeId="engine/trustWeightEngine.js"
      commandId="(runtime)"
      links={[
        { href: "/dashboard/security/engines", label: "Open Security Engines" },
      ]}
    />
  );
}
