"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  return pathname === baseHref || (baseHref !== "/dashboard" && pathname?.startsWith(`${baseHref}/`));
}

function shouldPrefetchNavRoutes() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean } | undefined;
  };
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 1) return false;
  return true;
}

export default function PossumSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isMasterOwner } = useDashboardSessionState();
  const topLinks = useMemo(() => getDashboardNavTopLinks(isMasterOwner), [isMasterOwner]);
  const sections = useMemo(() => getDashboardNavSections(isMasterOwner), [isMasterOwner]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const prefetchedHrefsRef = useRef<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleTopLinks = useMemo(
    () => topLinks.filter((item) => !normalizedQuery || `${item.label} ${item.href}`.toLowerCase().includes(normalizedQuery)),
    [topLinks, normalizedQuery]
  );
  const visibleSections = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) =>
              !normalizedQuery ||
              `${section.label} ${item.label} ${item.href}`.toLowerCase().includes(normalizedQuery)
          ),
        }))
        .filter((section) => section.items.length > 0),
    [sections, normalizedQuery]
  );

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
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const prefetchHref = useCallback((href: string) => {
    if (!shouldPrefetchNavRoutes()) {
      return;
    }
    const resolved = buildDashboardHref(href);
    if (!resolved || prefetchedHrefsRef.current.has(resolved)) {
      return;
    }
    prefetchedHrefsRef.current.add(resolved);
    router.prefetch(resolved);
  }, [router]);

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
        <div className="relative mt-3">
          <label htmlFor="dashboard-navigation-search" className="sr-only">
            Search dashboard pages
          </label>
          <input
            ref={searchInputRef}
            id="dashboard-navigation-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                if (searchQuery) {
                  setSearchQuery("");
                } else {
                  event.currentTarget.blur();
                }
              }
            }}
            placeholder="Find a dashboard page"
            className="w-full rounded-lg border border-red-900/50 bg-black/60 py-2 pl-3 pr-16 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-red-500/70 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear dashboard page search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Clear
            </button>
          ) : (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-700 px-1.5 py-1 text-[10px] font-semibold text-zinc-500">
              Ctrl K
            </span>
          )}
        </div>
        <div className="mt-3 space-y-1">
          {visibleTopLinks.map((item) => {
            const active = isItemActive(pathname, item.href);
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => navigateTo(item.href)}
                onMouseEnter={() => prefetchHref(item.href)}
                onFocus={() => prefetchHref(item.href)}
                className={`${itemClass(Boolean(active))} relative z-10 cursor-pointer`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <nav aria-label="Dashboard pages" className="space-y-4">
        {visibleSections.map((section) => {
          const defaultOpen = Boolean(section.defaultOpen || section.items.some((item) => isItemActive(pathname, item.href)));
          const open = normalizedQuery ? true : isSectionOpen(section.label, defaultOpen);
          const sectionId = `dashboard-navigation-${section.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
            <div key={section.label} className="rounded-lg border border-red-900/40 bg-black/25">
              <button
                type="button"
                onClick={() => toggleSection(section.label, defaultOpen)}
                aria-expanded={open}
                aria-controls={sectionId}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.18em] text-red-300/70"
              >
                <span>{section.label}</span>
                <span className="ml-auto mr-2 rounded-full bg-red-950/70 px-2 py-0.5 text-[10px] text-red-200/80">
                  {section.items.length}
                </span>
                <span>{open ? "-" : "+"}</span>
              </button>
              {open ? (
                <div id={sectionId} className="relative z-10 space-y-1 px-2 pb-2">
                  {section.items.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => navigateTo(item.href)}
                        onMouseEnter={() => prefetchHref(item.href)}
                        onFocus={() => prefetchHref(item.href)}
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
        {normalizedQuery && visibleSections.length === 0 && visibleTopLinks.length === 0 ? (
          <p role="status" className="rounded-lg border border-zinc-800 bg-black/30 px-3 py-4 text-sm text-zinc-400">
            No dashboard pages match “{searchQuery.trim()}”.
          </p>
        ) : null}
      </nav>
    </div>
  );
}
