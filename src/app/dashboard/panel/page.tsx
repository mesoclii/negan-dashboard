"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PanelRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams?.toString() || "");
    const query = next.toString();
    router.replace(query ? `/dashboard/panels?${query}` : "/dashboard/panels");
  }, [router, searchParams]);

  return (
    <div style={{ color: "#ffd0d0", padding: 18 }}>
      Redirecting to the panel hub...
    </div>
  );
}
