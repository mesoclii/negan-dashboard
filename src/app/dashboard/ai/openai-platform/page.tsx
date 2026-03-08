import { Suspense } from "react";
import PremiumGate from "@/components/possum/PremiumGate";
import OpenAiPlatformClient from "./OpenAiPlatformClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PremiumGate featureKey="openai-platform" featureLabel="OpenAI Persona Platform">
        <OpenAiPlatformClient />
      </PremiumGate>
    </Suspense>
  );
}
