"use client";

import { useEffect, useState } from "react";

type Role = { id: string; name: string };
type Channel = { id: string; name: string };
type StoreImage = { url: string; label?: string };

type StoreItem = {
  id: string;
  name: string;
  description: string;
  type: "role" | "item" | "perk";
  roleId: string;
  priceCoins: number;
  stock: number;
  oneTime: boolean;
  enabled: boolean;
};

type StoreConfig = {
  active: boolean;
  panel: {
    enabled: boolean;
    channelId: string;
    title: string;
    description: string;
    buttonLabel: string;
    embedColor: string;
    imageUrl: string;
    imageLibrary: StoreImage[];
  };
  policies: {
    maxItemsPerPurchase: number;
    allowRoleStacking: boolean;
    requireStaffApproval: boolean;
    logChannelId: string;
  };
  items: StoreItem[];
};

const DEFAULT_CONFIG: StoreConfig = {
  active: true,
  panel: {
    enabled: true,
    channelId: "",
    title: "Server Store",
    description: "Spend coins on roles, perks, and items.",
    buttonLabel: "Open Store",
    embedColor: "#ff3b3b",
    imageUrl: "",
    imageLibrary: []
  },
  policies: {
    maxItemsPerPurchase: 1,
    allowRoleStacking: false,
    requireStaffApproval: false,
    logChannelId: ""
  },
  items: [
    {
      id: "vip-trial",
      name: "VIP Trial",
      description: "Temporary VIP access",
      type: "role",
      roleId: "",
      priceCoins: 5000,
      stock: -1,
      oneTime: true,
      enabled: true
    }
  ]
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const guildId = (fromUrl || fromStore).trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);
  return guildId;
}

function normalizeLibrary(raw: any): StoreImage[] {
  if (!Array.isArray(raw)) return [];
  const out: StoreImage[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const url = String(row?.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push({ url, label: String(row?.label || "").trim().slice(0, 120) });
  }
  return out;
}

function mergeConfig(raw: any): StoreConfig {
  return {
    ...DEFAULT_CONFIG,
    ...(raw || {}),
    panel: {
      ...DEFAULT_CONFIG.panel,
      ...(raw?.panel || {}),
      imageLibrary: normalizeLibrary(raw?.panel?.imageLibrary)
    },
    policies: { ...DEFAULT_CONFIG.policies, ...(raw?.policies || {}) },
    items: Array.isArray(raw?.items) ? raw.items : DEFAULT_CONFIG.items
  };
}

const box: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.07)",
  marginBottom: 14
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  background: "#0a0a0a",
  border: "1px solid #6f0000",
  color: "#ffd7d7",
  borderRadius: 8
};

export default function StorePage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageLabel, setNewImageLabel] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const [storeRes, guildRes] = await Promise.all([
          fetch(`/api/setup/store-config?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const storeJson = await storeRes.json();
        const guildJson = await guildRes.json();

        setCfg(mergeConfig(storeJson?.config));
        setRoles(Array.isArray(guildJson?.roles) ? guildJson.roles.map((r: any) => ({ id: String(r.id), name: String(r.name) })) : []);
        setChannels(Array.isArray(guildJson?.channels) ? guildJson.channels.map((c: any) => ({ id: String(c.id), name: String(c.name) })) : []);
      } catch {
        setMsg("Failed to load store config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  async function save() {
    if (!guildId) return;
    try {
      setSaving(true);
      setMsg("");
      const res = await fetch("/api/setup/store-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: cfg })
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setCfg(mergeConfig(json?.config || cfg));
      setMsg("Store saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function addPanelImage() {
    const url = String(newImageUrl || "").trim();
    if (!url) return;
    if (cfg.panel.imageLibrary.some((x) => x.url === url)) {
      setMsg("Image already in library.");
      return;
    }
    setCfg((prev) => ({
      ...prev,
      panel: {
        ...prev.panel,
        imageLibrary: [...prev.panel.imageLibrary, { url, label: String(newImageLabel || "").trim() }]
      }
    }));
    setNewImageUrl("");
    setNewImageLabel("");
    setMsg("Added image to library. Save Store to persist.");
  }

  function removePanelImage(url: string) {
    setCfg((prev) => ({
      ...prev,
      panel: {
        ...prev.panel,
        imageLibrary: prev.panel.imageLibrary.filter((x) => x.url !== url),
        imageUrl: prev.panel.imageUrl === url ? "" : prev.panel.imageUrl
      }
    }));
  }

  function setPanelBackground(url: string) {
    setCfg((prev) => ({ ...prev, panel: { ...prev.panel, imageUrl: url } }));
  }

  function addItem() {
    setCfg((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}`,
          name: "",
          description: "",
          type: "item",
          roleId: "",
          priceCoins: 0,
          stock: -1,
          oneTime: false,
          enabled: true
        }
      ]
    }));
  }

  function updateItem(index: number, patch: Partial<StoreItem>) {
    setCfg((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], ...patch };
      return { ...prev, items };
    });
  }

  function removeItem(index: number) {
    setCfg((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  if (!guildId) return <div style={{ color: "#ff7777", padding: 20 }}>Missing guildId.</div>;

  return (
    <div style={{ color: "#ff4d4d", padding: 20, maxWidth: 1180 }}>
      <h1 style={{ marginTop: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Economy - Store Engine</h1>
      <p>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      {loading ? <p>Loading...</p> : (
        <>
          <div style={box}>
            <label>
              <input
                type="checkbox"
                checked={cfg.active}
                onChange={(e) => setCfg({ ...cfg, active: e.target.checked })}
              />{" "}
              Store engine active
            </label>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Store Panel</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Panel channel</label>
                <select
                  style={input}
                  value={cfg.panel.channelId}
                  onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, channelId: e.target.value } })}
                >
                  <option value="">Select channel</option>
                  {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div>
                <label>Log channel</label>
                <select
                  style={input}
                  value={cfg.policies.logChannelId}
                  onChange={(e) => setCfg({ ...cfg, policies: { ...cfg.policies, logChannelId: e.target.value } })}
                >
                  <option value="">Select channel</option>
                  {channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Panel title</label>
              <input
                style={input}
                value={cfg.panel.title}
                onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, title: e.target.value } })}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <label>Panel description</label>
              <textarea
                style={{ ...input, minHeight: 80 }}
                value={cfg.panel.description}
                onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, description: e.target.value } })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <label>Button label</label>
                <input
                  style={input}
                  value={cfg.panel.buttonLabel}
                  onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, buttonLabel: e.target.value } })}
                />
              </div>
              <div>
                <label>Embed color</label>
                <input
                  style={input}
                  value={cfg.panel.embedColor}
                  onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, embedColor: e.target.value } })}
                />
              </div>
              <div>
                <label>Selected background image URL</label>
                <input
                  style={input}
                  value={cfg.panel.imageUrl}
                  onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, imageUrl: e.target.value } })}
                />
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label>
                <input
                  type="checkbox"
                  checked={cfg.panel.enabled}
                  onChange={(e) => setCfg({ ...cfg, panel: { ...cfg.panel, enabled: e.target.checked } })}
                />{" "}
                Panel enabled
              </label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Store Background Image Library</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8 }}>
              <input
                style={input}
                placeholder="Image URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
              <input
                style={input}
                placeholder="Label (optional)"
                value={newImageLabel}
                onChange={(e) => setNewImageLabel(e.target.value)}
              />
              <button onClick={addPanelImage} style={{ ...input, width: "auto", cursor: "pointer" }}>Add</button>
            </div>

            {cfg.panel.imageLibrary.length ? (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {cfg.panel.imageLibrary.map((img) => (
                  <div key={img.url} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 8, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#ffd6d6", fontWeight: 700 }}>{img.label || "Store background"}</div>
                      <div style={{ color: "#ff9f9f", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis" }}>{img.url}</div>
                    </div>
                    <button onClick={() => setPanelBackground(img.url)} style={{ ...input, width: "auto", cursor: "pointer" }}>
                      {cfg.panel.imageUrl === img.url ? "Selected" : "Select"}
                    </button>
                    <button onClick={() => removePanelImage(img.url)} style={{ ...input, width: "auto", cursor: "pointer" }}>Remove</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, color: "#ff9f9f", fontSize: 12 }}>No images in library yet.</div>
            )}

            {cfg.panel.imageUrl ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ color: "#ffb3b3", marginBottom: 4, fontSize: 12 }}>Current background preview</div>
                <img src={cfg.panel.imageUrl} alt="Store background preview" style={{ maxWidth: "100%", borderRadius: 8, border: "1px solid #5f0000" }} />
              </div>
            ) : null}
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Policies</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label>Max items per purchase</label>
                <input
                  style={input}
                  type="number"
                  value={cfg.policies.maxItemsPerPurchase}
                  onChange={(e) => setCfg({ ...cfg, policies: { ...cfg.policies, maxItemsPerPurchase: Number(e.target.value || 1) } })}
                />
              </div>
              <div>
                <label>Require staff approval</label><br />
                <input
                  type="checkbox"
                  checked={cfg.policies.requireStaffApproval}
                  onChange={(e) => setCfg({ ...cfg, policies: { ...cfg.policies, requireStaffApproval: e.target.checked } })}
                />
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={cfg.policies.allowRoleStacking}
                  onChange={(e) => setCfg({ ...cfg, policies: { ...cfg.policies, allowRoleStacking: e.target.checked } })}
                />{" "}
                Allow role stacking
              </label>
            </div>
          </div>

          <div style={box}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Store Items</h3>
            {cfg.items.map((item, i) => (
              <div key={item.id || i} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, marginBottom: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: 8 }}>
                  <input
                    style={input}
                    placeholder="Name"
                    value={item.name}
                    onChange={(e) => updateItem(i, { name: e.target.value })}
                  />
                  <select
                    style={input}
                    value={item.type}
                    onChange={(e) => updateItem(i, { type: e.target.value as StoreItem["type"] })}
                  >
                    <option value="item">Item</option>
                    <option value="role">Role</option>
                    <option value="perk">Perk</option>
                  </select>
                  <input
                    style={input}
                    type="number"
                    placeholder="Price"
                    value={item.priceCoins}
                    onChange={(e) => updateItem(i, { priceCoins: Number(e.target.value || 0) })}
                  />
                  <input
                    style={input}
                    type="number"
                    placeholder="Stock (-1 infinite)"
                    value={item.stock}
                    onChange={(e) => updateItem(i, { stock: Number(e.target.value || -1) })}
                  />
                  <button onClick={() => removeItem(i)} style={{ ...input, width: "auto", cursor: "pointer" }}>Remove</button>
                </div>

                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <textarea
                    style={{ ...input, minHeight: 58 }}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                  />
                  <div>
                    <select
                      style={input}
                      value={item.roleId}
                      onChange={(e) => updateItem(i, { roleId: e.target.value })}
                      disabled={item.type !== "role"}
                    >
                      <option value="">{item.type === "role" ? "Select role" : "Role not needed"}</option>
                      {roles.map((r) => <option key={r.id} value={r.id}>@{r.name}</option>)}
                    </select>
                    <div style={{ marginTop: 8 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.oneTime}
                          onChange={(e) => updateItem(i, { oneTime: e.target.checked })}
                        />{" "}
                        One-time purchase
                      </label>{" "}
                      <label style={{ marginLeft: 12 }}>
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          onChange={(e) => updateItem(i, { enabled: e.target.checked })}
                        />{" "}
                        Enabled
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addItem} style={{ ...input, width: "auto", cursor: "pointer" }}>+ Add Item</button>
          </div>

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 700 }}>
            {saving ? "Saving..." : "Save Store"}
          </button>
          {msg ? <div style={{ marginTop: 10, color: "#ffd1d1" }}>{msg}</div> : null}
        </>
      )}
    </div>
  );
}
