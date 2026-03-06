"use client";

import type { CSSProperties } from "react";
import type { EngineDetails, EngineSummaryItem } from "./useGuildEngineEditor";

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 10,
};

const card: CSSProperties = {
  border: "1px solid #5a0000",
  borderRadius: 10,
  background: "#110000",
  padding: 12,
};

export default function EngineInsights({
  summary,
  details,
}: {
  summary: EngineSummaryItem[];
  details: EngineDetails;
}) {
  const detailEntries = Object.entries(details || {}).filter(([, value]) => {
    if (!value) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });

  return (
    <>
      {summary.length ? (
        <section style={grid}>
          {summary.map((item) => (
            <div key={`${item.label}_${item.value}`} style={card}>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {item.label}
              </div>
              <div style={{ color: "#ffdada", fontSize: 18, fontWeight: 800, marginTop: 6 }}>{item.value}</div>
            </div>
          ))}
        </section>
      ) : null}

      {detailEntries.map(([key, value]) => {
        const title = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        return (
          <section key={key} style={{ ...card, marginTop: 12 }}>
            <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
              {title}
            </div>
            {Array.isArray(value) ? (
              value.map((row, index) => (
                <div key={`${key}_${index}`} style={{ padding: "8px 0", borderTop: index ? "1px solid #330000" : "none" }}>
                  <div style={{ color: "#ffdcdc", fontWeight: 700 }}>
                    {row.rank ? `${row.rank}. ` : ""}
                    {row.name || row.title || `Item ${index + 1}`}
                  </div>
                  <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 2 }}>{row.value}</div>
                </div>
              ))
            ) : (
              <div>
                <div style={{ color: "#ffdcdc", fontWeight: 700 }}>{value.title}</div>
                <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 2 }}>{value.value}</div>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
