import { Suspense } from "react";
import ModeratorClient from "@/app/dashboard/moderator/ModeratorClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff6b6b", padding: 24 }}>Loading moderator...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ModeratorClient />
    </Suspense>
  );
}
