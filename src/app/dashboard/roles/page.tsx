import { Suspense } from "react";
import RolesClient from "./RolesClient";


export default function Page() {
  return (
    <Suspense fallback={<div style={{ color: "#ff4444", padding: 16 }}>Loading roles...</div>}>
      <RolesClient />
    </Suspense>
  );
}
