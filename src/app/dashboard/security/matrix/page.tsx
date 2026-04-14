import { Suspense } from "react";
import SecurityClient from "../SecurityClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading security...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SecurityClient />
    </Suspense>
  );
}
