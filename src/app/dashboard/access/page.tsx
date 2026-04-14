import { Suspense } from "react";
import AccessClient from "./AccessClient";


export default function AccessPage() {
  return (
    <Suspense fallback={<main style={{ padding: 16, color: "#ff8a8a" }}>Loading access center...</main>}>
      <AccessClient />
    </Suspense>
  );
}
