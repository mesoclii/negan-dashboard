import { Suspense } from "react";
import InviteTrackerClient from "./InviteTrackerClient";


export default function Page() {
  return (
    <Suspense fallback={<main style={{ padding: 16, color: "#ff8a8a" }}>Loading invite tracker...</main>}>
      <InviteTrackerClient />
    </Suspense>
  );
}
