import { Suspense } from "react";
import PremiumGate from "@/components/possum/PremiumGate";
import PersonaClient from "./PersonaClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PremiumGate featureKey="persona" featureLabel="Persona Engine AI">
        <PersonaClient />
      </PremiumGate>
    </Suspense>
  );
}
