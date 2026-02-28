"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const SAVE_BUTTON_RE = /\b(save|publish|apply|update)\b/i;

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
}

function getControlValue(el: Element): string {
  if (el instanceof HTMLInputElement) {
    if (el.type === "checkbox" || el.type === "radio") return el.checked ? "1" : "0";
    return el.value ?? "";
  }
  if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) return el.value ?? "";
  return "";
}

function findControls(scope: ParentNode = document): Element[] {
  return Array.from(scope.querySelectorAll("input,select,textarea")).filter((el) => {
    if (el instanceof HTMLInputElement) {
      if (el.type === "hidden" || el.disabled) return false;
    }
    if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      if (el.disabled) return false;
    }
    return true;
  });
}

function findSaveButtons(scope: ParentNode = document): HTMLButtonElement[] {
  return Array.from(scope.querySelectorAll("button")).filter((btn) => {
    if (!isVisible(btn)) return false;
    const text = (btn.textContent || "").trim();
    return SAVE_BUTTON_RE.test(text);
  });
}

function styleTogglePill(pill: HTMLSpanElement, on: boolean) {
  pill.textContent = on ? "ON" : "OFF";
  pill.style.marginLeft = "8px";
  pill.style.padding = "1px 6px";
  pill.style.borderRadius = "999px";
  pill.style.fontSize = "10px";
  pill.style.fontWeight = "900";
  pill.style.letterSpacing = "0.08em";
  pill.style.border = on ? "1px solid rgba(16,185,129,.65)" : "1px solid rgba(239,68,68,.65)";
  pill.style.color = on ? "#86efac" : "#fca5a5";
  pill.style.background = on ? "rgba(16,185,129,.12)" : "rgba(239,68,68,.12)";
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function DashboardSaveUX() {
  const pathname = usePathname();
  const baselineRef = useRef<Map<Element, string>>(new Map());
  const dirtyRef = useRef(0);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [dirtyCount, setDirtyCount] = useState(0);
  const [enabledToggles, setEnabledToggles] = useState(0);
  const [note, setNote] = useState("Ready");

  const refreshBaseline = () => {
    const map = new Map<Element, string>();
    const controls = findControls();
    for (const el of controls) map.set(el, getControlValue(el));
    baselineRef.current = map;
    dirtyRef.current = 0;
    setDirtyCount(0);
    setSaveState("idle");
  };

  const recalcDirty = () => {
    const controls = findControls();
    let dirty = 0;
    for (const el of controls) {
      const base = baselineRef.current.get(el);
      const now = getControlValue(el);
      if (base !== undefined && base !== now) dirty++;
    }
    dirtyRef.current = dirty;
    setDirtyCount(dirty);
    if (dirty > 0 && saveState !== "saving") setSaveState("dirty");
    if (dirty === 0 && saveState === "dirty") setSaveState("idle");
  };

  const decorateToggles = () => {
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
    let onCount = 0;

    for (const cb of checkboxes) {
      if (cb.checked) onCount++;

      if (!cb.dataset.possumPillId) {
        cb.dataset.possumPillId = Math.random().toString(36).slice(2);
      }

      const pillId = cb.dataset.possumPillId;
      if (!pillId) continue;

      const host = cb.closest("label") || cb.parentElement;
      if (!host) continue;

      let pill = host.querySelector(`span[data-possum-toggle-pill="${pillId}"]`) as HTMLSpanElement | null;
      if (!pill) {
        pill = document.createElement("span");
        pill.setAttribute("data-possum-toggle-pill", pillId);
        host.appendChild(pill);
      }
      styleTogglePill(pill, cb.checked);
    }

    setEnabledToggles(onCount);
  };

  const saveViaButtons = async (all: boolean) => {
    const buttons = findSaveButtons();
    if (!buttons.length) {
      setSaveState("error");
      setNote("No save button found on this page.");
      return;
    }

    setSaveState("saving");
    setNote(all ? "Saving all visible sections..." : "Saving section...");

    if (all) {
      for (const btn of buttons) {
        btn.click();
        await wait(220);
      }
    } else {
      buttons[0].click();
    }

    await wait(1300);
    recalcDirty();
    decorateToggles();

    if (dirtyRef.current > 0) {
      setSaveState("dirty");
      setNote("Some changes still unsaved.");
      return;
    }

    refreshBaseline();
    decorateToggles();
    setSaveState("saved");
    setNote("Saved.");
    await wait(1000);
    if (dirtyRef.current === 0) setSaveState("idle");
  };

  useEffect(() => {
    const init = () => {
      decorateToggles();
      refreshBaseline();
      recalcDirty();
      setNote("Ready");
    };

    const onInput = () => {
      decorateToggles();
      recalcDirty();
    };

    const mo = new MutationObserver(() => {
      decorateToggles();
      recalcDirty();
    });

    setTimeout(init, 80);

    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const statePill = (() => {
    if (saveState === "saving") return { text: "SAVING", bg: "rgba(59,130,246,.15)", color: "#93c5fd", border: "rgba(59,130,246,.55)" };
    if (saveState === "saved") return { text: "SAVED", bg: "rgba(16,185,129,.15)", color: "#86efac", border: "rgba(16,185,129,.55)" };
    if (saveState === "dirty") return { text: "UNSAVED", bg: "rgba(245,158,11,.15)", color: "#fcd34d", border: "rgba(245,158,11,.55)" };
    if (saveState === "error") return { text: "ERROR", bg: "rgba(239,68,68,.15)", color: "#fca5a5", border: "rgba(239,68,68,.55)" };
    return { text: "READY", bg: "rgba(148,163,184,.15)", color: "#cbd5e1", border: "rgba(148,163,184,.45)" };
  })();

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 90,
        width: 360,
        border: "1px solid rgba(255,0,0,0.28)",
        borderRadius: 12,
        background: "rgba(8,8,8,0.94)",
        boxShadow: "0 0 24px rgba(255,0,0,0.15)",
        padding: 12,
        backdropFilter: "blur(4px)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ color: "#fff", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
          Save Status
        </div>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: "0.08em",
            border: `1px solid ${statePill.border}`,
            background: statePill.bg,
            color: statePill.color
          }}
        >
          {statePill.text}
        </span>
      </div>

      <div style={{ color: "#fecaca", fontSize: 12, marginBottom: 8 }}>{note}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
        <div style={{ border: "1px solid rgba(255,0,0,0.22)", borderRadius: 8, padding: "6px 8px", color: "#fca5a5", fontSize: 12 }}>
          Dirty Fields: <b>{dirtyCount}</b>
        </div>
        <div style={{ border: "1px solid rgba(255,0,0,0.22)", borderRadius: 8, padding: "6px 8px", color: "#86efac", fontSize: 12 }}>
          Toggles ON: <b>{enabledToggles}</b>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => saveViaButtons(false)}
          style={{
            flex: 1,
            cursor: "pointer",
            border: "1px solid rgba(255,0,0,0.5)",
            borderRadius: 8,
            background: "rgba(255,0,0,0.08)",
            color: "#fecaca",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 10px",
            fontSize: 11
          }}
        >
          Save Section
        </button>

        <button
          onClick={() => saveViaButtons(true)}
          style={{
            flex: 1,
            cursor: "pointer",
            border: "1px solid rgba(255,0,0,0.75)",
            borderRadius: 8,
            background: "rgba(255,0,0,0.18)",
            color: "#fff",
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 10px",
            fontSize: 11
          }}
        >
          Save All
        </button>
      </div>
    </div>
  );
}
