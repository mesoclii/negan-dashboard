import { Suspense } from "react";
import SignalRelayClient from "./SignalRelayClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<main style={{ padding: 16, color: "#ff8a8a" }}>Loading Signal Relay...</main>}>
      <SignalRelayClient />
    </Suspense>
  );
}
