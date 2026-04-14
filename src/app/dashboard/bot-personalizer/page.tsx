import { Suspense } from "react";
import BotPersonalizerClient from "./BotPersonalizerClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading bot personalizer...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <BotPersonalizerClient />
    </Suspense>
  );
}
