import { Suspense } from "react";
import PremiumGate from "@/components/possum/PremiumGate";
import CreatorOnlyGate from "@/components/possum/CreatorOnlyGate";
import OpenAiPlatformClient from "./OpenAiPlatformClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <CreatorOnlyGate title="Creator AI Platform">
        <PremiumGate featureKey="openai-platform" featureLabel="OpenAI Persona Platform">
          <OpenAiPlatformClient />
        </PremiumGate>
      </CreatorOnlyGate>
    </Suspense>
  );
}
