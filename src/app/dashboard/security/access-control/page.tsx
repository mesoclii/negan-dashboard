import { Suspense } from "react";
import AccessControlClient from "./AccessControlClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading access control...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <AccessControlClient />
    </Suspense>
  );
}
