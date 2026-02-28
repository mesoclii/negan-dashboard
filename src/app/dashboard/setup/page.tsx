"use client";

import { useEffect, useMemo, useState } from "react";

const SAVIORS_GUILD_ID = "1431799056211906582";

type Guild = { id: string; name: string; icon?: string | null };
type SnapshotMeta = { name: string; createdAt: string; sourceGuildId: string };

type DashboardConfig = {
  features?: Record<string, boolean>;
  persona?: Record<string, any>;
  security?: Record<string, any>;
};

function getGuildId() {
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

async function getConfig(guildId: string): Promise<DashboardConfig> {
  const r = await fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(guildId)}`);
  const j = await r.json();
  if (!r.ok || j?.success === false) throw new Error(j?.error || "Failed to load config");
  return (j?.config || {}) as DashboardConfig;
}

async function saveConfig(guildId: string, patch: DashboardConfig) {
  const r = await fetch("/api/bot/dashboard-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guildId, patch })
  });
  const j = await r.json();
  if (!r.ok || j?.success === false) throw new Error(j?.error || "Failed to save config");
}

function buildBlankConfig(current: DashboardConfig): DashboardConfig {
  const existingFeatures = current?.features || {};
  const features: Record<string, boolean> = {};
  for (const k of Object.keys(existingFeatures)) features[k] = false;

  features.coreEnabled = true;
  features.securityEnabled = true;
  features.onboardingEnabled = false;
  features.verificationEnabled = false;
  features.lockdownEnabled = false;
  features.raidEnabled = false;
  features.giveawaysEnabled = false;
  features.economyEnabled = false;
  features.heistEnabled = false;
  features.ticketsEnabled = false;
  features.pokemonEnabled = false;
  features.pokemonPrivateOnly = true;
  features.aiEnabled = false;
  features.ttsEnabled = false;
  features.governanceEnabled = false;
  features.birthdayEnabled = false;
  features.rareDropEnabled = false;
  features.catdropEnabled = false;
  features.crewEnabled = false;
  features.contractsEnabled = false;
  features.progressionEnabled = false;

  const s = current?.security || {};
  const pre = s.preOnboarding || {};
  const onb = s.onboarding || {};
  const ver = s.verification || {};
  const lock = s.lockdown || {};
  const raid = s.raid || {};

  return {
    features,
    persona: {
      guildNickname: "",
      webhookName: "",
      webhookAvatarUrl: "",
      useWebhookPersona: false
    },
    security: {
      ...s,
      preOnboarding: {
        ...pre,
        enabled: false,
        autoKickOnFail: false,
        kickDelayMinutes: 10,
        minAccountAgeDays: 0,
        bypassRoleIds: [],
        quarantineRoleId: "",
        failMessageTemplate: "",
        logChannelId: ""
      },
      onboarding: {
        ...onb,
        enabled: false,
        welcomeChannelId: "",
        welcomeMessageTemplate: "",
        panelBodyTemplate: "",
        rulesChannelId: "",
        dmTemplate: "",
        sendWelcomeDm: false
      },
      verification: {
        ...ver,
        enabled: false,
        idTimeoutMinutes: 30,
        roleOnVerifyId: "",
        removeRoleIdsOnVerify: [],
        declineAction: "kick",
        ticketCategoryId: "",
        ticketChannelId: "",
        approverRoleIds: [],
        autoKickOnTimeout: false
      },
      lockdown: {
        ...lock,
        enabled: false,
        exemptRoleIds: [],
        exemptChannelIds: [],
        autoEscalation: false
      },
      raid: {
        ...raid,
        enabled: false,
        exemptRoleIds: [],
        exemptChannelIds: [],
        autoEscalate: false
      }
    }
  };
}

export default function SetupPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [targetGuildId, setTargetGuildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [selectedSnapshot, setSelectedSnapshot] = useState("");

  const targetGuild = useMemo(() => guilds.find((g) => g.id === targetGuildId), [guilds, targetGuildId]);

  const latestSaviorsSnapshot = useMemo(() => {
    const sav = snapshots.filter((s) => s.sourceGuildId === SAVIORS_GUILD_ID);
    if (!sav.length) return "";
    return sav.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0].name;
  }, [snapshots]);

  async function refreshSnapshots() {
    const r = await fetch("/api/setup/snapshots");
    const j = await r.json();
    const list = Array.isArray(j?.snapshots) ? j.snapshots : [];
    setSnapshots(list);
    if (!selectedSnapshot && list[0]?.name) setSelectedSnapshot(list[0].name);
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/bot/guilds");
        const j = await r.json();
        const list: Guild[] = Array.isArray(j?.guilds) ? j.guilds : [];
        setGuilds(list);

        const gid = getGuildId() || list[0]?.id || "";
        setTargetGuildId(gid);

        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        setSnapshotName(`saviors-baseline-${ts}`);

        await refreshSnapshots();
      } catch (e: any) {
        setMsg(e?.message || "Failed to load setup");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function applySaviorsBaselineLive() {
    if (!targetGuildId) return;
    try {
      setBusy(true);
      setMsg("");

      if (targetGuildId === SAVIORS_GUILD_ID) {
        setMsg("Saviors is source baseline. Nothing to clone.");
        return;
      }

      const source = await getConfig(SAVIORS_GUILD_ID);
      await saveConfig(targetGuildId, source);
      setMsg(`Live baseline copied from Saviors to ${targetGuild?.name || targetGuildId}.`);
    } catch (e: any) {
      setMsg(e?.message || "Live baseline copy failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveSnapshotFromSaviors() {
    try {
      setBusy(true);
      setMsg("");
      const cfg = await getConfig(SAVIORS_GUILD_ID);

      const name = snapshotName.trim();
      if (!name) throw new Error("Snapshot name is required");

      const r = await fetch("/api/setup/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sourceGuildId: SAVIORS_GUILD_ID, config: cfg })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Snapshot save failed");

      await refreshSnapshots();
      setSelectedSnapshot(name);
      setMsg(`Snapshot saved: ${name}`);
    } catch (e: any) {
      setMsg(e?.message || "Snapshot save failed");
    } finally {
      setBusy(false);
    }
  }

  async function applySnapshotToSelected(nameOverride?: string) {
    if (!targetGuildId) return;
    const name = (nameOverride || selectedSnapshot || "").trim();
    if (!name) return setMsg("Select a snapshot first.");

    try {
      setBusy(true);
      setMsg("");

      const r = await fetch(`/api/setup/snapshots?name=${encodeURIComponent(name)}&full=1`);
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Snapshot load failed");

      const cfg = j?.snapshot?.config;
      if (!cfg || typeof cfg !== "object") throw new Error("Snapshot config missing");

      await saveConfig(targetGuildId, cfg);
      setMsg(`Snapshot '${name}' applied to ${targetGuild?.name || targetGuildId}.`);
    } catch (e: any) {
      setMsg(e?.message || "Snapshot apply failed");
    } finally {
      setBusy(false);
    }
  }

  async function resetSelectedToBlank() {
    if (!targetGuildId) return;
    try {
      setBusy(true);
      setMsg("");
      const current = await getConfig(targetGuildId);
      const blank = buildBlankConfig(current);
      await saveConfig(targetGuildId, blank);
      setMsg(`Blank config applied to ${targetGuild?.name || targetGuildId}.`);
    } catch (e: any) {
      setMsg(e?.message || "Blank reset failed");
    } finally {
      setBusy(false);
    }
  }

  async function blankAllNonSaviors() {
    try {
      setBusy(true);
      setMsg("");
      const targets = guilds.filter((g) => g.id !== SAVIORS_GUILD_ID);
      for (const g of targets) {
        const current = await getConfig(g.id);
        const blank = buildBlankConfig(current);
        await saveConfig(g.id, blank);
      }
      setMsg(`Blank config applied to ${targets.length} non-Saviors guild(s).`);
    } catch (e: any) {
      setMsg(e?.message || "Bulk blank failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSnapshot(name: string) {
    try {
      setBusy(true);
      setMsg("");
      const r = await fetch(`/api/setup/snapshots?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Delete failed");
      await refreshSnapshots();
      if (selectedSnapshot === name) setSelectedSnapshot("");
      setMsg(`Snapshot deleted: ${name}`);
    } catch (e: any) {
      setMsg(e?.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div style={{ color: "#ff6b6b", padding: 24 }}>Loading setup…</div>;

  return (
    <div style={{ color: "#ff5252", padding: 18 }}>
      <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: 20 }}>Setup</h1>
      <div style={{ marginTop: 4 }}>Flagship baseline + blank onboarding workflow.</div>

      <div style={{ ...box(), marginTop: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Target Guild</div>
        <select value={targetGuildId} onChange={(e) => setTargetGuildId(e.target.value)} style={input()}>
          <option value="">Select guild</option>
          {guilds.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name} ({g.id})
            </option>
          ))}
        </select>
      </div>

      <div style={{ ...box(), marginTop: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Saviors Baseline</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button onClick={applySaviorsBaselineLive} disabled={busy || !targetGuildId} style={input()}>
            Apply Live Saviors Baseline
          </button>
          <button onClick={resetSelectedToBlank} disabled={busy || !targetGuildId} style={input()}>
            Reset Selected to Blank
          </button>
          <button onClick={blankAllNonSaviors} disabled={busy || !guilds.length} style={input()}>
            Blank All Non-Saviors
          </button>
        </div>
      </div>

      <div style={{ ...box(), marginTop: 12 }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Snapshot Vault</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
          <input
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            placeholder="snapshot name (ex: saviors-baseline-2026-02-28)"
            style={input()}
          />
          <button onClick={saveSnapshotFromSaviors} disabled={busy} style={input()}>
            Save Saviors Snapshot
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginTop: 8 }}>
          <select value={selectedSnapshot} onChange={(e) => setSelectedSnapshot(e.target.value)} style={input()}>
            <option value="">Select snapshot</option>
            {snapshots.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name} [{s.sourceGuildId}] {new Date(s.createdAt).toLocaleString()}
              </option>
            ))}
          </select>

          <button onClick={() => applySnapshotToSelected()} disabled={busy || !targetGuildId || !selectedSnapshot} style={input()}>
            Apply Snapshot to Selected Guild
          </button>

          <button
            onClick={() => latestSaviorsSnapshot && applySnapshotToSelected(latestSaviorsSnapshot)}
            disabled={busy || !targetGuildId || !latestSaviorsSnapshot}
            style={input()}
          >
            One-Click Restore Latest Saviors Snapshot
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: 13, color: "#ff9f9f" }}>
          Latest Saviors snapshot: {latestSaviorsSnapshot || "none"}
        </div>

        {!!selectedSnapshot && (
          <div style={{ marginTop: 8 }}>
            <button onClick={() => deleteSnapshot(selectedSnapshot)} disabled={busy} style={input()}>
              Delete Selected Snapshot
            </button>
          </div>
        )}
      </div>

      {msg ? <div style={{ marginTop: 10, color: "#ffb3b3" }}>{msg}</div> : null}
    </div>
  );
}
