"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Automation = {
  id: string;
  guildId: string;
  name: string;
  description?: string | null;
  status: string;
  enabled: boolean;
  triggerType: string;
  runLimitPerMin: number;
  maxActions: number;
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
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

export default function AutomationsPage() {
  const [guildId, setGuildId] = useState("");
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);
  useEffect(() => {
    if (guildId) loadAutomations(guildId);
  }, [guildId]);

  async function loadAutomations(gid: string) {
    try {
      setLoading(true);
      setMsg("");
      const r = await fetch(`/api/bot/automations?guildId=${encodeURIComponent(gid)}`);
      const j = await r.json();
      setItems(Array.isArray(j) ? j : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load automations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function createAutomation() {
    if (!guildId) return;
    try {
      setCreating(true);
      setMsg("");

      const now = new Date();
      const payload = {
        guildId,
        name: `Automation ${now.toLocaleString()}`,
        description: "Created from Possum dashboard",
        status: "DRAFT",
        enabled: true,
        triggerType: "MESSAGE_CREATE",
        triggerConfig: { channels: [], keywords: [] },
        runLimitPerMin: 30,
        maxActions: 25,
        timeoutMs: 3000,
        createdBy: "dashboard"
      };

      const r = await fetch("/api/bot/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Create failed");

      const id = String(j?.id || "");
      if (id) {
        window.location.href = `/dashboard/automations/${id}?guildId=${encodeURIComponent(guildId)}`;
        return;
      }

      await loadAutomations(guildId);
      setMsg("Automation created.");
    } catch (e: any) {
      setMsg(e?.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function quickToggle(item: Automation) {
    try {
      const r = await fetch(`/api/bot/automation/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !item.enabled })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Toggle failed");
      await loadAutomations(guildId);
    } catch (e: any) {
      setMsg(e?.message || "Toggle failed");
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ff5252", padding: 18 }}>
      <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 20 }}>Automations</h1>
      <div style={{ marginTop: 4 }}>Guild: {guildId}</div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={createAutomation} disabled={creating} style={{ ...input(), width: 220, cursor: "pointer", fontWeight: 900 }}>
          {creating ? "Creating..." : "+ New Automation"}
        </button>
        <button onClick={() => loadAutomations(guildId)} style={{ ...input(), width: 130, cursor: "pointer", fontWeight: 900 }}>
          Refresh
        </button>
      </div>

      {msg ? <div style={{ marginTop: 10, color: "#ffb3b3" }}>{msg}</div> : null}
      {loading ? <div style={{ marginTop: 12 }}>Loading…</div> : null}

      {!loading && (
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {items.map((a) => (
            <div key={a.id} style={box()}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{a.name}</div>
                  <div style={{ fontSize: 13, color: "#ff9c9c" }}>{a.description || "No description"}</div>
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    Trigger: {a.triggerType} • Status: {a.status} • {a.enabled ? "Enabled" : "Disabled"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={() => quickToggle(a)} style={{ ...input(), width: 90, cursor: "pointer", fontWeight: 900 }}>
                    {a.enabled ? "On" : "Off"}
                  </button>
                  <Link href={`/dashboard/automations/${a.id}?guildId=${encodeURIComponent(guildId)}`} style={{ ...input(), width: 120, textDecoration: "none", textAlign: "center", fontWeight: 900 }}>
                    Open
                  </Link>
                </div>
              </div>
            </div>
          ))}
          {!items.length ? <div style={box()}>No automations yet.</div> : null}
        </div>
      )}
    </div>
  );
}
