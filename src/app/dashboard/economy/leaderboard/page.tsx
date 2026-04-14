import { Suspense } from "react";
import LeaderboardClient from "./LeaderboardClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LeaderboardClient />
    </Suspense>
  );
}
