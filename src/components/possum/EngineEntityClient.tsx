"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type QuickLink = {
  href: string;
  label: string;
};

type EngineEntityClientProps = {
  title: string;
  description: string;
  runtimeId: string;
  commandId?: string;
  links?: QuickLink[];
  profile?: "generic" | "jed";
};

type GuildRole = { id: string; name: string; position?: number };
type GuildChannel = { id: string; name: string; type?: number | string };

type EntityConfig = {
  active: boolean;
  autoStart: boolean;
  mode: string;
  primaryChannelId: string;
  fallbackChannelId: string;
  logChannelId: string;
  notifyChannelId: string;
  allowRoleIds: string[];
  denyRoleIds: string[];
  mentionRoleIds: string[];
  cooldownSec: number;
  responseDeleteSec: number;
  timeoutMs: number;
  concurrency: number;
  retries: number;
  scheduleCron: string;
  activeWindowStart: string;
  activeWindowEnd: string;
  thresholdLow: number;
  thresholdHigh: number;
  rewardCoins: number;
  rewardXp: number;
  messageTemplate: string;
  embedColor: string;
  backgroundUrl: string;
  webhookUrl: string;
  assetTypes: string[];
  sourceChannelIds: string[];
  destinationChannelId: string;
  conversionQuality: string;
  duplicatePolicy: string;
  autoPublish: boolean;
  requireApproval: boolean;
  maxAssetSizeMb: number;
  maxAssetsPerRun: number;
  notes: string;
  updatedAt?: string;
};

const DEFAULT_CFG: EntityConfig = {
  active: true,
  autoStart: true,
  mode: "standard",
  primaryChannelId: "",
  fallbackChannelId: "",
  logChannelId: "",
  notifyChannelId: "",
  allowRoleIds: [],
  denyRoleIds: [],
  mentionRoleIds: [],
  cooldownSec: 0,
  responseDeleteSec: 0,
  timeoutMs: 3000,
  concurrency: 1,
  retries: 0,
  scheduleCron: "",
  activeWindowStart: "",
  activeWindowEnd: "",
  thresholdLow: 0,
  thresholdHigh: 100,
  rewardCoins: 0,
  rewardXp: 0,
  messageTemplate: "",
  embedColor: "#ff3131",
  backgroundUrl: "",
  webhookUrl: "",
  assetTypes: ["emoji", "sticker", "gif"],
  sourceChannelIds: [],
  destinationChannelId: "",
  conversionQuality: "high",
  duplicatePolicy: "skip",
  autoPublish: false,
  requireApproval: true,
  maxAssetSizeMb: 8,
  maxAssetsPerRun: 25,
  notes: "",
};

const JED_ASSET_TYPES = ["emoji", "sticker", "gif", "image", "video"];

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const guildId = (q || s).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return guildId;
}

function withGuild(href: string, guildId: string): string {
  if (!guildId) return href;
  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}guildId=${encodeURIComponent(guildId)}`;
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set((ids || []).map((v) => String(v || "").trim()).filter(Boolean)));
}

function toggleId(list: string[], id: string): string[] {
  const current = new Set(uniqueIds(list));
  if (current.has(id)) current.delete(id);
  else current.add(id);
  return Array.from(current);
}

function normalizeConfig(input: Partial<EntityConfig> | undefined): EntityConfig {
  return {
    ...DEFAULT_CFG,
    ...(input || {}),
    allowRoleIds: uniqueIds(Array.isArray(input?.allowRoleIds) ? input!.allowRoleIds : []),
    denyRoleIds: uniqueIds(Array.isArray(input?.denyRoleIds) ? input!.denyRoleIds : []),
    mentionRoleIds: uniqueIds(Array.isArray(input?.mentionRoleIds) ? input!.mentionRoleIds : []),
    sourceChannelIds: uniqueIds(Array.isArray(input?.sourceChannelIds) ? input!.sourceChannelIds : []),
    assetTypes: uniqueIds(Array.isArray(input?.assetTypes) ? input!.assetTypes : DEFAULT_CFG.assetTypes),
  };
}

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "10px 12px",
};

const panelStyle: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  background: "rgba(120,0,0,0.08)",
  padding: 12,
  marginTop: 12,
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  color: "#ffb5b5",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontSize: 13,
  fontWeight: 900,
};

export default function EngineEntityClient(props: EngineEntityClientProps) {
  const { title, description, runtimeId, commandId = "", links = [], profile = "generic" } = props;
  const [guildId] = useState<string>(() => getGuildId());
  const [guildName, setGuildName] = useState("");
  const [cfg, setCfg] = useState<EntityConfig>(DEFAULT_CFG);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const textChannels = useMemo(
    () => channels.filter((x) => Number(x?.type) === 0 || String(x?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, gdRes] = await Promise.all([
          fetch(
            `/api/setup/engine-entity-config?guildId=${encodeURIComponent(guildId)}&engineId=${encodeURIComponent(runtimeId)}`,
            { cache: "no-store" }
          ),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const c = await cfgRes.json().catch(() => ({}));
        const g = await gdRes.json().catch(() => ({}));
        setCfg(normalizeConfig(c?.config || {}));
        setRoles(Array.isArray(g?.roles) ? g.roles : []);
        setChannels(Array.isArray(g?.channels) ? g.channels : []);
        const nextName = String(g?.guild?.name || "").trim();
        if (nextName) {
          setGuildName(nextName);
          localStorage.setItem("activeGuildName", nextName);
        }
      } catch (e: any) {
        setMsg(e?.message || "Failed to load engine config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId, runtimeId]);

  async function saveEntityConfig() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      const r = await fetch("/api/setup/engine-entity-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, engineId: runtimeId, patch: cfg }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      setCfg(normalizeConfig(j?.config || cfg));
      setMsg("Engine settings saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ color: "#ffd0d0", maxWidth: 1180, padding: 16 }}>
      <h1 style={{ margin: 0, color: "#ff4f4f", letterSpacing: "0.10em", textTransform: "uppercase" }}>{title}</h1>
      <p style={{ marginTop: 10, color: "#ffabab" }}>{description}</p>
      <p style={{ marginTop: 0, color: "#ffbdbd" }}>
        Guild: <b>{guildName || (typeof window !== "undefined" ? localStorage.getItem("activeGuildName") : "") || guildId}</b>
      </p>

      {msg ? <div style={{ marginTop: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? (
        <div style={panelStyle}>Loading engine configuration...</div>
      ) : (
        <>
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Engine Status</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Active</label>
              <label><input type="checkbox" checked={cfg.autoStart} onChange={(e) => setCfg((p) => ({ ...p, autoStart: e.target.checked }))} /> Auto-start</label>
              <div>
                <div style={{ marginBottom: 6 }}>Mode</div>
                <input style={inputStyle} value={cfg.mode} onChange={(e) => setCfg((p) => ({ ...p, mode: e.target.value }))} />
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Routing</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Primary channel</div>
                <select style={inputStyle} value={cfg.primaryChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, primaryChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Fallback channel</div>
                <select style={inputStyle} value={cfg.fallbackChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, fallbackChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Log channel</div>
                <select style={inputStyle} value={cfg.logChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, logChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Notify channel</div>
                <select style={inputStyle} value={cfg.notifyChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, notifyChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Permissions</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Allow roles</div>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                  {roles.map((r) => (
                    <label key={`allow_${r.id}`} style={{ display: "block", marginBottom: 4 }}>
                      <input
                        type="checkbox"
                        checked={cfg.allowRoleIds.includes(r.id)}
                        onChange={() => setCfg((p) => ({ ...p, allowRoleIds: toggleId(p.allowRoleIds, r.id) }))}
                      />{" "}
                      @{r.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Deny roles</div>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                  {roles.map((r) => (
                    <label key={`deny_${r.id}`} style={{ display: "block", marginBottom: 4 }}>
                      <input
                        type="checkbox"
                        checked={cfg.denyRoleIds.includes(r.id)}
                        onChange={() => setCfg((p) => ({ ...p, denyRoleIds: toggleId(p.denyRoleIds, r.id) }))}
                      />{" "}
                      @{r.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Mention roles</div>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                  {roles.map((r) => (
                    <label key={`mention_${r.id}`} style={{ display: "block", marginBottom: 4 }}>
                      <input
                        type="checkbox"
                        checked={cfg.mentionRoleIds.includes(r.id)}
                        onChange={() => setCfg((p) => ({ ...p, mentionRoleIds: toggleId(p.mentionRoleIds, r.id) }))}
                      />{" "}
                      @{r.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Runtime Behavior</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
              <div><div style={{ marginBottom: 6 }}>Cooldown (sec)</div><input type="number" style={inputStyle} value={cfg.cooldownSec} onChange={(e) => setCfg((p) => ({ ...p, cooldownSec: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Response delete (sec)</div><input type="number" style={inputStyle} value={cfg.responseDeleteSec} onChange={(e) => setCfg((p) => ({ ...p, responseDeleteSec: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Timeout (ms)</div><input type="number" style={inputStyle} value={cfg.timeoutMs} onChange={(e) => setCfg((p) => ({ ...p, timeoutMs: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Concurrency</div><input type="number" style={inputStyle} value={cfg.concurrency} onChange={(e) => setCfg((p) => ({ ...p, concurrency: Number(e.target.value || 1) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Retries</div><input type="number" style={inputStyle} value={cfg.retries} onChange={(e) => setCfg((p) => ({ ...p, retries: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Schedule (cron)</div><input style={inputStyle} value={cfg.scheduleCron} onChange={(e) => setCfg((p) => ({ ...p, scheduleCron: e.target.value }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Window start</div><input style={inputStyle} value={cfg.activeWindowStart} onChange={(e) => setCfg((p) => ({ ...p, activeWindowStart: e.target.value }))} placeholder="08:00" /></div>
              <div><div style={{ marginBottom: 6 }}>Window end</div><input style={inputStyle} value={cfg.activeWindowEnd} onChange={(e) => setCfg((p) => ({ ...p, activeWindowEnd: e.target.value }))} placeholder="23:00" /></div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Thresholds / Rewards</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
              <div><div style={{ marginBottom: 6 }}>Low threshold</div><input type="number" style={inputStyle} value={cfg.thresholdLow} onChange={(e) => setCfg((p) => ({ ...p, thresholdLow: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>High threshold</div><input type="number" style={inputStyle} value={cfg.thresholdHigh} onChange={(e) => setCfg((p) => ({ ...p, thresholdHigh: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Reward coins</div><input type="number" style={inputStyle} value={cfg.rewardCoins} onChange={(e) => setCfg((p) => ({ ...p, rewardCoins: Number(e.target.value || 0) }))} /></div>
              <div><div style={{ marginBottom: 6 }}>Reward XP</div><input type="number" style={inputStyle} value={cfg.rewardXp} onChange={(e) => setCfg((p) => ({ ...p, rewardXp: Number(e.target.value || 0) }))} /></div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Messages / Branding</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Message template</div>
                <textarea style={{ ...inputStyle, minHeight: 110 }} value={cfg.messageTemplate} onChange={(e) => setCfg((p) => ({ ...p, messageTemplate: e.target.value }))} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
                <div><div style={{ marginBottom: 6 }}>Embed color</div><input style={inputStyle} value={cfg.embedColor} onChange={(e) => setCfg((p) => ({ ...p, embedColor: e.target.value }))} placeholder="#ff3131" /></div>
                <div><div style={{ marginBottom: 6 }}>Background URL</div><input style={inputStyle} value={cfg.backgroundUrl} onChange={(e) => setCfg((p) => ({ ...p, backgroundUrl: e.target.value }))} /></div>
                <div style={{ gridColumn: "1 / span 2" }}><div style={{ marginBottom: 6 }}>Webhook URL</div><input style={inputStyle} value={cfg.webhookUrl} onChange={(e) => setCfg((p) => ({ ...p, webhookUrl: e.target.value }))} /></div>
              </div>
            </div>
          </div>

          {profile === "jed" ? (
            <div style={panelStyle}>
              <div style={sectionTitleStyle}>JED Asset Pipeline</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ marginBottom: 6 }}>Asset types</div>
                  <div style={{ border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                    {JED_ASSET_TYPES.map((kind) => (
                      <label key={kind} style={{ marginRight: 12 }}>
                        <input
                          type="checkbox"
                          checked={cfg.assetTypes.includes(kind)}
                          onChange={() => setCfg((p) => ({ ...p, assetTypes: toggleId(p.assetTypes, kind) }))}
                        />{" "}
                        {kind}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>Source channels</div>
                  <div style={{ maxHeight: 140, overflowY: "auto", border: "1px solid #500000", borderRadius: 8, padding: 8 }}>
                    {textChannels.map((c) => (
                      <label key={`src_${c.id}`} style={{ display: "block", marginBottom: 4 }}>
                        <input
                          type="checkbox"
                          checked={cfg.sourceChannelIds.includes(c.id)}
                          onChange={() => setCfg((p) => ({ ...p, sourceChannelIds: toggleId(p.sourceChannelIds, c.id) }))}
                        />{" "}
                        #{c.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>Destination channel</div>
                  <select style={inputStyle} value={cfg.destinationChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, destinationChannelId: e.target.value }))}>
                    <option value="">Select channel</option>
                    {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>Conversion quality</div>
                  <select style={inputStyle} value={cfg.conversionQuality} onChange={(e) => setCfg((p) => ({ ...p, conversionQuality: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="original">Original</option>
                  </select>
                </div>
                <div>
                  <div style={{ marginBottom: 6 }}>Duplicate policy</div>
                  <select style={inputStyle} value={cfg.duplicatePolicy} onChange={(e) => setCfg((p) => ({ ...p, duplicatePolicy: e.target.value }))}>
                    <option value="skip">Skip duplicates</option>
                    <option value="replace">Replace existing</option>
                    <option value="keep_both">Keep both</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><div style={{ marginBottom: 6 }}>Max file size (MB)</div><input type="number" style={inputStyle} value={cfg.maxAssetSizeMb} onChange={(e) => setCfg((p) => ({ ...p, maxAssetSizeMb: Number(e.target.value || 0) }))} /></div>
                  <div><div style={{ marginBottom: 6 }}>Max assets/run</div><input type="number" style={inputStyle} value={cfg.maxAssetsPerRun} onChange={(e) => setCfg((p) => ({ ...p, maxAssetsPerRun: Number(e.target.value || 0) }))} /></div>
                </div>
                <div style={{ gridColumn: "1 / span 2" }}>
                  <label style={{ marginRight: 16 }}><input type="checkbox" checked={cfg.autoPublish} onChange={(e) => setCfg((p) => ({ ...p, autoPublish: e.target.checked }))} /> Auto publish</label>
                  <label><input type="checkbox" checked={cfg.requireApproval} onChange={(e) => setCfg((p) => ({ ...p, requireApproval: e.target.checked }))} /> Require approval</label>
                </div>
              </div>
            </div>
          ) : null}

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Notes</div>
            <textarea style={{ ...inputStyle, minHeight: 120 }} value={cfg.notes} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} />
          </div>

          <div style={{ ...panelStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ color: "#ffb5b5", fontSize: 12 }}>
              Updated: {cfg.updatedAt || "not saved"} {commandId ? `• command ${commandId}` : ""}
            </div>
            <button onClick={saveEntityConfig} disabled={saving} style={{ ...inputStyle, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Engine Settings"}
            </button>
          </div>
        </>
      )}

      {links.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 10, marginTop: 12 }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={withGuild(link.href, guildId)}
              style={{
                border: "1px solid #5f0000",
                borderRadius: 10,
                padding: 10,
                color: "#ffd0d0",
                textDecoration: "none",
                background: "#120000",
                fontWeight: 700,
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
