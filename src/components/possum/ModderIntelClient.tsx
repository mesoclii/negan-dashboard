"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type ModderIntelConfig = {
  enabled: boolean;
  auditChannelId: string;
  rulesChannelId: string;
  staffRoleIds: string[];
  autoRemoveOnStaff: boolean;
  notes: string;
};

type RuntimeRow = {
  id?: string;
  title?: string;
  name?: string;
  value?: string;
};

const DEFAULT_CFG: ModderIntelConfig = {
  enabled: true,
  auditChannelId: "",
  rulesChannelId: "",
  staffRoleIds: [],
  autoRemoveOnStaff: true,
  notes: "",
};

const SURFACES = [
  { key: "vip", label: "VIP" },
  { key: "heists", label: "Heists" },
  { key: "casinopings", label: "Casino Pings" },
  { key: "giveaways", label: "Giveaways" },
  { key: "crew", label: "Crew" },
  { key: "services", label: "Service Access" },
];

const shell: CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1380 };
const card: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 14,
  padding: 16,
  background: "linear-gradient(180deg, rgba(120,0,0,0.12), rgba(0,0,0,0.72))",
  marginBottom: 14,
};
const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 10,
  padding: "10px 12px",
};
const label: CSSProperties = {
  color: "#ffb9b9",
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
};

function toggle(list: string[], id: string) {
  const next = new Set(list || []);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return Array.from(next);
}

export default function ModderIntelClient() {
  const {
    guildId,
    guildName,
    config,
    setConfig,
    channels,
    roles,
    summary,
    details,
    loading,
    saving,
    message,
    save,
    runAction,
    reload,
  } = useGuildEngineEditor<ModderIntelConfig>("modderIntel", DEFAULT_CFG);

  const cfg = useMemo(() => ({ ...DEFAULT_CFG, ...(config || {}) }), [config]);
  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );
  const trackedEntries = useMemo(() => (Array.isArray((details as any)?.entries) ? ((details as any).entries as RuntimeRow[]) : []), [details]);
  const activity = useMemo(() => (Array.isArray((details as any)?.activity) ? ((details as any).activity as RuntimeRow[]) : []), [details]);

  const [form, setForm] = useState({
    userId: "",
    menuName: "",
    riskLevel: "medium",
    notes: "",
    restrictionSurfaces: [] as string[],
  });
  const [removeUserId, setRemoveUserId] = useState("");

  async function addEntry() {
    const userId = String(form.userId || "").match(/\d{16,20}/)?.[0] || "";
    if (!userId) return;
    const result = await runAction("upsertEntry", {
      userId,
      menuName: form.menuName,
      riskLevel: form.riskLevel,
      notes: form.notes,
      restrictionSurfaces: form.restrictionSurfaces,
    });
    if (result) {
      setForm({
        userId: "",
        menuName: "",
        riskLevel: "medium",
        notes: "",
        restrictionSurfaces: [],
      });
      void reload();
    }
  }

  async function removeEntry() {
    const userId = String(removeUserId || "").match(/\d{16,20}/)?.[0] || "";
    if (!userId) return;
    const result = await runAction("removeEntry", { userId });
    if (result) {
      setRemoveUserId("");
      void reload();
    }
  }

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={shell}>
      <h1 style={{ marginTop: 0, color: "#ff4d4d", textTransform: "uppercase", letterSpacing: "0.1em" }}>Modder Intel Studio</h1>
      <div style={{ color: "#ff9c9c", marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb6b6", marginBottom: 14, lineHeight: 1.6 }}>
        Track known menu holders, reseller/network risk, restriction surfaces, and staff-safe cleanup. This is the additive operator surface for modding-community intel without forcing it into the blacklist.
      </div>
      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? <div style={card}>Loading modder intel...</div> : null}

      {!loading ? (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <label style={{ color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={cfg.enabled} onChange={(e) => setConfig((prev) => ({ ...(prev || cfg), enabled: e.target.checked }))} /> Modder intel enabled
              </label>
              <label style={{ color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={cfg.autoRemoveOnStaff} onChange={(e) => setConfig((prev) => ({ ...(prev || cfg), autoRemoveOnStaff: e.target.checked }))} /> Auto-remove intel if member becomes staff
              </label>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
              <div>
                <div style={label}>Audit Channel</div>
                <select style={input} value={cfg.auditChannelId} onChange={(e) => setConfig((prev) => ({ ...(prev || cfg), auditChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>#{channel.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={label}>Rules Channel</div>
                <select style={input} value={cfg.rulesChannelId} onChange={(e) => setConfig((prev) => ({ ...(prev || cfg), rulesChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>#{channel.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={label}>Staff Roles</div>
                <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 10, padding: 10, background: "#0a0a0a" }}>
                  {roles.map((role) => (
                    <label key={role.id} style={{ display: "block", color: "#ffdcdc", marginBottom: 6 }}>
                      <input
                        type="checkbox"
                        checked={cfg.staffRoleIds.includes(role.id)}
                        onChange={() => setConfig((prev) => ({ ...(prev || cfg), staffRoleIds: toggle((prev || cfg).staffRoleIds || [], role.id) }))}
                      />{" "}
                      @{role.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Track Menu Holder / Reseller Intel
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              <div>
                <div style={label}>User ID</div>
                <input style={input} value={form.userId} onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))} placeholder="Discord user ID or mention" />
              </div>
              <div>
                <div style={label}>Menu Name</div>
                <input style={input} value={form.menuName} onChange={(e) => setForm((prev) => ({ ...prev, menuName: e.target.value }))} placeholder="Cherax, Stand, 2Take1, etc." />
              </div>
              <div>
                <div style={label}>Risk Level</div>
                <select style={input} value={form.riskLevel} onChange={(e) => setForm((prev) => ({ ...prev, riskLevel: e.target.value }))}>
                  <option value="low">LOW</option>
                  <option value="medium">MEDIUM</option>
                  <option value="high">HIGH</option>
                  <option value="extreme">EXTREME</option>
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={label}>Restriction Surfaces</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", border: "1px solid #500000", borderRadius: 10, padding: 10, background: "#0a0a0a" }}>
                  {SURFACES.map((surface) => (
                    <label key={surface.key} style={{ color: "#ffdcdc" }}>
                      <input
                        type="checkbox"
                        checked={form.restrictionSurfaces.includes(surface.key)}
                        onChange={() => setForm((prev) => ({ ...prev, restrictionSurfaces: toggle(prev.restrictionSurfaces, surface.key) }))}
                      />{" "}
                      {surface.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={label}>Notes</div>
                <textarea style={{ ...input, minHeight: 100 }} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Menu notes, reseller concerns, DM selling, cook risk, no-second-chance reminders, etc." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <button onClick={() => void addEntry()} disabled={saving || !/\d{16,20}/.test(form.userId)} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                {saving ? "Working..." : "Save Intel Record"}
              </button>
            </div>
          </section>

          <section style={card}>
            <div style={label}>Remove Intel Record</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
              <input style={input} value={removeUserId} onChange={(e) => setRemoveUserId(e.target.value)} placeholder="Discord user ID or mention" />
              <button onClick={() => void removeEntry()} disabled={saving || !/\d{16,20}/.test(removeUserId)} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                {saving ? "Working..." : "Remove"}
              </button>
            </div>
          </section>

          <section style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Tracked Members
            </div>
            {trackedEntries.length ? trackedEntries.map((entry) => (
              <div key={String(entry.id || entry.title)} style={{ padding: "8px 0", borderTop: "1px solid #330000" }}>
                <div style={{ fontWeight: 800 }}>{entry.title || entry.name}</div>
                <div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div>
              </div>
            )) : <div style={{ color: "#ffb3b3" }}>No tracked menu holders yet.</div>}
          </section>

          <section style={card}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              Recent Intel Activity
            </div>
            {activity.length ? activity.map((entry) => (
              <div key={String(entry.id || entry.title)} style={{ padding: "8px 0", borderTop: "1px solid #330000" }}>
                <div style={{ fontWeight: 800 }}>{entry.title || entry.name}</div>
                <div style={{ color: "#ffb3b3", fontSize: 12 }}>{entry.value}</div>
              </div>
            )) : <div style={{ color: "#ffb3b3" }}>No activity logged yet.</div>}
          </section>

          <section style={card}>
            <div style={label}>Modder Intel Notes</div>
            <textarea
              style={{ ...input, minHeight: 120 }}
              value={cfg.notes || ""}
              onChange={(e) => setConfig((prev) => ({ ...(prev || cfg), notes: e.target.value }))}
              placeholder="Guild policy for menu holders, service-selling enforcement, reseller watch notes, and rules reference."
            />
          </section>

          <section style={{ ...card, display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: "#ffb8b8", lineHeight: 1.6, maxWidth: 820 }}>
              This studio is separate from the blacklist: it is for modder/watch intel, surface restrictions, and staff-safe cleanup when members cross into trusted roles.
            </div>
            <button onClick={() => void save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Modder Intel"}
            </button>
          </section>
        </>
      ) : null}
    </div>
  );
}
