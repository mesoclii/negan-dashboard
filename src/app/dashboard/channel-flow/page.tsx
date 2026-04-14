import { Suspense } from "react";
import ChannelFlowClient from "./ChannelFlowClient";


export default function Page() {
  return (
    <Suspense fallback={<main style={{ padding: 16, color: "#ff8a8a" }}>Loading Channel Flow...</main>}>
      <ChannelFlowClient />
    </Suspense>
  );
}
