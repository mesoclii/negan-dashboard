import { Suspense } from "react";
import PremiumGate from "@/components/possum/PremiumGate";
import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";
import PersonaClient from "./PersonaClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PremiumGate featureKey="persona" featureLabel="Persona Engine AI">
        <>
          <CatalogEngineConsole
            engineKey="persona"
            title="Persona Engine Config"
            description="Live persona engine identity and runtime profile for this guild. The roster and runtime notes remain below, but saves now write directly to the persona engine config."
            links={[
              { href: "/dashboard/ai/learning", label: "Possum AI" },
              { href: "/dashboard/bot-personalizer", label: "Bot Personalizer" },
            ]}
          />
          <PersonaClient />
        </>
      </PremiumGate>
    </Suspense>
  );
}
