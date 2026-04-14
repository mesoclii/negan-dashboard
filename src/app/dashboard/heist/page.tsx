import { Suspense } from "react";
import PremiumGate from "@/components/possum/PremiumGate";
import HeistClient from "./HeistClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PremiumGate featureKey="heist" featureLabel="Heist Engine">
        <HeistClient />
      </PremiumGate>
    </Suspense>
  );
}
