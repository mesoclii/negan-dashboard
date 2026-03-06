import { Suspense } from "react";
import InviteTrackerClient from "../access/invite-tracker/InviteTrackerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<main style={{ padding: 16, color: "#ff8a8a" }}>Loading invite tracker...</main>}>
      <InviteTrackerClient />
    </Suspense>
  );
}
