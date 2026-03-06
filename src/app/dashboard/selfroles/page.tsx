import { Suspense } from "react";
import RolesClient from "../roles/RolesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading selfroles...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <RolesClient />
    </Suspense>
  );
}
