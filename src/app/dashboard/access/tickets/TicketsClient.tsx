"use client";



import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type: number };

type TicketsConfig = {
  active: boolean;
  panel: {
    channelId: string;
    categoryId: string;
    transcriptChannelId: string;
    staffRoleIds: string[];
    openButtonLabel: string;
    claimButtonLabel: string;
    closeButtonLabel: string;
    deleteButtonLabel: string;
    welcomeMessageTemplate: string;
    closeMessageTemplate: string;
    pingStaffOnOpen: boolean;
    lockOnClose: boolean;
    allowUserClose: boolean;
    requireReasonOnClose: boolean;
  };
  permissions: {
    canClaimRoles: string[];
    canCloseRoles: string[];
    canDeleteRoles: string[];
    canTranscriptRoles: string[];
    userCanAddMembers: boolean;
    userCanRenameTicket: boolean;
  };
  limits: {
    maxOpenPerUser: number;
    cooldownSeconds: number;
    staleAutoArchiveHours: number;
  };
  notes: string;
};

const DEFAULT_CONFIG: TicketsConfig = {
  active: true,
  panel: {
    channelId: "",
    categoryId: "",
    transcriptChannelId: "",
    staffRoleIds: [],
    openButtonLabel: "Open Ticket",
    claimButtonLabel: "Claim",
    closeButtonLabel: "Close",
    deleteButtonLabel: "Delete",
    welcomeMessageTemplate: "Ticket opened by <@{{userId}}>.",
    closeMessageTemplate: "Ticket closed by <@{{actorId}}>.",
    pingStaffOnOpen: true,
    lockOnClose: true,
    allowUserClose: true,
    requireReasonOnClose: false
  },
  permissions: {
    canClaimRoles: [],
    canCloseRoles: [],
    canDeleteRoles: [],
    canTranscriptRoles: [],
    userCanAddMembers: false,
    userCanRenameTicket: false
  },
  limits: {
    maxOpenPerUser: 1,
    cooldownSeconds: 0,
    staleAutoArchiveHours: 24
  },
  notes: ""
};

function cloneDefaults(): TicketsConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function mergeDeep<T>(base: T, incoming: unknown): T {
  if (!isObj(base) || !isObj(incoming)) return (incoming as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(incoming)) {
    const nextVal = (incoming as Record<string, unknown>)[key];
    if (nextVal === undefined) continue;
    const prevVal = out[key];
    if (isObj(prevVal) && isObj(nextVal)) out[key] = mergeDeep(prevVal, nextVal);
    else out[key] = nextVal;
  }
  return out as T;
}

function toggleId(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

function RolePicker({
  label,
  roles,
  selected,
  onChange
}: {
  label: string;
  roles: Role[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <details style={{ border: "1px solid #5f0000", borderRadius: 10, padding: 10, marginTop: 8 }}>
      <summary style={{ cursor: "pointer", color: "#ffd0d0" }}>{label} ({selected.length})</summary>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, maxHeight: 170, overflowY: "auto" }}>
        {roles.map((r) => {
          const on = selected.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(toggleId(selected, r.id))}
              style={{
                borderRadius: 999,
                border: on ? "1px solid #ff4a4a" : "1px solid #553030",
                padding: "6px 10px",
                background: on ? "rgba(255,0,0,0.20)" : "rgba(255,255,255,0.03)",
                color: on ? "#fff" : "#ffb7b7",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              {r.name}
            </button>
          );
        })}
      </div>
    </details>
  );
}

export default function TicketsPage() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [cfg, setCfg] = useState<TicketsConfig>(cloneDefaults());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
    const fromStore = localStorage.getItem("activeGuildId") || "";
    const gid = (fromUrl || fromStore).trim();
    if (gid) {
      localStorage.setItem("activeGuildId", gid);
      setGuildId(gid);
    }
  }, []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const [gRes, tRes] = await Promise.all([
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/setup/tickets-config?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const gData = await gRes.json();
        const tData = await tRes.json();

        setGuildName(gData?.guild?.name || guildId);
        setRoles((Array.isArray(gData?.roles) ? gData.roles : []).sort((a: Role, b: Role) => Number(b.position || 0) - Number(a.position || 0)));
        setChannels(Array.isArray(gData?.channels) ? gData.channels : []);
        setCfg(mergeDeep(cloneDefaults(), tData?.config || {}));
      } catch {
        setMsg("Failed to load tickets config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(() => channels.filter((c) => c.type === 0 || c.type === 5), [channels]);
  const categories = useMemo(() => channels.filter((c) => c.type === 4), [channels]);

  async function silentPost(url: string, body: any): Promise<boolean> {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) return false;
      const j = await r.json().catch(() => ({}));
      return j?.success !== false;
    } catch {
      return false;
    }
  }

  async function saveAll() {
    if (!guildId) return;
    try {
      setSaving(true);
      setMsg("");

      const saveRes = await fetch("/api/setup/tickets-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config: cfg })
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok || saveJson?.success === false) throw new Error(saveJson?.error || "Save failed");

      const synced = await silentPost("/api/bot/dashboard-config", {
        guildId,
        patch: {
          features: { ticketsEnabled: cfg.active }
        }
      });

      setMsg(
        synced
          ? "Saved Tickets. Support ticket config is isolated from onboarding/verification flows."
          : "Saved Tickets."
      );
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const card: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.08)", marginBottom: 12 };
  const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

  if (!guildId) {
    return (
      <div style={{ color: "#ffb3b3", padding: 20 }}>
        Missing guildId. Open from <Link href="/guilds" style={{ color: "#fff" }}>/guilds</Link>.
      </div>
    );
  }

  return (
    <div style={{ color: "#ff5c5c", padding: 18, maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Tickets Control</h1>
          <div style={{ color: "#ff9f9f", marginTop: 6 }}>Guild: {guildName || guildId}</div>
          <div style={{ color: "#ffb0b0", marginTop: 4, fontSize: 12 }}>Support tickets are isolated from onboarding ticket flows.</div>
        </div>
        <button
          onClick={saveAll}
          disabled={saving || loading}
          style={{ border: "1px solid #ff3636", background: "#190000", color: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}
        >
          {saving ? "Saving..." : "Save Tickets"}
        </button>
      </div>

      {msg ? <div style={{ marginTop: 10, color: "#ffd3d3" }}>{msg}</div> : null}

      {loading ? (
        <div style={{ marginTop: 16 }}>Loading...</div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Engine State</h3>
            <label>
              <input
                type="checkbox"
                checked={cfg.active}
                onChange={(e) => setCfg({ ...cfg, active: e.target.checked })}
                style={{ marginRight: 8 }}
              />
              Tickets Engine Enabled
            </label>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Panel + Routing</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div>Panel Channel</div>
                <select style={input} value={cfg.panel.channelId} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, channelId: e.target.value } })}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div>
                <div>Ticket Category</div>
                <select style={input} value={cfg.panel.categoryId} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, categoryId: e.target.value } })}>
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <div>Transcript Channel</div>
                <select style={input} value={cfg.panel.transcriptChannelId} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, transcriptChannelId: e.target.value } })}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
            </div>

            <RolePicker
              label="Staff Roles (can see/handle tickets)"
              roles={roles}
              selected={cfg.panel.staffRoleIds}
              onChange={(v) => setCfg({ ...cfg, panel: { ...cfg.panel, staffRoleIds: v } })}
            />
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Buttons + Templates</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <input style={input} value={cfg.panel.openButtonLabel} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, openButtonLabel: e.target.value } })} placeholder="Open label" />
              <input style={input} value={cfg.panel.claimButtonLabel} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, claimButtonLabel: e.target.value } })} placeholder="Claim label" />
              <input style={input} value={cfg.panel.closeButtonLabel} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, closeButtonLabel: e.target.value } })} placeholder="Close label" />
              <input style={input} value={cfg.panel.deleteButtonLabel} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, deleteButtonLabel: e.target.value } })} placeholder="Delete label" />
            </div>

            <div style={{ marginTop: 10 }}>Welcome Message Template</div>
            <textarea style={{ ...input, minHeight: 90 }} value={cfg.panel.welcomeMessageTemplate} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, welcomeMessageTemplate: e.target.value } })} />

            <div style={{ marginTop: 10 }}>Close Message Template</div>
            <textarea style={{ ...input, minHeight: 90 }} value={cfg.panel.closeMessageTemplate} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, closeMessageTemplate: e.target.value } })} />

            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={cfg.panel.pingStaffOnOpen} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, pingStaffOnOpen: e.target.checked } })} /> Ping staff on open</label>
              <label><input type="checkbox" checked={cfg.panel.lockOnClose} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, lockOnClose: e.target.checked } })} /> Lock on close</label>
              <label><input type="checkbox" checked={cfg.panel.allowUserClose} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, allowUserClose: e.target.checked } })} /> Users can close</label>
              <label><input type="checkbox" checked={cfg.panel.requireReasonOnClose} onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, requireReasonOnClose: e.target.checked } })} /> Require close reason</label>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Permissions</h3>
            <RolePicker label="Can Claim" roles={roles} selected={cfg.permissions.canClaimRoles} onChange={(v) => setCfg({ ...cfg, permissions: { ...cfg.permissions, canClaimRoles: v } })} />
            <RolePicker label="Can Close" roles={roles} selected={cfg.permissions.canCloseRoles} onChange={(v) => setCfg({ ...cfg, permissions: { ...cfg.permissions, canCloseRoles: v } })} />
            <RolePicker label="Can Delete" roles={roles} selected={cfg.permissions.canDeleteRoles} onChange={(v) => setCfg({ ...cfg, permissions: { ...cfg.permissions, canDeleteRoles: v } })} />
            <RolePicker label="Can Read Transcripts" roles={roles} selected={cfg.permissions.canTranscriptRoles} onChange={(v) => setCfg({ ...cfg, permissions: { ...cfg.permissions, canTranscriptRoles: v } })} />
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label><input type="checkbox" checked={cfg.permissions.userCanAddMembers} onChange={(e) => setCfg({ ...cfg, permissions: { ...cfg.permissions, userCanAddMembers: e.target.checked } })} /> Users can add members</label>
              <label><input type="checkbox" checked={cfg.permissions.userCanRenameTicket} onChange={(e) => setCfg({ ...cfg, permissions: { ...cfg.permissions, userCanRenameTicket: e.target.checked } })} /> Users can rename ticket</label>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Limits</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div>Max Open Per User</div>
                <input type="number" style={input} value={cfg.limits.maxOpenPerUser} onChange={(e) => setCfg({ ...cfg, limits: { ...cfg.limits, maxOpenPerUser: Math.max(1, Number(e.target.value || 1)) } })} />
              </div>
              <div>
                <div>Cooldown Seconds</div>
                <input type="number" style={input} value={cfg.limits.cooldownSeconds} onChange={(e) => setCfg({ ...cfg, limits: { ...cfg.limits, cooldownSeconds: Math.max(0, Number(e.target.value || 0)) } })} />
              </div>
              <div>
                <div>Auto Archive Hours</div>
                <input type="number" style={input} value={cfg.limits.staleAutoArchiveHours} onChange={(e) => setCfg({ ...cfg, limits: { ...cfg.limits, staleAutoArchiveHours: Math.max(1, Number(e.target.value || 1)) } })} />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>Notes</div>
            <textarea style={{ ...input, minHeight: 90 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <Link href={`/dashboard?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#fff" }}>Back to Dashboard</Link>
            <button
              onClick={saveAll}
              disabled={saving}
              style={{ border: "1px solid #ff3636", background: "#190000", color: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Tickets"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
