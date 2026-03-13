import { Suspense } from "react";
import CommunityStudioClient from "./CommunityStudioClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<main style={{ padding: 16, color: "#ff8a8a" }}>Loading Community Studio...</main>}>
      <CommunityStudioClient />
    </Suspense>
  );
}
