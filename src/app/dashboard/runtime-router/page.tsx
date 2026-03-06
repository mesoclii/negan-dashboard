import EngineEntityClient from "@/components/possum/EngineEntityClient";

export default function Page() {
  return (
    <EngineEntityClient
      title="Runtime Router"
      description="Dedicated entity for runtime routing commands (gun/possum/vip pathing)."
      runtimeId="engine/runtimeRouter.js"
      commandId="/gun /possum /vip"
      links={[
        { href: "/dashboard/security", label: "Open Security Center" },
        { href: "/dashboard/vip", label: "Open VIP" },
      ]}
    />
  );
}
