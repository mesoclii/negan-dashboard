"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BlockKind = "CONDITION" | "ACTION";

type BlockDraft = {
  kind: BlockKind;
  type: string;
  configText: string;
  order: number;
  groupId: string;
  groupOp: string;
  negate: boolean;
  showAdvanced: boolean;
};

type AutomationDetail = {
  id: string;
  guildId: string;
  name: string;
  description?: string | null;
  status: string;
  enabled: boolean;
  triggerType: string;
  triggerConfig: unknown;
  blocks: Array<{
    id: string;
    kind: BlockKind;
    type: string;
    config: unknown;
    order: number;
    groupId?: string | null;
    groupOp?: string | null;
    negate?: boolean;
  }>;
};

type GuildRole = { id: string; name: string; position?: number };
type GuildChannel = { id: string; name: string; type?: number | string };

const CONDITION_TYPES = [
  { value: "MESSAGE_CONTAINS", label: "Message Contains" },
  { value: "MEMBER_JOIN", label: "Member Joins" },
  { value: "HAS_ROLE", label: "Member Has Role" },
  { value: "CHANNEL_IS", label: "Message In Channel" }
];

const ACTION_TYPES = [
  { value: "SEND_MESSAGE", label: "Send Message" },
  { value: "SEND_DM", label: "Send DM" },
  { value: "ADD_ROLE", label: "Add Role" },
  { value: "REMOVE_ROLE", label: "Remove Role" },
  { value: "LOG_EVENT", label: "Log Event" }
];

function pretty(v: unknown): string {
  try {
    return JSON.stringify(v ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function parseJson(text: string): { ok: true; value: Record<string, any> } | { ok: false } {
  try {
    const parsed = JSON.parse(text || "{}");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { ok: true, value: parsed as Record<string, any> };
    }
    return { ok: true, value: {} };
  } catch {
    return { ok: false };
  }
}

function parseCsv(input: string): string[] {
  return String(input || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toCsv(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return items.map((x) => String(x)).join(", ");
}

function getAutomationId(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  return String(parts[parts.length - 1] || "").trim();
}

function getGuildIdFromQuery(): string {
  if (typeof window === "undefined") return "";
  return String(new URLSearchParams(window.location.search).get("guildId") || "").trim();
}

function defaultConfigFor(type: string): Record<string, any> {
  switch (type) {
    case "MESSAGE_CONTAINS":
      return { keywords: [], channelId: "" };
    case "MEMBER_JOIN":
      return {};
    case "HAS_ROLE":
      return { roleId: "" };
    case "CHANNEL_IS":
      return { channelId: "" };
    case "SEND_MESSAGE":
      return { channelId: "", content: "" };
    case "SEND_DM":
      return { content: "" };
    case "ADD_ROLE":
      return { roleId: "" };
    case "REMOVE_ROLE":
      return { roleId: "" };
    case "LOG_EVENT":
      return { channelId: "", content: "" };
    default:
      return {};
  }
}

export default function AutomationEditorPage() {
  const [automationId, setAutomationId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState("");

  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [channels, setChannels] = useState<GuildChannel[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState("DRAFT");
  const [triggerType, setTriggerType] = useState("MESSAGE_CREATE");
  const [triggerConfigText, setTriggerConfigText] = useState("{}");
  const [blocks, setBlocks] = useState<BlockDraft[]>([]);

  useEffect(() => {
    setAutomationId(getAutomationId());
    setGuildId(getGuildIdFromQuery());
  }, []);

  async function loadGuildData(targetGuildId: string) {
    try {
      const r = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(targetGuildId)}`);
      const j = await r.json();
      const rls = Array.isArray(j?.roles) ? j.roles : [];
      const chs = Array.isArray(j?.channels) ? j.channels : [];
      setRoles(rls);
      setChannels(chs);
    } catch {
      setRoles([]);
      setChannels([]);
    }
  }

  useEffect(() => {
    if (!automationId) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const r = await fetch(`/api/bot/automation/${encodeURIComponent(automationId)}`);
        const j: AutomationDetail = await r.json();
        if (!r.ok) throw new Error((j as any)?.error || "Failed to load automation");

        setName(j.name || "");
        setDescription(j.description || "");
        setEnabled(!!j.enabled);
        setStatus(j.status || "DRAFT");
        setTriggerType(j.triggerType || "MESSAGE_CREATE");
        setTriggerConfigText(pretty(j.triggerConfig || {}));

        const effectiveGuildId = (guildId || j.guildId || "").trim();
        if (effectiveGuildId) {
          setGuildId(effectiveGuildId);
          await loadGuildData(effectiveGuildId);
        }

        const drafts: BlockDraft[] = (j.blocks || [])
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((b, i) => ({
            kind: b.kind || "ACTION",
            type: b.type || "",
            configText: pretty(b.config || {}),
            order: b.order ?? i,
            groupId: b.groupId || "",
            groupOp: b.groupOp || "",
            negate: !!b.negate,
            showAdvanced: false
          }));

        setBlocks(drafts);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load automation");
      } finally {
        setLoading(false);
      }
    })();
  }, [automationId]);

  function updateBlock(index: number, patch: Partial<BlockDraft>) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function setBlockConfig(index: number, config: Record<string, any>) {
    updateBlock(index, { configText: pretty(config) });
  }

  function patchBlockConfig(index: number, patch: Record<string, any>) {
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        const parsed = parseJson(b.configText);
        const current = parsed.ok ? { ...parsed.value } : {};
        const next = { ...current, ...patch };
        return { ...b, configText: pretty(next) };
      })
    );
  }

  function addBlock(kind: BlockKind, type?: string) {
    const chosenType = type || (kind === "CONDITION" ? "MESSAGE_CONTAINS" : "SEND_MESSAGE");
    setBlocks((prev) => [
      ...prev,
      {
        kind,
        type: chosenType,
        configText: pretty(defaultConfigFor(chosenType)),
        order: prev.length,
        groupId: "",
        groupOp: "",
        negate: false,
        showAdvanced: false
      }
    ]);
  }

  function removeBlock(index: number) {
    setBlocks((prev) =>
      prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, order: i }))
    );
  }

  function renderSimpleConfig(block: BlockDraft, index: number) {
    const parsed = parseJson(block.configText);
    if (!parsed.ok) {
      return <div style={{ color: "#ff9d9d", fontSize: 12 }}>Invalid JSON. Fix in Advanced JSON.</div>;
    }

    const cfg = parsed.value;

    if (block.type === "MESSAGE_CONTAINS") {
      return (
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input
            value={toCsv(cfg.keywords)}
            onChange={(e) => patchBlockConfig(index, { keywords: parseCsv(e.target.value) })}
            placeholder="keywords: hello, welcome, verify"
            style={inputStyle}
          />
          <select
            value={String(cfg.channelId || "")}
            onChange={(e) => patchBlockConfig(index, { channelId: e.target.value })}
            style={inputStyle}
          >
            <option value="">Any channel</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (block.type === "HAS_ROLE") {
      return (
        <select
          value={String(cfg.roleId || "")}
          onChange={(e) => patchBlockConfig(index, { roleId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      );
    }

    if (block.type === "CHANNEL_IS") {
      return (
        <select
          value={String(cfg.channelId || "")}
          onChange={(e) => patchBlockConfig(index, { channelId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Select channel</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              #{c.name}
            </option>
          ))}
        </select>
      );
    }

    if (block.type === "SEND_MESSAGE" || block.type === "LOG_EVENT") {
      return (
        <div style={{ display: "grid", gap: 8 }}>
          <select
            value={String(cfg.channelId || "")}
            onChange={(e) => patchBlockConfig(index, { channelId: e.target.value })}
            style={inputStyle}
          >
            <option value="">Select channel</option>
            {channels.map((c) => (
              <option key={c.id} value={c.id}>
                #{c.name}
              </option>
            ))}
          </select>
          <textarea
            rows={4}
            value={String(cfg.content || "")}
            onChange={(e) => patchBlockConfig(index, { content: e.target.value })}
            placeholder="message content"
            style={{ ...inputStyle, fontFamily: "inherit" }}
          />
        </div>
      );
    }

    if (block.type === "SEND_DM") {
      return (
        <textarea
          rows={4}
          value={String(cfg.content || "")}
          onChange={(e) => patchBlockConfig(index, { content: e.target.value })}
          placeholder="DM content"
          style={{ ...inputStyle, fontFamily: "inherit" }}
        />
      );
    }

    if (block.type === "ADD_ROLE" || block.type === "REMOVE_ROLE") {
      return (
        <select
          value={String(cfg.roleId || "")}
          onChange={(e) => patchBlockConfig(index, { roleId: e.target.value })}
          style={inputStyle}
        >
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      );
    }

    return <div style={{ color: "#ff9d9d", fontSize: 12 }}>No simple fields for this type. Use Advanced JSON.</div>;
  }

  async function saveMeta() {
    if (!automationId) return;
    setSavingMeta(true);
    setMsg("");

    try {
      const parsedTrigger = parseJson(triggerConfigText);
      if (!parsedTrigger.ok) throw new Error("Trigger config must be valid JSON");

      const payload = {
        name,
        description,
        enabled,
        status,
        triggerType,
        triggerConfig: parsedTrigger.value
      };

      const r = await fetch(`/api/bot/automation/${encodeURIComponent(automationId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Save meta failed");
      setMsg("Automation meta saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save meta failed");
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveBlocks() {
    if (!automationId) return;
    setSavingBlocks(true);
    setMsg("");

    try {
      const payloadBlocks = blocks.map((b, i) => {
        const parsed = parseJson(b.configText);
        if (!parsed.ok) throw new Error(`Block #${i + 1} has invalid JSON config`);
        return {
          kind: b.kind,
          type: b.type,
          config: parsed.value,
          order: i,
          groupId: b.groupId || null,
          groupOp: b.groupOp || null,
          negate: !!b.negate
        };
      });

      const r = await fetch(`/api/bot/automation/${encodeURIComponent(automationId)}/blocks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: payloadBlocks })
      });

      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Save blocks failed");
      setMsg("Automation blocks saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save blocks failed");
    } finally {
      setSavingBlocks(false);
    }
  }

  async function publish() {
    if (!automationId) return;
    setPublishing(true);
    setMsg("");
    try {
      const r = await fetch(`/api/bot/automation/${encodeURIComponent(automationId)}/publish`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Publish failed");
      setStatus(String(j?.status || "PUBLISHED"));
      setMsg("Automation published.");
    } catch (e: any) {
      setMsg(e?.message || "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  if (!automationId) return <div style={{ color: "#ff5a5a", padding: 24 }}>Missing automation id.</div>;

  return (
    <div style={{ color: "#ff6b6b", maxWidth: 1200 }}>
      <div style={{ marginBottom: 14 }}>
        <Link
          href={guildId ? `/dashboard/automations?guildId=${encodeURIComponent(guildId)}` : "/dashboard/automations"}
          style={{ color: "#ff9d9d", textDecoration: "none", letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          Back to Automations
        </Link>
      </div>

      <h1 style={h1Style}>Automation Editor</h1>
      <p style={{ marginTop: 0, opacity: 0.9 }}>Automation: {automationId}</p>
      {msg ? <p style={{ color: "#ffb3b3" }}>{msg}</p> : null}
      {loading ? <p>Loading...</p> : null}

      {!loading ? (
        <>
          <div style={cardStyle}>
            <h3 style={h3Style}>Meta</h3>

            <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="automation name" style={inputStyle} />
              <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} style={inputStyle}>
                <option value="MESSAGE_CREATE">Message Create</option>
                <option value="MEMBER_JOIN">Member Join</option>
                <option value="REACTION_ADD">Reaction Add</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>

            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="description"
              style={{ ...inputStyle, marginTop: 8, width: "100%" }}
            />

            <div style={{ display: "flex", gap: 16, marginTop: 10, alignItems: "center" }}>
              <label><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> enabled</label>
              <label>Status:
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle, marginLeft: 8, width: 160 }}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
              </label>
            </div>

            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: "pointer", color: "#ffbdbd" }}>Advanced Trigger JSON</summary>
              <textarea
                value={triggerConfigText}
                onChange={(e) => setTriggerConfigText(e.target.value)}
                rows={6}
                style={{ ...inputStyle, width: "100%", marginTop: 8, fontFamily: "monospace" }}
              />
            </details>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={saveMeta} disabled={savingMeta} style={btnPrimary}>
                {savingMeta ? "Saving..." : "Save Meta"}
              </button>
              <button onClick={publish} disabled={publishing} style={btnGhost}>
                {publishing ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={h3Style}>Flow Builder</h3>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <button onClick={() => addBlock("CONDITION", "MESSAGE_CONTAINS")} style={btnGhost}>+ Condition: Message Contains</button>
              <button onClick={() => addBlock("ACTION", "SEND_MESSAGE")} style={btnGhost}>+ Action: Send Message</button>
              <button onClick={() => addBlock("ACTION", "ADD_ROLE")} style={btnGhost}>+ Action: Add Role</button>
              <button onClick={() => addBlock("ACTION", "REMOVE_ROLE")} style={btnGhost}>+ Action: Remove Role</button>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {blocks.map((b, i) => (
                <div key={i} style={blockStyle}>
                  <div style={{ display: "grid", gridTemplateColumns: "170px 1fr 120px", gap: 8 }}>
                    <select
                      value={b.kind}
                      onChange={(e) => {
                        const nextKind = e.target.value as BlockKind;
                        const nextType = nextKind === "CONDITION" ? "MESSAGE_CONTAINS" : "SEND_MESSAGE";
                        updateBlock(i, {
                          kind: nextKind,
                          type: nextType,
                          configText: pretty(defaultConfigFor(nextType))
                        });
                      }}
                      style={inputStyle}
                    >
                      <option value="CONDITION">CONDITION</option>
                      <option value="ACTION">ACTION</option>
                    </select>

                    <select
                      value={b.type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        updateBlock(i, { type: nextType });
                        setBlockConfig(i, defaultConfigFor(nextType));
                      }}
                      style={inputStyle}
                    >
                      {(b.kind === "CONDITION" ? CONDITION_TYPES : ACTION_TYPES).map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>

                    <button onClick={() => removeBlock(i)} style={btnDanger}>Remove</button>
                  </div>

                  <div style={{ marginTop: 8 }}>{renderSimpleConfig(b, i)}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginTop: 8 }}>
                    <input
                      value={b.groupId}
                      onChange={(e) => updateBlock(i, { groupId: e.target.value })}
                      placeholder="groupId (optional)"
                      style={inputStyle}
                    />
                    <input
                      value={b.groupOp}
                      onChange={(e) => updateBlock(i, { groupOp: e.target.value })}
                      placeholder="groupOp (AND/OR optional)"
                      style={inputStyle}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={b.negate} onChange={(e) => updateBlock(i, { negate: e.target.checked })} />
                      negate
                    </label>
                  </div>

                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: "pointer", color: "#ffbdbd" }}>Advanced JSON</summary>
                    <textarea
                      value={b.configText}
                      onChange={(e) => updateBlock(i, { configText: e.target.value })}
                      rows={6}
                      style={{ ...inputStyle, width: "100%", marginTop: 8, fontFamily: "monospace" }}
                    />
                  </details>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12 }}>
              <button onClick={saveBlocks} disabled={savingBlocks} style={btnPrimary}>
                {savingBlocks ? "Saving..." : "Save Blocks"}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

const h1Style: React.CSSProperties = {
  color: "#ff3131",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  marginBottom: 6
};

const h3Style: React.CSSProperties = {
  margin: "0 0 10px",
  color: "#ffdcdc",
  letterSpacing: "0.10em",
  textTransform: "uppercase"
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #7b0000",
  borderRadius: 12,
  padding: 16,
  background: "rgba(100,0,0,0.08)",
  marginBottom: 14
};

const blockStyle: React.CSSProperties = {
  border: "1px solid #5e0000",
  borderRadius: 10,
  padding: 12,
  background: "rgba(255,0,0,0.05)"
};

const inputStyle: React.CSSProperties = {
  padding: 10,
  background: "#0d0d0d",
  border: "1px solid #7a0000",
  color: "#ffd2d2",
  borderRadius: 8,
  width: "100%"
};

const btnPrimary: React.CSSProperties = {
  border: "1px solid #9a0000",
  background: "rgba(255,0,0,0.15)",
  color: "#ffd6d6",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer"
};

const btnGhost: React.CSSProperties = {
  border: "1px solid #9a0000",
  background: "transparent",
  color: "#ffd6d6",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer"
};

const btnDanger: React.CSSProperties = {
  border: "1px solid #9a0000",
  background: "transparent",
  color: "#ffb0b0",
  padding: "8px 10px",
  borderRadius: 8,
  cursor: "pointer"
};
