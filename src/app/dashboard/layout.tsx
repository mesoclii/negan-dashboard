import type { ReactNode } from "react";
import Link from "next/link";
import PossumSidebar from "@/components/possum/PossumSidebar";
import DashboardAccessGate from "@/components/possum/DashboardAccessGate";
import GuildNameBootstrap from "@/components/possum/GuildNameBootstrap";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen possum-bg text-red-300">
      <div className="mx-auto flex min-h-screen max-w-[1780px]">
        <aside className="w-72 shrink-0 border-r possum-divider bg-black/55 p-4">
          <PossumSidebar />
        </aside>

        <main className="min-w-0 flex-1">
          <GuildNameBootstrap />
          <header className="sticky top-0 z-20 border-b possum-divider bg-black/75 backdrop-blur">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] possum-soft">Control Surface</p>
                <h1 className="text-base font-extrabold uppercase tracking-[0.12em] possum-red possum-glow-soft">Possum Dashboard</h1>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/guilds"
                  className="rounded-lg bg-black/40 px-3 py-2 text-sm font-black uppercase tracking-[0.08em] possum-red possum-btn"
                >
                  Change Guild
                </Link>
                <Link
                  href="/"
                  className="rounded-lg bg-black/40 px-3 py-2 text-sm font-black uppercase tracking-[0.08em] possum-red possum-btn"
                >
                  Exit
                </Link>
              </div>
            </div>
          </header>

          <section className="px-5 py-5">
            <DashboardAccessGate>{children}</DashboardAccessGate>
          </section>
        </main>
      </div>
    </div>
  );
}
