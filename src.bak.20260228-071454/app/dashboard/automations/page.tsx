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
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const p = new URLSearchParams(window.location.search);
  const fromUrl = String(p.get("guildId") || "").trim();
  const fromStore = String(localStorage.getItem("activeGuildId") || "").trim();
  const guildId = fromUrl || fromStore || "";
  if (guildId) {
    localStorage.setItem("activeGuildId", guildId);
    if (!fromUrl) {
      p.set("guildId", guildId);
      window.history.replaceState({}, "", `${window.location.pathname}?${p.toString()}`);
    }
  }
  return guildId;
}

export default function AutomationsPage() {
  const [guildId, setGuildId] = useState("");
  const [items, setItems] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function load(targetGuildId: string) {
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch(`/api/bot/automations?guildId=${encodeURIComponent(targetGuildId)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Failed to load automations");
      setItems(Array.isArray(j) ? j : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load automations");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const gid = getGuildId();
    setGuildId(gid);
    if (gid) load(gid);
    else setLoading(false);
  }, []);

  async function createAutomation() {
    if (!guildId) return;
    setMsg("");
    try {
      const payload = {
        guildId,
        name: `Automation ${new Date().toLocaleString()}`,
        description: "Created from Possum dashboard",
        triggerType: "MESSAGE_CREATE",
        triggerConfig: { channels: [], keywords: [] },
        createdBy: "dashboard"
      };

      const r = await fetch("/api/bot/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Create failed");
      await load(guildId);
      setMsg("Automation created.");
    } catch (e: any) {
      setMsg(e?.message || "Create failed");
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff5a5a", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ff6b6b", maxWidth: 1100 }}>
      <h1 style={{ color: "#ff3131", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>
        Automations
      </h1>
      <p style={{ marginTop: 0, opacity: 0.9 }}>Guild: {guildId}</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          onClick={createAutomation}
          style={{
            border: "1px solid #9a0000",
            background: "rgba(255,0,0,0.15)",
            color: "#ffd6d6",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          New Automation
        </button>

        <button
          onClick={() => load(guildId)}
          style={{
            border: "1px solid #6a0000",
            background: "transparent",
            color: "#ff9d9d",
            padding: "10px 14px",
            borderRadius: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer"
          }}
        >
          Refresh
        </button>
      </div>

      {msg ? <p style={{ color: "#ff9f9f" }}>{msg}</p> : null}
      {loading ? <p>Loading...</p> : null}

      {!loading && items.length === 0 ? (
        <div style={{ border: "1px solid #5a0000", borderRadius: 12, padding: 16, background: "rgba(255,0,0,0.06)" }}>
          No automations yet.
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid #7b0000",
              borderRadius: 12,
              padding: 14,
              background: "rgba(100,0,0,0.08)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 900, color: "#ffe5e5", letterSpacing: "0.06em" }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "#ff9d9d" }}>
                  {item.status} • {item.enabled ? "ENABLED" : "DISABLED"}
                </div>
              </div>

              <Link
                href={`/dashboard/automations/${encodeURIComponent(item.id)}?guildId=${encodeURIComponent(guildId)}`}
                style={{
                  border: "1px solid #9a0000",
                  background: "rgba(255,0,0,0.15)",
                  color: "#fff1f1",
                  padding: "8px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase"
                }}
              >
                Open Editor
              </Link>
            </div>

            {item.description ? (
              <div style={{ marginTop: 8, color: "#ffc0c0", fontSize: 13 }}>{item.description}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
