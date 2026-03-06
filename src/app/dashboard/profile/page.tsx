import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Profile Engine"
      description="Dedicated entity for profile/rank/rep controls."
      runtimeId="engine/profileEngine.js"
      commandId="/profile /rank"
      links={[
        { href: "/dashboard/economy/progression", label: "Open Progression" },
      ]}
    />
  );
}
