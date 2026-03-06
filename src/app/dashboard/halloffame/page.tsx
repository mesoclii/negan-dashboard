import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Hall Of Fame Engine"
      description="Dedicated entity for hall of fame controls."
      runtimeId="engine/hallOfFameEngine.js"
      commandId="/halloffame"
      links={[
        { href: "/dashboard/achievements", label: "Open Achievements" },
      ]}
    />
  );
}
