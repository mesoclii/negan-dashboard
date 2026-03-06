import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Jed Engine"
      description="Sticker/emote/gif stealing and asset conversion/deploy engine. Separate from Command Studio."
      runtimeId="engines/jedEngine.js"
      commandId="/jed"
      profile="jed"
      links={[
        { href: "/dashboard/system-health", label: "Open System Health" },
        { href: "/dashboard/runtime-router", label: "Open Runtime Router" },
      ]}
    />
  );
}
