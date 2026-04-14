import { Suspense } from "react";
import TtsClient from "./TtsClient";


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
