"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type?: number; parentId?: string | null };

type Block = {
  id?: string;
  kind: "CONDITION" | "ACTION";
  type: string;
  config: Record<string, any>;
  order: number;
  groupId?: string | null;
  groupOp?: string | null;
  negate?: boolean;
};

type Automation = {
  id: string;
  guildId: string;
  name: string;
  description?: string | null;
  status: string;
  enabled: boolean;
  triggerType: string;
  triggerConfig: Record<string, any>;
  runLimitPerMin: number;
  maxActions: number;
  timeoutMs: number;
  blocks: Block[];
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function getAutomationId(): string {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function box(): React.CSSProperties {
  return {
    border: "1px solid rgba(255,0,0,0.35)",
    borderRadius: 12,
    padding: 12,
    background: "rgba(40,0,0,0.25)"
  };
}

function input(): React.CSSProperties {
  return {
    width: "100%",
    background: "#090909",
    color: "#ffd9d9",
    border: "1px solid rgba(255,0,0,0.45)",
    borderRadius: 8,
    padding: "10px 12px"
  };
}

function newCondition(type: string): Block {
  switch (type) {
    case "CHANNEL_IS": return { kind: "CONDITION", type, config: { channelId: "" }, order: 0, groupId: "", groupOp: "AND", negate: false };
    case "CATEGORY_IS": return { kind: "CONDITION", type, config: { categoryId: "" }, order: 0, groupId: "", groupOp: "AND", negate: false };
    case "MESSAGE_CONTAINS": return { kind: "CONDITION", type, config: { value: "" }, order: 0, groupId: "", groupOp: "AND", negate: false };
    case "MESSAGE_STARTS_WITH": return { kind: "CONDITION", type, config: { value: "" }, order: 0, groupId: "", groupOp: "AND", negate: false };
    case "HAS_ROLE": return { kind: "CONDITION", type, config: { roleId: "" }, order: 0, groupId: "", groupOp: "AND", negate: false };
    case "LACKS_ROLE": return { kind: "CONDITION", type, config: { roleId: "" }, order: 0, groupId: "", groupOp: "AND", negate: false };
    case "RANDOM_CHANCE": return { kind: "CONDITION", type, config: { pct: 50 }, order: 0, groupId: "", groupOp: "AND", negate: false };
    default: return { kind: "CONDITION", type: "IS_STAFF", config: {}, order: 0, groupId: "", groupOp: "AND", negate: false };
  }
}

function newAction(type: string): Block {
  switch (type) {
    case "SEND_MESSAGE": return { kind: "ACTION", type, config: { channelId: "", content: "" }, order: 0 };
    case "REPLY": return { kind: "ACTION", type, config: { content: "", ephemeral: false }, order: 0 };
    case "DM": return { kind: "ACTION", type, config: { content: "" }, order: 0 };
    case "ADD_ROLE":
    case "REMOVE_ROLE": return { kind: "ACTION", type, config: { roleId: "" }, order: 0 };
    case "REACT": return { kind: "ACTION", type, config: { emoji: "" }, order: 0 };
    case "DELAY": return { kind: "ACTION", type, config: { ms: 500 }, order: 0 };
    case "CREATE_THREAD": return { kind: "ACTION", type, config: { name: "Thread", autoArchiveDuration: 60 }, order: 0 };
    default: return { kind: "ACTION", type: "REPLY", config: { content: "" }, order: 0 };
  }
}

export default function AutomationEditorPage() {
  const [guildId, setGuildId] = useState("");
  const [automationId, setAutomationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState(false);
  const [msg, setMsg] = useState("");

  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [status, setStatus] = useState("DRAFT");
  const [triggerType, setTriggerType] = useState("MESSAGE_CREATE");
  const [runLimitPerMin, setRunLimitPerMin] = useState(30);
  const [maxActions, setMaxActions] = useState(25);
  const [timeoutMs, setTimeoutMs] = useState(3000);

  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    setGuildId(getGuildId());
    setAutomationId(getAutomationId());
  }, []);

  useEffect(() => {
    if (guildId && automationId) loadAll(guildId, automationId);
  }, [guildId, automationId]);

  async function loadAll(gid: string, aid: string) {
    try {
      setLoading(true);
      setMsg("");

      const [aRes, gRes, lRes] = await Promise.all([
        fetch(`/api/bot/automation/${encodeURIComponent(aid)}`),
        fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(gid)}`),
        fetch(`/api/bot/automation/${encodeURIComponent(aid)}/logs`)
      ]);

      const automation: Automation = await aRes.json();
      const guildData = await gRes.json();
      const logData = await lRes.json();

      setName(String(automation?.name || ""));
      setDescription(String(automation?.description || ""));
      setEnabled(!!automation?.enabled);
      setStatus(String(automation?.status || "DRAFT"));
      setTriggerType(String(automation?.triggerType || "MESSAGE_CREATE"));
      setRunLimitPerMin(Number(automation?.runLimitPerMin || 30));
      setMaxActions(Number(automation?.maxActions || 25));
      setTimeoutMs(Number(automation?.timeoutMs || 3000));

      const nextBlocks = Array.isArray(automation?.blocks) ? automation.blocks : [];
      setBlocks(nextBlocks.map((b, i) => ({
        ...b,
        config: b?.config && typeof b.config === "object" ? b.config : {},
        order: Number(b?.order ?? i),
        groupId: b?.groupId || "",
        groupOp: b?.groupOp || "AND",
        negate: !!b?.negate
      })));

      setRoles(Array.isArray(guildData?.roles) ? guildData.roles : []);
      setChannels(Array.isArray(guildData?.channels) ? guildData.channels : []);
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load automation");
    } finally {
      setLoading(false);
    }
  }

  const roleOptions = useMemo(
    () => [...roles].sort((a, b) => Number(b.position || 0) - Number(a.position || 0)),
    [roles]
  );
  const textChannels = useMemo(
    () => channels.filter((c) => [0, 5, 11, 12].includes(Number(c.type ?? 0))),
    [channels]
  );
  const categories = useMemo(
    () => channels.filter((c) => Number(c.type ?? 0) === 4),
    [channels]
  );

  async function saveMeta() {
    try {
      setSavingMeta(true);
      setMsg("");
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        enabled,
        status,
        triggerType,
        runLimitPerMin: Number(runLimitPerMin || 30),
        maxActions: Number(maxActions || 25),
        timeoutMs: Number(timeoutMs || 3000)
      };

      const r = await fetch(`/api/bot/automation/${encodeURIComponent(automationId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Save meta failed");
      setMsg("Meta saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save meta failed");
    } finally {
      setSavingMeta(false);
    }
  }

  async function saveBlocks() {
    try {
      setSavingBlocks(true);
      setMsg("");

      const payload = {
        blocks: blocks.map((b, i) => ({
          kind: b.kind,
          type: b.type,
          config: b.config || {},
          order: i,
          groupId: b.kind === "CONDITION" ? (String(b.groupId || "").trim() || null) : null,
          groupOp: b.kind === "CONDITION" ? (String(b.groupOp || "AND").toUpperCase() === "OR" ? "OR" : "AND") : null,
          negate: b.kind === "CONDITION" ? !!b.negate : false
        }))
      };

      const r = await fetch(`/api/bot/automation/${encodeURIComponent(automationId)}/blocks`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Save blocks failed");
      setMsg("Blocks saved.");
      await loadAll(guildId, automationId);
    } catch (e: any) {
      setMsg(e?.message || "Save blocks failed");
    } finally {
      setSavingBlocks(false);
    }
  }

  async function publish() {
    try {
      setMsg("");
      const r = await fetch(`/api/bot/automation/${encodeURIComponent(automationId)}/publish`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Publish failed");
      setStatus(String(j?.status || "PUBLISHED"));
      setMsg("Published.");
    } catch (e: any) {
      setMsg(e?.message || "Publish failed");
    }
  }

  function move(index: number, delta: number) {
    const to = index + delta;
    if (to < 0 || to >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[to];
    copy[to] = temp;
    setBlocks(copy);
  }

  function updateBlock(index: number, next: Block) {
    const copy = [...blocks];
    copy[index] = next;
    setBlocks(copy);
  }

  if (!guildId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  if (!automationId) return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing automation id.</div>;

  return (
    <div style={{ color: "#ff5252", padding: 18 }}>
      <Link href={`/dashboard/automations?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#ff8f8f", textDecoration: "none" }}>
        Back to Automations
      </Link>

      <h1 style={{ margin: "8px 0 0", letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 20 }}>Automation Editor</h1>
      <div style={{ marginTop: 4 }}>Automation: {automationId}</div>
      {msg ? <div style={{ marginTop: 8, color: "#ffb3b3" }}>{msg}</div> : null}
      {loading ? <div style={{ marginTop: 10 }}>Loading…</div> : null}

      {!loading && (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div style={box()}>
            <div style={{ fontWeight: 900, letterSpacing: "0.08em", marginBottom: 8 }}>Meta</div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Automation name" style={input()} />
                <select value={triggerType} onChange={(e) => setTriggerType(e.target.value)} style={input()}>
                  <option value="MESSAGE_CREATE">MESSAGE_CREATE</option>
                  <option value="MEMBER_JOIN">MEMBER_JOIN</option>
                </select>
              </div>

              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" style={input()} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                <label><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> enabled</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} style={input()}>
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="DISABLED">DISABLED</option>
                </select>
                <input type="number" min={1} value={runLimitPerMin} onChange={(e) => setRunLimitPerMin(Number(e.target.value || 1))} placeholder="runLimitPerMin" style={input()} />
                <input type="number" min={1} value={maxActions} onChange={(e) => setMaxActions(Number(e.target.value || 1))} placeholder="maxActions" style={input()} />
              </div>

              <input type="number" min={500} value={timeoutMs} onChange={(e) => setTimeoutMs(Number(e.target.value || 500))} placeholder="timeoutMs" style={input()} />

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveMeta} disabled={savingMeta} style={{ ...input(), width: 140, cursor: "pointer", fontWeight: 900 }}>
                  {savingMeta ? "Saving..." : "Save Meta"}
                </button>
                <button onClick={publish} style={{ ...input(), width: 120, cursor: "pointer", fontWeight: 900 }}>
                  Publish
                </button>
              </div>
            </div>
          </div>

          <div style={box()}>
            <div style={{ fontWeight: 900, letterSpacing: "0.08em", marginBottom: 8 }}>Flow Blocks</div>

            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={box()}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>+ Condition</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {["CHANNEL_IS", "CATEGORY_IS", "MESSAGE_CONTAINS", "MESSAGE_STARTS_WITH", "HAS_ROLE", "LACKS_ROLE", "IS_STAFF", "RANDOM_CHANCE"].map((t) => (
                      <button key={t} onClick={() => setBlocks([...blocks, newCondition(t)])} style={{ ...input(), cursor: "pointer", fontWeight: 900 }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={box()}>
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>+ Action</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {["SEND_MESSAGE", "REPLY", "DM", "ADD_ROLE", "REMOVE_ROLE", "REACT", "DELAY", "CREATE_THREAD"].map((t) => (
                      <button key={t} onClick={() => setBlocks([...blocks, newAction(t)])} style={{ ...input(), cursor: "pointer", fontWeight: 900 }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {blocks.map((b, i) => (
                <div key={`${b.kind}-${b.type}-${i}`} style={box()}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontWeight: 900 }}>{b.kind}: {b.type}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => move(i, -1)} style={{ ...input(), width: 40, cursor: "pointer" }}>↑</button>
                      <button onClick={() => move(i, 1)} style={{ ...input(), width: 40, cursor: "pointer" }}>↓</button>
                      <button onClick={() => setBlocks(blocks.filter((_, idx) => idx !== i))} style={{ ...input(), width: 90, cursor: "pointer" }}>Remove</button>
                    </div>
                  </div>

                  {b.kind === "CONDITION" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                      <input
                        value={String(b.groupId || "")}
                        onChange={(e) => updateBlock(i, { ...b, groupId: e.target.value })}
                        placeholder="groupId (optional)"
                        style={input()}
                      />
                      <select
                        value={String(b.groupOp || "AND")}
                        onChange={(e) => updateBlock(i, { ...b, groupOp: e.target.value })}
                        style={input()}
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                      <label style={{ alignSelf: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!b.negate}
                          onChange={(e) => updateBlock(i, { ...b, negate: e.target.checked })}
                        /> negate
                      </label>
                    </div>
                  )}

                  {b.type === "CHANNEL_IS" && (
                    <select value={String(b.config.channelId || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, channelId: e.target.value } })} style={input()}>
                      <option value="">Select channel</option>
                      {textChannels.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                    </select>
                  )}

                  {b.type === "CATEGORY_IS" && (
                    <select value={String(b.config.categoryId || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, categoryId: e.target.value } })} style={input()}>
                      <option value="">Select category</option>
                      {categories.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                    </select>
                  )}

                  {(b.type === "MESSAGE_CONTAINS" || b.type === "MESSAGE_STARTS_WITH") && (
                    <input value={String(b.config.value || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, value: e.target.value } })} placeholder="Text value" style={input()} />
                  )}

                  {(b.type === "HAS_ROLE" || b.type === "LACKS_ROLE" || b.type === "ADD_ROLE" || b.type === "REMOVE_ROLE") && (
                    <select value={String(b.config.roleId || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, roleId: e.target.value } })} style={input()}>
                      <option value="">Select role</option>
                      {roleOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                  )}

                  {b.type === "RANDOM_CHANCE" && (
                    <input type="number" min={0} max={100} value={Number(b.config.pct || 0)} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, pct: Number(e.target.value || 0) } })} placeholder="Chance %" style={input()} />
                  )}

                  {b.type === "SEND_MESSAGE" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <select value={String(b.config.channelId || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, channelId: e.target.value } })} style={input()}>
                        <option value="">Select channel</option>
                        {textChannels.map((ch) => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                      </select>
                      <textarea rows={3} value={String(b.config.content || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, content: e.target.value } })} placeholder="Message content" style={input()} />
                    </div>
                  )}

                  {(b.type === "REPLY" || b.type === "DM") && (
                    <textarea rows={3} value={String(b.config.content || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, content: e.target.value } })} placeholder="Message content" style={input()} />
                  )}

                  {b.type === "REPLY" && (
                    <label style={{ display: "block", marginTop: 8 }}>
                      <input type="checkbox" checked={!!b.config.ephemeral} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, ephemeral: e.target.checked } })} /> ephemeral
                    </label>
                  )}

                  {b.type === "REACT" && (
                    <input value={String(b.config.emoji || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, emoji: e.target.value } })} placeholder="Emoji (ex: 😀)" style={input()} />
                  )}

                  {b.type === "DELAY" && (
                    <input type="number" min={0} value={Number(b.config.ms || 0)} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, ms: Number(e.target.value || 0) } })} placeholder="Delay (ms)" style={input()} />
                  )}

                  {b.type === "CREATE_THREAD" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 8 }}>
                      <input value={String(b.config.name || "")} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, name: e.target.value } })} placeholder="Thread name" style={input()} />
                      <select value={String(b.config.autoArchiveDuration || 60)} onChange={(e) => updateBlock(i, { ...b, config: { ...b.config, autoArchiveDuration: Number(e.target.value || 60) } })} style={input()}>
                        <option value="60">1 hour</option>
                        <option value="1440">24 hours</option>
                        <option value="4320">3 days</option>
                        <option value="10080">7 days</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}

              <button onClick={saveBlocks} disabled={savingBlocks} style={{ ...input(), cursor: "pointer", fontWeight: 900 }}>
                {savingBlocks ? "Saving..." : "Save Blocks"}
              </button>
            </div>
          </div>

          <details style={box()}>
            <summary style={{ cursor: "pointer", fontWeight: 900 }}>Execution Logs</summary>
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {logs.slice(0, 40).map((l) => (
                <div key={l.id} style={box()}>
                  <div style={{ fontWeight: 900 }}>{l.status}</div>
                  <div style={{ fontSize: 12 }}>{l.eventType} • {new Date(l.createdAt).toLocaleString()}</div>
                  {l.reason ? <div style={{ fontSize: 12 }}>reason: {l.reason}</div> : null}
                  {l.error ? <pre style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 12 }}>{String(l.error).slice(0, 350)}</pre> : null}
                </div>
              ))}
              {!logs.length ? <div>No logs yet.</div> : null}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
