"use client";

import Link from "next/link";
import { buildDashboardHref } from "@/lib/dashboardContext";
import { formatEngineList, getEngineSpec } from "@/lib/dashboardEngineCatalog";

const shell: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.34)",
  borderRadius: 14,
  background: "rgba(90,0,0,.12)",
  padding: 16,
  display: "grid",
  gap: 14,
};

const sectionTitle: React.CSSProperties = {
  color: "#ff9a9a",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 12px",
  borderRadius: 10,
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid rgba(255,0,0,.34)",
  color: "#ffdcdc",
  background: "#120707",
};

export default function EngineContractPanel({
  engineKey,
  title,
  intro,
  related = [],
}: {
  engineKey: string;
  title?: string;
  intro?: string;
  related?: Array<{ label: string; route: string; reason?: string }>;
}) {
  const spec = getEngineSpec(engineKey);
  if (!spec) return null;

  return (
    <section style={shell}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
        <div>
          <div style={sectionTitle}>Engine Contract</div>
          <div style={{ color: "#ff4545", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", marginTop: 6 }}>
            {title || spec.displayName}
          </div>
          <div style={{ color: "#ffd0d0", lineHeight: 1.7, marginTop: 8 }}>
            {intro || spec.decisionLogic}
          </div>
        </div>

        <div>
          <div style={sectionTitle}>Runtime</div>
          <div style={{ color: "#ffdede", lineHeight: 1.7, marginTop: 8 }}>
            <div>Category: {spec.category}</div>
            <div>Feature Flag: {spec.featureFlag || "None"}</div>
            <div>Config Key: {spec.configKey || "None"}</div>
            <div>Premium: {spec.premiumRequired ? "Yes" : "No"}</div>
            <div>Private Only: {spec.privateOnly ? "Yes" : "No"}</div>
            <div>Default Enabled: {spec.enabledByDefault ? "Yes" : "No"}</div>
            <div>Triggers: {formatEngineList(spec.triggerTypes)}</div>
          </div>
        </div>

        <div>
          <div style={sectionTitle}>Dependencies</div>
          <div style={{ color: "#ffdede", lineHeight: 1.7, marginTop: 8 }}>
            <div>Services: {formatEngineList(spec.hardDependencies.services || [])}</div>
            <div>Runtime Flags: {formatEngineList(spec.hardDependencies.runtimeFlags || [])}</div>
            <div>Env / Hard Inputs: {formatEngineList(spec.hardDependencies.envVars || [])}</div>
            <div>Persistence: {formatEngineList(spec.persistence)}</div>
          </div>
        </div>

        <div>
          <div style={sectionTitle}>Side Effects</div>
          <div style={{ color: "#ffdede", lineHeight: 1.7, marginTop: 8 }}>
            <div>Mutations: {formatEngineList(spec.stateMutations)}</div>
            <div>Outputs: {formatEngineList(spec.outputs)}</div>
            <div>Failure Modes: {formatEngineList(spec.failureModes)}</div>
          </div>
        </div>
      </div>

      {related.length ? (
        <div>
          <div style={sectionTitle}>Linked Surfaces</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {related.map((item) => (
              <Link key={`${engineKey}:${item.route}`} href={buildDashboardHref(item.route)} style={linkStyle}>
                {item.label}
              </Link>
            ))}
          </div>
          <div style={{ color: "#ffb7b7", lineHeight: 1.7, marginTop: 10 }}>
            {related
              .map((item) => `${item.label}: ${item.reason || "linked operational surface"}`)
              .join(" | ")}
          </div>
        </div>
      ) : null}
    </section>
  );
}
