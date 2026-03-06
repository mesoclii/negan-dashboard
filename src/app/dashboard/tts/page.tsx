import { Suspense } from "react";
import TtsClient from "../access/tts/TtsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading tts...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TtsClient />
    </Suspense>
  );
}
