import { Suspense } from "react";
import SecurityEngineOperator from "@/components/possum/SecurityEngineOperator";
import PreOnboardingClient from "./PreOnboardingClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  void SecurityEngineOperator;
  return (
    <Suspense fallback={<Loading />}>
      <PreOnboardingClient />
    </Suspense>
  );
}
