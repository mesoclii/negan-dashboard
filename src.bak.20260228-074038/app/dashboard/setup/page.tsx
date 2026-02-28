"use client";

import { useEffect, useState } from "react";

type Guild = { id: string; name: string };

export default function SetupPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/bot/guilds");
      const j = await r.json();
      const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
      setGuilds(list);

      const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("guildId") || "" : "";
      const s = typeof window !== "undefined" ? localStorage.getItem("activeGuildId") || "" : "";
      const gid = q || s || list[0]?.id || "";
      if (gid) {
        setGuildId(gid);
        if (typeof window !== "undefined") localStorage.setItem("activeGuildId", gid);
      }
    })();
  }, []);

  async function run(url: string, label: string) {
    if (!guildId) return;
    setBusy(label);
    setMsg("");
    try {
      const r = await fetch(`${url}?guildId=${encodeURIComponent(guildId)}`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Failed");
      setMsg(`${label}: done`);
    } catch (e: any) {
      setMsg(`${label}: ${e?.message || "failed"}`);
    } finally {
      setBusy("");
    }
  }

  return (
    <div style={{ color: "#ff5252", maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h1 style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Guild Setup</h1>
      <p>Blank for all guilds. Saviors can stay preconfigured.</p>

      <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
        <select
          value={guildId}
          onChange={(e) => {
            const v = e.target.value;
            setGuildId(v);
            if (typeof window !== "undefined") localStorage.setItem("activeGuildId", v);
          }}
          style={{ padding: 10, background: "#0d0d0d", color: "#ffd2d2", border: "1px solid #7a0000", borderRadius: 8 }}
        >
          <option value="">Select guild</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => run("/api/bot/reset-guild-blank", "Reset to blank")}
            disabled={!guildId || !!busy}
            style={{ padding: "10px 14px", border: "1px solid #7a0000", background: "#1a0000", color: "#ff8080", borderRadius: 8 }}
          >
            {busy === "Reset to blank" ? "Working..." : "Reset This Guild To Blank"}
          </button>

          <button
            onClick={() => run("/api/bot/apply-saviors-baseline", "Apply Saviors baseline")}
            disabled={!guildId || !!busy}
            style={{ padding: "10px 14px", border: "1px solid #7a0000", background: "#1a0000", color: "#ff8080", borderRadius: 8 }}
          >
            {busy === "Apply Saviors baseline" ? "Working..." : "Apply Saviors Baseline"}
          </button>

          <a href={guildId ? `/dashboard?guildId=${encodeURIComponent(guildId)}` : "/dashboard"} style={{ padding: "10px 14px", border: "1px solid #7a0000", color: "#ff8080", textDecoration: "none", borderRadius: 8 }}>
            Open Dashboard
          </a>
        </div>
      </div>

      {msg ? <p>{msg}</p> : null}
    </div>
  );
}
