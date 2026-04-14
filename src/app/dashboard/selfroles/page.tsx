import { Suspense } from "react";
import SelfrolesClient from "../access/selfroles/SelfrolesClient";


function Loading() {
  return <div style={{ color: "#ff4444", padding: 16 }}>Loading selfroles...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SelfrolesClient />
    </Suspense>
  );
}
