"use client";

import { useCallback, useEffect, useState } from "react";

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const g = (q || s).trim();
  if (g) localStorage.setItem("activeGuildId", g);
  return g;
}

export default function BackupsPage() {
  const [guildId] = useState(() => getGuildId());
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [backupText, setBackupText] = useState("");
  const [engineBackupText, setEngineBackupText] = useState("");
  const [engineFilter, setEngineFilter] = useState("");
  const [engineKeys, setEngineKeys] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const loadSnapshots = useCallback(async () => {
    const r = await fetch("/api/system/snapshots");
    const j = await r.json();
    setSnapshots(Array.isArray(j?.snapshots) ? j.snapshots : []);
  }, []);

  const loadEngineCatalog = useCallback(async () => {
    if (!guildId) return;
    const r = await fetch(`/api/bot/engine-catalog?guildId=${guildId}`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    setEngineKeys(Array.isArray(j?.engineKeys) ? j.engineKeys : []);
  }, [guildId]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      loadSnapshots().catch(() => {});
      loadEngineCatalog().catch(() => {});
    }, 0);
    return () => window.clearTimeout(handle);
  }, [loadEngineCatalog, loadSnapshots]);

  async function createSnapshot() {
    const r = await fetch("/api/system/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, note: "manual-ui-snapshot" })
    });
    const j = await r.json();
    setMsg(j?.success ? "Snapshot created." : j?.error || "Snapshot failed.");
    await loadSnapshots();
  }

  async function exportConfig() {
    const r = await fetch(`/api/system/config-backup?guildId=${guildId}`);
    const j = await r.json();
    if (!j?.success) {
      setMsg(j?.error || "Export failed.");
      return;
    }
    setBackupText(JSON.stringify(j.backup, null, 2));
    setMsg("Config exported.");
  }

  async function importConfig(mode: "merge" | "replace") {
    let payload: any;
    try {
      payload = JSON.parse(backupText || "{}");
    } catch {
      setMsg("Backup JSON is invalid.");
      return;
    }
    const r = await fetch("/api/system/config-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, mode, payload })
    });
    const j = await r.json();
    setMsg(j?.success ? `Import complete (${mode}).` : j?.error || "Import failed.");
  }

  async function exportEngineConfig() {
    if (!guildId) return;
    const query = new URLSearchParams({ guildId });
    if (engineFilter) query.set("engine", engineFilter);
    const r = await fetch(`/api/bot/engine-backup?${query.toString()}`, { cache: "no-store" });
    const j = await r.json();
    if (!j?.success) {
      setMsg(j?.error || "Engine export failed.");
      return;
    }
    setEngineBackupText(JSON.stringify(j.backup, null, 2));
    if (Array.isArray(j?.backup?.engines)) {
      setEngineKeys(j.backup.engines);
    }
    setMsg(engineFilter ? `Exported ${engineFilter} engine config.` : "Exported live bot engine config.");
  }

  async function importEngineConfig(mode: "merge" | "replace") {
    let payload: any;
    try {
      payload = JSON.parse(engineBackupText || "{}");
    } catch {
      setMsg("Engine backup JSON is invalid.");
      return;
    }
    const r = await fetch("/api/bot/engine-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, mode, payload }),
    });
    const j = await r.json();
    setMsg(j?.success ? `Engine restore complete (${mode}).` : j?.error || "Engine restore failed.");
    if (j?.success && j?.backup) {
      setEngineBackupText(JSON.stringify(j.backup, null, 2));
    }
  }

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ marginTop: 0 }}>Backups + Restore</h1>
      <div style={{ color: "#ff9c9c", marginBottom: 10 }}>{msg}</div>

      <div style={{ marginBottom: 12, padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
        <button onClick={createSnapshot}>Create Snapshot</button>
        <button style={{ marginLeft: 8 }} onClick={loadSnapshots}>Refresh Snapshot List</button>
        <div style={{ marginTop: 8, maxHeight: 180, overflow: "auto", background: "#111", padding: 8 }}>
          {snapshots.map((s, i) => <div key={i}>{typeof s === "string" ? s : JSON.stringify(s)}</div>)}
          {snapshots.length === 0 && <div>No snapshots found.</div>}
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
        <button onClick={exportConfig}>Export Guild Config</button>
        <button style={{ marginLeft: 8 }} onClick={() => importConfig("merge")}>Import (Merge)</button>
        <button style={{ marginLeft: 8 }} onClick={() => importConfig("replace")}>Import (Replace)</button>
        <textarea
          value={backupText}
          onChange={(e) => setBackupText(e.target.value)}
          placeholder="Backup JSON shows here (or paste to import)"
          style={{ width: "100%", minHeight: 320, marginTop: 8, background: "#0c0c0c", color: "#ffd7d7" }}
        />
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
        <div style={{ marginBottom: 8, color: "#ffd7d7", fontWeight: 700 }}>Live Bot Engine Config</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={engineFilter}
            onChange={(e) => setEngineFilter(e.target.value)}
            style={{ minWidth: 220, background: "#0c0c0c", color: "#ffd7d7", border: "1px solid #5f0000", borderRadius: 8, padding: "8px 10px" }}
          >
            <option value="">All engines</option>
            {engineKeys.map((engineKey) => (
              <option key={engineKey} value={engineKey}>{engineKey}</option>
            ))}
          </select>
          <button onClick={exportEngineConfig}>Export Bot Engine Config</button>
          <button onClick={() => importEngineConfig("merge")}>Restore (Merge)</button>
          <button onClick={() => importEngineConfig("replace")}>Restore (Replace)</button>
        </div>
        <textarea
          value={engineBackupText}
          onChange={(e) => setEngineBackupText(e.target.value)}
          placeholder="Live bot engine config backup shows here (or paste exported JSON to restore)"
          style={{ width: "100%", minHeight: 320, marginTop: 8, background: "#0c0c0c", color: "#ffd7d7" }}
        />
      </div>
    </div>
  );
}
