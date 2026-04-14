import { Suspense } from "react";
import EconomyRewardsClient from "./EconomyRewardsClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <EconomyRewardsClient />
    </Suspense>
  );
}

