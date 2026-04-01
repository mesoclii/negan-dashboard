"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { buildDashboardHref } from "@/lib/dashboardContext";
import { useDashboardSessionState } from "@/components/possum/useDashboardSessionState";
import { getDashboardNavSections, getDashboardNavTopLinks } from "@/lib/dashboard/navigation";

function itemClass(active: boolean): string {
  return active
    ? "block w-full rounded-md border border-red-500/60 bg-red-900/20 px-3 py-2 text-left text-sm font-extrabold uppercase tracking-[0.05em] text-red-200 possum-glow-soft"
    : "block w-full rounded-md border border-transparent px-3 py-2 text-left text-sm font-bold uppercase tracking-[0.04em] text-red-300/85 hover:border-red-500/40 hover:bg-red-950/40 hover:text-red-200";
}

function isItemActive(pathname: string | null, href: string) {
  const baseHref = href.split("?")[0].split("#")[0];
  return pathname === baseHref || pathname?.startsWith(`${baseHref}/`);
}

export default function PossumSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMasterOwner } = useDashboardSessionState();
  const topLinks = useMemo(() => getDashboardNavTopLinks(isMasterOwner), [isMasterOwner]);
  const sections = useMemo(() => getDashboardNavSections(isMasterOwner), [isMasterOwner]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  function isSectionOpen(label: string, defaultOpen: boolean) {
    return typeof openSections[label] === "boolean" ? openSections[label] : defaultOpen;
  }

  function toggleSection(label: string, defaultOpen: boolean) {
    setOpenSections((prev) => ({ ...prev, [label]: !isSectionOpen(label, defaultOpen) }));
  }

  function navigateTo(href: string) {
    router.push(buildDashboardHref(href));
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hrefs = [
      "/dashboard",
      ...topLinks.map((item) => item.href),
      ...sections.flatMap((section) => section.items.map((item) => item.href)),
    ];
    const uniqueHrefs = [...new Set(hrefs.map((href) => buildDashboardHref(href)))];
    const prefetchAll = () => {
      uniqueHrefs.forEach((href) => {
        router.prefetch(href);
      });
    };
    const withIdle = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (typeof withIdle.requestIdleCallback === "function") {
      const handle = withIdle.requestIdleCallback(prefetchAll, { timeout: 1200 });
      return () => withIdle.cancelIdleCallback?.(handle);
    }
    const timeout = window.setTimeout(prefetchAll, 150);
    return () => window.clearTimeout(timeout);
  }, [router, sections, topLinks]);

  return (
    <div className="rounded-xl border possum-divider bg-black/55 p-4 possum-border">
      <div className="mb-4 border-b possum-divider pb-3">
        <p className="text-[11px] uppercase tracking-[0.24em] possum-soft">Possum Bot</p>
        <button
          type="button"
          onClick={() => navigateTo("/dashboard")}
          className="mt-1 block text-left text-lg font-black uppercase tracking-[0.08em] possum-red possum-glow-soft hover:text-red-200"
        >
          Dashboard
        </button>
        <div className="mt-3 space-y-1">
          {topLinks.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href)}
                className={`${itemClass(Boolean(active))} relative z-10 cursor-pointer`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <nav className="space-y-4">
        {sections.map((section) => {
          const defaultOpen = Boolean(section.defaultOpen || section.items.some((item) => isItemActive(pathname, item.href)));
          const open = isSectionOpen(section.label, defaultOpen);
          return (
            <div key={section.label} className="rounded-lg border border-red-900/40 bg-black/25">
              <button
                type="button"
                onClick={() => toggleSection(section.label, defaultOpen)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] text-red-300/70"
              >
                {section.label}
                <span>{open ? "-" : "+"}</span>
              </button>
              {open ? (
                <div className="relative z-10 space-y-1 px-2 pb-2">
                  {section.items.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigateTo(item.href)}
                        className={`${itemClass(Boolean(active))} relative z-10 cursor-pointer`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
