import { Suspense } from "react";
import SystemHealthClient from "./SystemHealthClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SystemHealthClient />
    </Suspense>
  );
}
