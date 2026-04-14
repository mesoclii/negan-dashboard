import { Suspense } from "react";
import TicketsClient from "./TicketsClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading tickets...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <TicketsClient />
    </Suspense>
  );
}
