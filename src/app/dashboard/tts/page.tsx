import { Suspense } from "react";
import PremiumGate from "@/components/possum/PremiumGate";
import TtsClient from "../access/tts/TtsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading tts...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PremiumGate featureKey="tts" featureLabel="TTS Engine">
        <TtsClient />
      </PremiumGate>
    </Suspense>
  );
}
