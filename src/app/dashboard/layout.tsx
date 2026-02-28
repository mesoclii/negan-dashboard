import Link from "next/link";
import { Suspense } from "react";
import { PossumSidebar } from "@/components/possum/PossumSidebar";
import { possum } from "@/styles/possumTheme";

function SidebarFallback() {
  return (
    <aside
      style={{
        width: 300,
        borderRight: `1px solid ${possum.divider}`,
        padding: "20px 18px",
      }}
    >
      <div
        style={{
          color: possum.red,
          textShadow: possum.glowSoft,
          fontWeight: 950,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontSize: 22,
        }}
      >
        POSSUM
      </div>
      <div
        style={{
          marginTop: 10,
          color: possum.soft,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          fontSize: 12,
          opacity: 0.9,
        }}
      >
        Control System
      </div>
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="possum-bg" style={{ minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Suspense fallback={<SidebarFallback />}>
          <PossumSidebar />
        </Suspense>

        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 22px",
              borderBottom: `1px solid ${possum.divider}`,
              minHeight: 76,
            }}
          >
            <div
              style={{
                fontWeight: 950,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontSize: 14,
                color: "#fff",
                textShadow: possum.glowSoft,
              }}
            >
              Possum Dashboard
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="possum-pill">System Online</span>

              <Link
                href="/"
                style={{
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${possum.border}`,
                  color: possum.soft,
                  fontWeight: 950,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontSize: 12,
                  boxShadow: "0 0 16px rgba(255,0,0,0.10)",
                }}
              >
                Exit
              </Link>
            </div>
          </header>

          <div style={{ padding: 22 }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
