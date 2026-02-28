"use client";
import { useEffect, useState } from "react";

type Guild = { id: string; name: string };

export default function SetupPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [guildId, setGuildId] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/bot/guilds");
      const j = await r.json();
      const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
      setGuilds(list);
      const q = new URLSearchParams(window.location.search).get("guildId") || "";
      const s = localStorage.getItem("activeGuildId") || "";
      const gid = q || s || list[0]?.id || "";
      setGuildId(gid);
      if (gid) localStorage.setItem("activeGuildId", gid);
    })();
  }, []);

  async function run(url: string, label: string) {
    if (!guildId) return;
    setMsg(`${label}...`);
    const r = await fetch(`${url}?guildId=${encodeURIComponent(guildId)}`, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    setMsg(!r.ok || j?.success === false ? `${label} failed: ${j?.error || "error"}` : `${label} done`);
  }

  return (
    <div style={{ color: "#ff5252", padding: 24, maxWidth: 900 }}>
      <h1 style={{ letterSpacing: "0.12em", textTransform: "uppercase" }}>Guild Setup</h1>
      <p>Blank for all guilds. Saviors stays your baseline.</p>
      <select value={guildId} onChange={(e)=>{setGuildId(e.target.value);localStorage.setItem("activeGuildId",e.target.value);}}
        style={{ width:"100%", padding:10, borderRadius:8, border:"1px solid #7a0000", background:"#0d0d0d", color:"#ffd2d2" }}>
        <option value="">Select guild</option>
        {guilds.map(g => <option key={g.id} value={g.id}>{g.name} ({g.id})</option>)}
      </select>
      <div style={{ display:"flex", gap:10, marginTop:12, flexWrap:"wrap" }}>
        <button onClick={()=>run("/api/bot/reset-guild-blank","Reset blank")}>Reset This Guild To Blank</button>
        <button onClick={()=>run("/api/bot/apply-saviors-baseline","Apply Saviors baseline")}>Apply Saviors Baseline</button>
      </div>
      <p style={{ marginTop: 12 }}>{msg}</p>
    </div>
  );
}
