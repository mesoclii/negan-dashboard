"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import CatalogEngineConsole from "@/components/possum/CatalogEngineConsole";
import EngineInsights from "@/components/possum/EngineInsights";
import type { EngineDetails, EngineSummaryItem } from "@/components/possum/useGuildEngineEditor";
import { fetchDashboardConfig, fetchGuildData, fetchRuntimeEngine, resolveGuildContext } from "@/lib/liveRuntime";
import { buildDashboardHref } from "@/lib/dashboardContext";

type QuickLink = {
  href: string;
  label: string;
};

type CatalogEdge = {
  from?: string;
  to?: string;
  type?: string;
  why?: string;
  channel?: string;
};

type EngineField = {
  key?: string;
  type?: string;
  label?: string;
};

type EngineFieldGroup = {
  key?: string;
  label?: string;
  fields?: EngineField[];
};

type EngineFieldSchema = {
  title?: string;
  groups?: EngineFieldGroup[];
};

type LiveEngineSpec = {
  engineKey?: string;
  configKey?: string;
  displayName?: string;
  premiumRequired?: boolean;
  privateOnly?: boolean;
  hardDependencies?: {
    services?: string[];
    envVars?: string[];
    runtimeFlags?: string[];
  };
};

type RuntimePayload = {
  config?: Record<string, unknown>;
  summary?: EngineSummaryItem[];
  details?: EngineDetails;
};

type DashboardConfig = {
  features?: Record<string, boolean>;
};

type BindingIssue = {
  field: string;
  kind: "channel" | "role";
  missingIds: string[];
};

type SecurityEngineOperatorProps = {
  engineKey: string;
  title: string;
  description: string;
  links?: QuickLink[];
  featureFlagKey?: string;
};

const shell: CSSProperties = {
  color: "#ffd0d0",
  padding: 18,
  maxWidth: 1380,
};

const card: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 14,
  padding: 16,
  background: "linear-gradient(180deg, rgba(120,0,0,0.12), rgba(0,0,0,0.72))",
  marginTop: 12,
};

const pill: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 999,
  padding: "5px 10px",
  fontWeight: 900,
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const linkButton: CSSProperties = {
  border: "1px solid #7a0000",
  borderRadius: 8,
  padding: "6px 10px",
  color: "#ffd0d0",
  background: "#140000",
  fontWeight: 700,
  textDecoration: "none",
};

function humanize(value: string) {
  return String(value || "")
    .replace(/^security\./, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[._]/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAtPath(input: unknown, path: string[]) {
  return path.reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, input);
}

function runtimeEnabled(config: Record<string, unknown>) {
  if (config.enabled === false) return false;
  if (config.active === false) return false;
  return true;
}

function buildPillStyle(on: boolean, tone: "ok" | "warn" | "bad" = "ok"): CSSProperties {
  if (tone === "bad") {
    return {
      ...pill,
      border: "1px solid #8a2f2f",
      background: "rgba(120,0,0,.22)",
      color: "#ffaaaa",
    };
  }
  if (tone === "warn") {
    return {
      ...pill,
      border: "1px solid #a36f00",
      background: "rgba(120,70,0,.18)",
      color: "#ffd27a",
    };
  }
  return {
    ...pill,
    border: `1px solid ${on ? "#1f8a3f" : "#8a2f2f"}`,
    background: on ? "rgba(0,80,20,.24)" : "rgba(120,0,0,.18)",
    color: on ? "#98ffc0" : "#ffaaaa",
  };
}

function defaultFeatureFlagForEngine(engineKey: string) {
  if (engineKey === "lockdown") return "lockdownEnabled";
  if (engineKey === "raid") return "raidEnabled";
  if (engineKey === "onboarding") return "onboardingEnabled";
  if (engineKey === "verification") return "verificationEnabled";
  if (engineKey === "security.governance") return "governanceEnabled";
  if (engineKey === "preOnboarding") return "securityEnabled";
  if (engineKey.startsWith("security.")) return "securityEnabled";
  return "";
}

function collectBindingIssues(
  schema: EngineFieldSchema | null,
  config: Record<string, unknown>,
  channelIds: Set<string>,
  roleIds: Set<string>
) {
  const issues: BindingIssue[] = [];
  const groups = Array.isArray(schema?.groups) ? schema?.groups : [];
  for (const group of groups) {
    const fields = Array.isArray(group?.fields) ? group.fields : [];
    for (const field of fields) {
      const key = String(field?.key || "").trim();
      const type = String(field?.type || "").trim();
      if (!key) continue;
      const path = key.split(".").map((part) => part.trim()).filter(Boolean);
      if (!path.length) continue;

      const value = getAtPath(config, path);
      if (type === "channel-single") {
        const id = String(value || "").trim();
        if (id && !channelIds.has(id)) {
          issues.push({ field: String(field?.label || humanize(key)), kind: "channel", missingIds: [id] });
        }
      }
      if (type === "role-single") {
        const id = String(value || "").trim();
        if (id && !roleIds.has(id)) {
          issues.push({ field: String(field?.label || humanize(key)), kind: "role", missingIds: [id] });
        }
      }
      if (type === "channel-multi" && Array.isArray(value)) {
        const missingIds = value.map((entry) => String(entry || "").trim()).filter(Boolean).filter((id) => !channelIds.has(id));
        if (missingIds.length) {
          issues.push({ field: String(field?.label || humanize(key)), kind: "channel", missingIds });
        }
      }
      if (type === "role-multi" && Array.isArray(value)) {
        const missingIds = value.map((entry) => String(entry || "").trim()).filter(Boolean).filter((id) => !roleIds.has(id));
        if (missingIds.length) {
          issues.push({ field: String(field?.label || humanize(key)), kind: "role", missingIds });
        }
      }
    }
  }
  return issues;
}

async function loadCatalog(guildId: string, engineKey: string) {
  const res = await fetch(`/api/bot/engine-catalog?guildId=${encodeURIComponent(guildId)}&engine=${encodeURIComponent(engineKey)}`, {
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || "Failed to load engine catalog.");
  }

  const specs = Array.isArray(json?.engineSpecs) ? json.engineSpecs : [];
  const engineSpec =
    specs.find((entry) => String(entry?.engineKey || "").trim() === engineKey) ||
    specs.find((entry) => String(entry?.configKey || "").trim() === engineKey) ||
    null;

  return {
    spec: engineSpec as LiveEngineSpec | null,
    schema: (json?.fieldSchema && typeof json.fieldSchema === "object" ? json.fieldSchema : null) as EngineFieldSchema | null,
    edges: Array.isArray(json?.connections?.edges) ? (json.connections.edges as CatalogEdge[]) : [],
  };
}

export default function SecurityEngineOperator({
  engineKey,
  title,
  description,
  links = [],
  featureFlagKey,
}: SecurityEngineOperatorProps) {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({});
  const [runtime, setRuntime] = useState<RuntimePayload>({});
  const [fieldSchema, setFieldSchema] = useState<EngineFieldSchema | null>(null);
  const [spec, setSpec] = useState<LiveEngineSpec | null>(null);
  const [edges, setEdges] = useState<CatalogEdge[]>([]);
  const [channelIds, setChannelIds] = useState<Set<string>>(new Set());
  const [roleIds, setRoleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const context = resolveGuildContext();
    setGuildId(context.guildId);
    setGuildName(context.guildName);
  }, []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setMessage("");
        const [dashboard, runtimePayload, guildData, catalog] = await Promise.all([
          fetchDashboardConfig(guildId),
          fetchRuntimeEngine(guildId, engineKey),
          fetchGuildData(guildId),
          loadCatalog(guildId, engineKey),
        ]);

        if (cancelled) return;

        setDashboardConfig(dashboard as DashboardConfig);
        setRuntime({
          config: (runtimePayload?.config && typeof runtimePayload.config === "object" ? runtimePayload.config : {}) as Record<string, unknown>,
          summary: Array.isArray(runtimePayload?.summary) ? runtimePayload.summary : [],
          details: (runtimePayload?.details && typeof runtimePayload.details === "object" ? runtimePayload.details : {}) as EngineDetails,
        });
        setFieldSchema(catalog.schema);
        setSpec(catalog.spec);
        setEdges(catalog.edges);
        setChannelIds(new Set((guildData.channels || []).map((channel) => String(channel.id || "").trim()).filter(Boolean)));
        setRoleIds(new Set((guildData.roles || []).map((role) => String(role.id || "").trim()).filter(Boolean)));
      } catch (error) {
        if (cancelled) return;
        setMessage(error instanceof Error ? error.message : "Failed to load security engine.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [engineKey, guildId]);

  const config = useMemo(
    () => (runtime.config && typeof runtime.config === "object" ? runtime.config : {}) as Record<string, unknown>,
    [runtime.config]
  );

  const effectiveFeatureFlag = featureFlagKey || defaultFeatureFlagForEngine(engineKey);
  const featureGateValue = effectiveFeatureFlag ? dashboardConfig?.features?.[effectiveFeatureFlag] : undefined;
  const engineIsEnabled = runtimeEnabled(config);
  const bindingIssues = useMemo(
    () => collectBindingIssues(fieldSchema, config, channelIds, roleIds),
    [channelIds, config, fieldSchema, roleIds]
  );
  const relatedEdges = useMemo(
    () =>
      edges.filter((edge) => {
        const from = String(edge?.from || "");
        const to = String(edge?.to || "");
        return from === engineKey || to === engineKey;
      }),
    [edges, engineKey]
  );

  const dependencyRows = useMemo(() => {
    const services = Array.isArray(spec?.hardDependencies?.services) ? spec?.hardDependencies?.services : [];
    const envVars = Array.isArray(spec?.hardDependencies?.envVars) ? spec?.hardDependencies?.envVars : [];
    const runtimeFlags = Array.isArray(spec?.hardDependencies?.runtimeFlags) ? spec?.hardDependencies?.runtimeFlags : [];
    return [
      { label: "Services", value: services.length ? services.join(", ") : "None declared" },
      { label: "Env Vars", value: envVars.length ? envVars.join(", ") : "None declared" },
      { label: "Runtime Flags", value: runtimeFlags.length ? runtimeFlags.join(", ") : "None declared" },
    ];
  }, [spec?.hardDependencies?.envVars, spec?.hardDependencies?.runtimeFlags, spec?.hardDependencies?.services]);

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from `/guilds` first.</div>;
  }

  return (
    <section style={shell}>
      <div style={card}>
        <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Security Operator Surface</div>
        <div style={{ color: "#ff4545", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", marginTop: 8 }}>
          {title || spec?.displayName || humanize(engineKey)}
        </div>
        <div style={{ color: "#ffabab", marginTop: 8 }}>
          Guild: <b>{guildName || guildId}</b>
        </div>
        <div style={{ color: "#ffd0d0", lineHeight: 1.7, marginTop: 10 }}>{description}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          <span style={buildPillStyle(engineIsEnabled)}>{engineIsEnabled ? "Runtime On" : "Runtime Off"}</span>
          {effectiveFeatureFlag ? (
            <span style={buildPillStyle(Boolean(featureGateValue), featureGateValue === false ? "bad" : "ok")}>
              {effectiveFeatureFlag}: {featureGateValue === false ? "Blocked" : "Open"}
            </span>
          ) : (
            <span style={buildPillStyle(true, "warn")}>No Separate Feature Gate</span>
          )}
          <span style={buildPillStyle(bindingIssues.length === 0, bindingIssues.length ? "warn" : "ok")}>
            {bindingIssues.length ? `${bindingIssues.length} Missing Bindings` : "Bindings Clean"}
          </span>
          {spec?.premiumRequired ? <span style={buildPillStyle(true, "warn")}>Premium Engine</span> : null}
          {spec?.privateOnly ? <span style={buildPillStyle(true, "warn")}>Private Only</span> : null}
        </div>
        {links.length ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {links.map((item) => (
              <Link key={item.href} href={buildDashboardHref(item.href)} style={linkButton}>
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {message ? <div style={{ ...card, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading engine runtime...</div>
      ) : (
        <>
          <EngineInsights summary={Array.isArray(runtime.summary) ? runtime.summary : []} details={runtime.details || {}} />

          <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            <div>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Runtime State</div>
              <div style={{ color: "#ffdada", fontSize: 20, fontWeight: 900, marginTop: 6 }}>{engineIsEnabled ? "Enabled" : "Disabled"}</div>
              <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 6 }}>
                The live engine config currently resolves `{engineIsEnabled ? "on" : "off"}` for this guild.
              </div>
            </div>
            <div>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature Gate</div>
              <div style={{ color: "#ffdada", fontSize: 20, fontWeight: 900, marginTop: 6 }}>
                {effectiveFeatureFlag ? (featureGateValue === false ? "Blocked" : "Open") : "Inherited"}
              </div>
              <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 6 }}>
                {effectiveFeatureFlag ? `Dashboard feature flag: ${effectiveFeatureFlag}` : "This engine does not expose a separate dashboard feature gate."}
              </div>
            </div>
            <div>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dependency Surface</div>
              <div style={{ color: "#ffdada", fontSize: 20, fontWeight: 900, marginTop: 6 }}>
                {(spec?.hardDependencies?.services?.length || 0) +
                  (spec?.hardDependencies?.envVars?.length || 0) +
                  (spec?.hardDependencies?.runtimeFlags?.length || 0)}
              </div>
              <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 6 }}>
                Declared services, env vars, and runtime flags visible from the engine catalog.
              </div>
            </div>
            <div>
              <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Wiring Drift</div>
              <div style={{ color: "#ffdada", fontSize: 20, fontWeight: 900, marginTop: 6 }}>{bindingIssues.length}</div>
              <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 6 }}>
                Missing channels or roles referenced by the live engine config.
              </div>
            </div>
          </div>

          {bindingIssues.length ? (
            <div style={card}>
              <div style={{ color: "#ff5b5b", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>Missing Guild Bindings</div>
              <div style={{ color: "#ffbcbc", marginTop: 8, lineHeight: 1.6 }}>
                These saved role/channel references are not present in the selected guild anymore. The engine can save them, but the bot cannot route cleanly until you fix them.
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {bindingIssues.map((issue) => (
                  <div key={`${issue.kind}:${issue.field}`} style={{ border: "1px solid #4a0000", borderRadius: 10, padding: 12, background: "#100000" }}>
                    <div style={{ color: "#ffdada", fontWeight: 800 }}>{issue.field}</div>
                    <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 4 }}>
                      Missing {issue.kind} IDs: {issue.missingIds.join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {relatedEdges.length ? (
            <div style={card}>
              <div style={{ color: "#ff5b5b", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>Cross-Engine Connections</div>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {relatedEdges.map((edge, index) => (
                  <div key={`${edge.from || "?"}:${edge.to || "?"}:${index}`} style={{ border: "1px solid #4a0000", borderRadius: 10, padding: 12, background: "#100000" }}>
                    <div style={{ color: "#ffdada", fontWeight: 800 }}>
                      {humanize(String(edge.from || "unknown"))} {" -> "} {humanize(String(edge.to || "unknown"))}
                    </div>
                    <div style={{ color: "#ffbcbc", fontSize: 13, marginTop: 4 }}>
                      {edge.type ? `${edge.type}. ` : ""}{edge.why || "Live engine dependency."}
                    </div>
                    {edge.channel ? <div style={{ color: "#ff9c9c", fontSize: 12, marginTop: 4 }}>Channel: {edge.channel}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={card}>
            <div style={{ color: "#ff5b5b", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>Declared Dependencies</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 12 }}>
              {dependencyRows.map((row) => (
                <div key={row.label} style={{ border: "1px solid #4a0000", borderRadius: 10, padding: 12, background: "#100000" }}>
                  <div style={{ color: "#ff9c9c", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{row.label}</div>
                  <div style={{ color: "#ffdada", fontSize: 14, fontWeight: 700, marginTop: 6, lineHeight: 1.6 }}>{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          <CatalogEngineConsole
            engineKey={engineKey}
            title={title}
            description={description}
            links={links}
            showHeader={false}
            showInsights={false}
            surfaceVariant="security"
          />
        </>
      )}
    </section>
  );
}
