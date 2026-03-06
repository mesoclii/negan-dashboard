"use client";


import { useEffect, useState } from "react";

type GuildChannel = { id: string; name: string };
type GuildRole = { id: string; name: string };

type Tier = { name: string; days: number; roleId: string; rewardCoins: number; enabled: boolean };

type UtilitiesCfg = {
  store: {
    enabled: boolean;
    panelChannelId: string;
    currencyName: string;
    featuredItemIds: string[];
    maxItemsPerPage: number;
    purchaseCooldownSeconds: number;
    refundWindowMinutes: number;
    logsChannelId: string;
    notes: string;
  };
  ticketsPolicy: {
    enabled: boolean;
    requireReasonOnOpen: boolean;
    requireReasonOnClose: boolean;
    maxOpenPerUser: number;
    cooldownSeconds: number;
    autoCloseHours: number;
    autoArchiveHours: number;
    transcriptRetentionDays: number;
    denyRoleIds: string[];
    priorityRoleIds: string[];
    notes: string;
  };
  selfroles: {
    enabled: boolean;
    panelChannelId: string;
    panelMessageId: string;
    maxRolesPerUser: number;
    allowedRoleIds: string[];
    blockedRoleIds: string[];
    logsChannelId: string;
    notes: string;
  };
  persona: {
    enabled: boolean;
    useWebhookPersona: boolean;
    webhookName: string;
    webhookAvatarUrl: string;
    guildNickname: string;
    allowedChannelIds: string[];
    blockedChannelIds: string[];
    cooldownSeconds: number;
    notes: string;
  };
  tts: {
    enabled: boolean;
    voiceDefault: string;
    maxCharsPerMessage: number;
    cooldownSeconds: number;
    allowedChannelIds: string[];
    blockedChannelIds: string[];
    logsChannelId: string;
    notes: string;
  };
  radio: {
    enabled: boolean;
    birthdayRewardsEnabled: boolean;
    birthdayRewardCoins: number;
    birthdayRoleId: string;
    announcementChannelId: string;
    dailyBonusEnabled: boolean;
    dailyBonusCoins: number;
    notes: string;
  };
  loyalty: {
    enabled: boolean;
    autoAssignRoles: boolean;
    backfillOnEnable: boolean;
    announceChannelId: string;
    tiers: Tier[];
    notes: string;
  };
  notes: string;
};

const DEFAULT_CFG: UtilitiesCfg = {
  store: { enabled: false, panelChannelId: "", currencyName: "Coins", featuredItemIds: [], maxItemsPerPage: 10, purchaseCooldownSeconds: 3, refundWindowMinutes: 30, logsChannelId: "", notes: "" },
  ticketsPolicy: { enabled: true, requireReasonOnOpen: false, requireReasonOnClose: false, maxOpenPerUser: 1, cooldownSeconds: 0, autoCloseHours: 72, autoArchiveHours: 24, transcriptRetentionDays: 30, denyRoleIds: [], priorityRoleIds: [], notes: "" },
  selfroles: { enabled: false, panelChannelId: "", panelMessageId: "", maxRolesPerUser: 5, allowedRoleIds: [], blockedRoleIds: [], logsChannelId: "", notes: "" },
  persona: { enabled: false, useWebhookPersona: false, webhookName: "", webhookAvatarUrl: "", guildNickname: "", allowedChannelIds: [], blockedChannelIds: [], cooldownSeconds: 5, notes: "" },
  tts: { enabled: false, voiceDefault: "en-US", maxCharsPerMessage: 300, cooldownSeconds: 5, allowedChannelIds: [], blockedChannelIds: [], logsChannelId: "", notes: "" },
  radio: { enabled: false, birthdayRewardsEnabled: true, birthdayRewardCoins: 100, birthdayRoleId: "", announcementChannelId: "", dailyBonusEnabled: false, dailyBonusCoins: 10, notes: "" },
  loyalty: { enabled: false, autoAssignRoles: true, backfillOnEnable: false, announceChannelId: "", tiers: [{ name: "30 Days", days: 30, roleId: "", rewardCoins: 50, enabled: true }, { name: "90 Days", days: 90, roleId: "", rewardCoins: 200, enabled: true }, { name: "365 Days", days: 365, roleId: "", rewardCoins: 1000, enabled: true }], notes: "" },
  notes: ""
};

const box: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 10, padding: 14, background: "rgba(120,0,0,0.10)", marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: 10, borderRadius: 8, border: "1px solid #6f0000", background: "#0a0a0a", color: "#ffd6d6" };

function getGuildIdClient() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const gid = (q || s).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function addUnique(list: string[], id: string) {
  const v = String(id || "").trim();
  if (!v) return list;
  return list.includes(v) ? list : [...list, v];
}

export default function UtilitiesPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<UtilitiesCfg>(DEFAULT_CFG);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildIdClient()), []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setMsg("");
        const [uRes, gRes] = await Promise.all([
          fetch(`/api/setup/utilities-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);
        const uj = await uRes.json();
        const gj = await gRes.json();
        setCfg({ ...DEFAULT_CFG, ...(uj?.config || {}) });
        setChannels(Array.isArray(gj?.channels) ? gj.channels : []);
        setRoles(Array.isArray(gj?.roles) ? gj.roles : []);
      } catch {
        setMsg("Failed to load engine runtime config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  function setSection<K extends keyof UtilitiesCfg>(section: K, patch: Partial<any>) {
    setCfg((prev) => ({ ...prev, [section]: { ...(prev as any)[section], ...patch } }));
  }

  function addId(section: keyof UtilitiesCfg, field: string, id: string) {
    setCfg((prev: any) => {
      const sec = { ...(prev[section] || {}) };
      sec[field] = addUnique(sec[field] || [], id);
      return { ...prev, [section]: sec };
    });
  }

  function removeId(section: keyof UtilitiesCfg, field: string, id: string) {
    setCfg((prev: any) => {
      const sec = { ...(prev[section] || {}) };
      sec[field] = (sec[field] || []).filter((x: string) => x !== id);
      return { ...prev, [section]: sec };
    });
  }

  function updateTier(i: number, patch: Partial<Tier>) {
    setCfg((prev) => {
      const tiers = [...prev.loyalty.tiers];
      tiers[i] = { ...tiers[i], ...patch };
      return { ...prev, loyalty: { ...prev.loyalty, tiers } };
    });
  }

  function addTier() {
    setCfg((prev) => ({
      ...prev,
      loyalty: {
        ...prev.loyalty,
        tiers: [...prev.loyalty.tiers, { name: "New Tier", days: 30, roleId: "", rewardCoins: 0, enabled: true }]
      }
    }));
  }

  function removeTier(i: number) {
    setCfg((prev) => {
      const tiers = [...prev.loyalty.tiers];
      tiers.splice(i, 1);
      return { ...prev, loyalty: { ...prev.loyalty, tiers } };
    });
  }

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");

    try {
      const saveRes = await fetch("/api/setup/utilities-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok || saveJson?.success === false) throw new Error(saveJson?.error || "Save failed");

      await Promise.allSettled([
        fetch("/api/bot/dashboard-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guildId,
            patch: {
              features: {
                ticketsEnabled: cfg.ticketsPolicy.enabled,
                ttsEnabled: cfg.tts.enabled
              },
              persona: {
                guildNickname: cfg.persona.guildNickname,
                webhookName: cfg.persona.webhookName,
                webhookAvatarUrl: cfg.persona.webhookAvatarUrl,
                useWebhookPersona: cfg.persona.useWebhookPersona
              }
            }
          })
        })
      ]);

      setMsg("Engine runtime saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ff5c5c", padding: 20, maxWidth: 1300 }}>
      <h1 style={{ marginTop: 0, letterSpacing: "0.14em", textTransform: "uppercase" }}>Engine Runtime Studio</h1>
      <p style={{ marginTop: -4, opacity: 0.9 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Store Engine</h3>
            <label><input type="checkbox" checked={cfg.store.enabled} onChange={(e) => setSection("store", { enabled: e.target.checked })} /> Enabled</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div><div>Panel Channel</div><select style={input} value={cfg.store.panelChannelId} onChange={(e) => setSection("store", { panelChannelId: e.target.value })}><option value="">None</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
              <div><div>Logs Channel</div><select style={input} value={cfg.store.logsChannelId} onChange={(e) => setSection("store", { logsChannelId: e.target.value })}><option value="">None</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
              <div><div>Currency Name</div><input style={input} value={cfg.store.currencyName} onChange={(e) => setSection("store", { currencyName: e.target.value })} /></div>
              <div><div>Max Items/Page</div><input type="number" style={input} value={cfg.store.maxItemsPerPage} onChange={(e) => setSection("store", { maxItemsPerPage: Number(e.target.value || 0) })} /></div>
              <div><div>Purchase Cooldown (sec)</div><input type="number" style={input} value={cfg.store.purchaseCooldownSeconds} onChange={(e) => setSection("store", { purchaseCooldownSeconds: Number(e.target.value || 0) })} /></div>
              <div><div>Refund Window (min)</div><input type="number" style={input} value={cfg.store.refundWindowMinutes} onChange={(e) => setSection("store", { refundWindowMinutes: Number(e.target.value || 0) })} /></div>
            </div>
            <div style={{ marginTop: 8 }}><div>Store Notes</div><textarea style={{ ...input, minHeight: 60 }} value={cfg.store.notes} onChange={(e) => setSection("store", { notes: e.target.value })} /></div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Tickets Policy</h3>
            <label><input type="checkbox" checked={cfg.ticketsPolicy.enabled} onChange={(e) => setSection("ticketsPolicy", { enabled: e.target.checked })} /> Enabled</label>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label><input type="checkbox" checked={cfg.ticketsPolicy.requireReasonOnOpen} onChange={(e) => setSection("ticketsPolicy", { requireReasonOnOpen: e.target.checked })} /> Require reason on open</label>
              <label><input type="checkbox" checked={cfg.ticketsPolicy.requireReasonOnClose} onChange={(e) => setSection("ticketsPolicy", { requireReasonOnClose: e.target.checked })} /> Require reason on close</label>
              <div><div>Max Open/User</div><input type="number" style={input} value={cfg.ticketsPolicy.maxOpenPerUser} onChange={(e) => setSection("ticketsPolicy", { maxOpenPerUser: Number(e.target.value || 0) })} /></div>
              <div><div>Cooldown (sec)</div><input type="number" style={input} value={cfg.ticketsPolicy.cooldownSeconds} onChange={(e) => setSection("ticketsPolicy", { cooldownSeconds: Number(e.target.value || 0) })} /></div>
              <div><div>Auto Close (hours)</div><input type="number" style={input} value={cfg.ticketsPolicy.autoCloseHours} onChange={(e) => setSection("ticketsPolicy", { autoCloseHours: Number(e.target.value || 0) })} /></div>
              <div><div>Auto Archive (hours)</div><input type="number" style={input} value={cfg.ticketsPolicy.autoArchiveHours} onChange={(e) => setSection("ticketsPolicy", { autoArchiveHours: Number(e.target.value || 0) })} /></div>
            </div>

            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div>Deny Roles</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                  <select style={input} value={pick.denyRole || ""} onChange={(e) => setPick((p) => ({ ...p, denyRole: e.target.value }))}>
                    <option value="">Select role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
                  </select>
                  <button onClick={() => addId("ticketsPolicy", "denyRoleIds", pick.denyRole || "")}>Add</button>
                </div>
                <div style={{ marginTop: 6 }}>{cfg.ticketsPolicy.denyRoleIds.map((id) => <button key={id} style={{ marginRight: 6, marginBottom: 6 }} onClick={() => removeId("ticketsPolicy", "denyRoleIds", id)}>{id} x</button>)}</div>
              </div>

              <div>
                <div>Priority Roles</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                  <select style={input} value={pick.priorityRole || ""} onChange={(e) => setPick((p) => ({ ...p, priorityRole: e.target.value }))}>
                    <option value="">Select role</option>
                    {roles.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
                  </select>
                  <button onClick={() => addId("ticketsPolicy", "priorityRoleIds", pick.priorityRole || "")}>Add</button>
                </div>
                <div style={{ marginTop: 6 }}>{cfg.ticketsPolicy.priorityRoleIds.map((id) => <button key={id} style={{ marginRight: 6, marginBottom: 6 }} onClick={() => removeId("ticketsPolicy", "priorityRoleIds", id)}>{id} x</button>)}</div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}><div>Tickets Notes</div><textarea style={{ ...input, minHeight: 60 }} value={cfg.ticketsPolicy.notes} onChange={(e) => setSection("ticketsPolicy", { notes: e.target.value })} /></div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Selfroles Engine</h3>
            <label><input type="checkbox" checked={cfg.selfroles.enabled} onChange={(e) => setSection("selfroles", { enabled: e.target.checked })} /> Enabled</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div><div>Panel Channel</div><select style={input} value={cfg.selfroles.panelChannelId} onChange={(e) => setSection("selfroles", { panelChannelId: e.target.value })}><option value="">None</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
              <div><div>Logs Channel</div><select style={input} value={cfg.selfroles.logsChannelId} onChange={(e) => setSection("selfroles", { logsChannelId: e.target.value })}><option value="">None</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
              <div><div>Panel Message ID</div><input style={input} value={cfg.selfroles.panelMessageId} onChange={(e) => setSection("selfroles", { panelMessageId: e.target.value })} /></div>
              <div><div>Max Roles/User</div><input type="number" style={input} value={cfg.selfroles.maxRolesPerUser} onChange={(e) => setSection("selfroles", { maxRolesPerUser: Number(e.target.value || 0) })} /></div>
            </div>
            <div style={{ marginTop: 8 }}><div>Selfroles Notes</div><textarea style={{ ...input, minHeight: 60 }} value={cfg.selfroles.notes} onChange={(e) => setSection("selfroles", { notes: e.target.value })} /></div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Persona Controls</h3>
            <label><input type="checkbox" checked={cfg.persona.enabled} onChange={(e) => setSection("persona", { enabled: e.target.checked })} /> Enabled</label>
            <label style={{ marginLeft: 12 }}><input type="checkbox" checked={cfg.persona.useWebhookPersona} onChange={(e) => setSection("persona", { useWebhookPersona: e.target.checked })} /> Use Webhook Persona</label>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div><div>Guild Nickname</div><input style={input} value={cfg.persona.guildNickname} onChange={(e) => setSection("persona", { guildNickname: e.target.value })} /></div>
              <div><div>Webhook Name</div><input style={input} value={cfg.persona.webhookName} onChange={(e) => setSection("persona", { webhookName: e.target.value })} /></div>
              <div><div>Webhook Avatar URL</div><input style={input} value={cfg.persona.webhookAvatarUrl} onChange={(e) => setSection("persona", { webhookAvatarUrl: e.target.value })} /></div>
              <div><div>Cooldown (sec)</div><input type="number" style={input} value={cfg.persona.cooldownSeconds} onChange={(e) => setSection("persona", { cooldownSeconds: Number(e.target.value || 0) })} /></div>
            </div>
            <div style={{ marginTop: 8 }}><div>Persona Notes</div><textarea style={{ ...input, minHeight: 60 }} value={cfg.persona.notes} onChange={(e) => setSection("persona", { notes: e.target.value })} /></div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>TTS Engine</h3>
            <label><input type="checkbox" checked={cfg.tts.enabled} onChange={(e) => setSection("tts", { enabled: e.target.checked })} /> Enabled</label>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div><div>Voice Default</div><input style={input} value={cfg.tts.voiceDefault} onChange={(e) => setSection("tts", { voiceDefault: e.target.value })} /></div>
              <div><div>Max Chars/Message</div><input type="number" style={input} value={cfg.tts.maxCharsPerMessage} onChange={(e) => setSection("tts", { maxCharsPerMessage: Number(e.target.value || 0) })} /></div>
              <div><div>Cooldown (sec)</div><input type="number" style={input} value={cfg.tts.cooldownSeconds} onChange={(e) => setSection("tts", { cooldownSeconds: Number(e.target.value || 0) })} /></div>
            </div>
            <div style={{ marginTop: 8 }}><div>TTS Notes</div><textarea style={{ ...input, minHeight: 60 }} value={cfg.tts.notes} onChange={(e) => setSection("tts", { notes: e.target.value })} /></div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Radio / Birthday</h3>
            <label><input type="checkbox" checked={cfg.radio.enabled} onChange={(e) => setSection("radio", { enabled: e.target.checked })} /> Radio Enabled</label>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <label><input type="checkbox" checked={cfg.radio.birthdayRewardsEnabled} onChange={(e) => setSection("radio", { birthdayRewardsEnabled: e.target.checked })} /> Birthday Rewards</label>
              <label><input type="checkbox" checked={cfg.radio.dailyBonusEnabled} onChange={(e) => setSection("radio", { dailyBonusEnabled: e.target.checked })} /> Daily Bonus</label>
              <div><div>Birthday Reward Coins</div><input type="number" style={input} value={cfg.radio.birthdayRewardCoins} onChange={(e) => setSection("radio", { birthdayRewardCoins: Number(e.target.value || 0) })} /></div>
              <div><div>Daily Bonus Coins</div><input type="number" style={input} value={cfg.radio.dailyBonusCoins} onChange={(e) => setSection("radio", { dailyBonusCoins: Number(e.target.value || 0) })} /></div>
              <div><div>Birthday Role</div><select style={input} value={cfg.radio.birthdayRoleId} onChange={(e) => setSection("radio", { birthdayRoleId: e.target.value })}><option value="">None</option>{roles.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}</select></div>
              <div><div>Announcement Channel</div><select style={input} value={cfg.radio.announcementChannelId} onChange={(e) => setSection("radio", { announcementChannelId: e.target.value })}><option value="">None</option>{channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
            </div>
            <div style={{ marginTop: 8 }}><div>Radio Notes</div><textarea style={{ ...input, minHeight: 60 }} value={cfg.radio.notes} onChange={(e) => setSection("radio", { notes: e.target.value })} /></div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Loyalty Engine</h3>
            <label><input type="checkbox" checked={cfg.loyalty.enabled} onChange={(e) => setSection("loyalty", { enabled: e.target.checked })} /> Enabled</label>
            <label style={{ marginLeft: 12 }}><input type="checkbox" checked={cfg.loyalty.autoAssignRoles} onChange={(e) => setSection("loyalty", { autoAssignRoles: e.target.checked })} /> Auto Assign Roles</label>
            <label style={{ marginLeft: 12 }}><input type="checkbox" checked={cfg.loyalty.backfillOnEnable} onChange={(e) => setSection("loyalty", { backfillOnEnable: e.target.checked })} /> Backfill On Enable</label>

            <div style={{ marginTop: 8 }}>
              <div>Announce Channel</div>
              <select style={input} value={cfg.loyalty.announceChannelId} onChange={(e) => setSection("loyalty", { announceChannelId: e.target.value })}>
                <option value="">None</option>
                {channels.map(c => <option key={c.id} value={c.id}>#{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 10 }}>
              <h4 style={{ margin: "0 0 8px" }}>Loyalty Tiers</h4>
              {cfg.loyalty.tiers.map((t, i) => (
                <div key={i} style={{ border: "1px solid #6a0000", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr 130px auto auto", gap: 8, alignItems: "center" }}>
                    <input style={input} value={t.name} onChange={(e) => updateTier(i, { name: e.target.value })} />
                    <input type="number" style={input} value={t.days} onChange={(e) => updateTier(i, { days: Number(e.target.value || 0) })} />
                    <select style={input} value={t.roleId} onChange={(e) => updateTier(i, { roleId: e.target.value })}>
                      <option value="">No Role</option>
                      {roles.map(r => <option key={r.id} value={r.id}>@{r.name}</option>)}
                    </select>
                    <input type="number" style={input} value={t.rewardCoins} onChange={(e) => updateTier(i, { rewardCoins: Number(e.target.value || 0) })} />
                    <label><input type="checkbox" checked={t.enabled} onChange={(e) => updateTier(i, { enabled: e.target.checked })} /> On</label>
                    <button onClick={() => removeTier(i)}>Remove</button>
                  </div>
                </div>
              ))}
              <button onClick={addTier}>+ Add Tier</button>
            </div>

            <div style={{ marginTop: 8 }}><div>Loyalty Notes</div><textarea style={{ ...input, minHeight: 60 }} value={cfg.loyalty.notes} onChange={(e) => setSection("loyalty", { notes: e.target.value })} /></div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Global Notes</h3>
            <textarea style={{ ...input, minHeight: 80 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
          </div>

          <button onClick={saveAll} disabled={saving}>{saving ? "Saving..." : "Save Engine Runtime Studio"}</button>
          {msg ? <p style={{ marginTop: 10 }}>{msg}</p> : null}
        </>
      )}
    </div>
  );
}
