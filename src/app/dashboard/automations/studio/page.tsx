import { Suspense } from "react";
import PremiumGate from "@/components/possum/PremiumGate";
import BotAutomationStudioClient from "../BotAutomationStudioClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <PremiumGate featureKey="automation-suite" featureLabel="Automation + Custom Commands Suite">
        <BotAutomationStudioClient />
      </PremiumGate>
    </Suspense>
  );
}
