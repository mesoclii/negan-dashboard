import { Suspense } from "react";
import AccessControlClient from "../security/access-control/AccessControlClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading bot masters...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AccessControlClient />
    </Suspense>
  );
}
