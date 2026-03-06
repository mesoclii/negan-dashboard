import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Master Panel Engine"
      description="Dedicated entity for master panel command routing."
      runtimeId="engine/masterPanelEngine.js"
      commandId="/panel"
      links={[
        { href: "/dashboard/panels", label: "Open Panel Deploy" },
        { href: "/dashboard/tickets", label: "Open Tickets" },
      ]}
    />
  );
}
