import { Suspense } from "react";
import OnboardingClient from "./OnboardingClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <OnboardingClient />
    </Suspense>
  );
}
