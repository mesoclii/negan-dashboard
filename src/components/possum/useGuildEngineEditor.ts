"use client";

import { useEffect, useState } from "react";

export type GuildRole = { id: string; name: string; position?: number; color?: string };
export type GuildChannel = { id: string; name: string; type?: number | string; parentId?: string | null };
export type EngineSummaryItem = { label: string; value: string };
export type EngineDetailItem = { rank?: number; name?: string; title?: string; value: string };
export type EngineDetails = Record<string, EngineDetailItem[] | { title: string; value: string } | null | undefined>;

function resolveGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

export function useGuildEngineEditor<T>(engine: string, defaults: T) {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [config, setConfig] = useState<T>(defaults);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [summary, setSummary] = useState<EngineSummaryItem[]>([]);
  const [details, setDetails] = useState<EngineDetails>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setGuildId(resolveGuildId());
  }, []);

  async function reload(targetGuildId = guildId) {
    if (!targetGuildId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const [runtimeRes, guildRes] = await Promise.all([
        fetch(`/api/setup/runtime-engine?guildId=${encodeURIComponent(targetGuildId)}&engine=${encodeURIComponent(engine)}`, {
          cache: "no-store",
        }),
        fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(targetGuildId)}`, {
          cache: "no-store",
        }),
      ]);

      const runtimeJson = await runtimeRes.json().catch(() => ({}));
      const guildJson = await guildRes.json().catch(() => ({}));

      if (!runtimeRes.ok || runtimeJson?.success === false) {
        throw new Error(runtimeJson?.error || "Failed to load engine runtime");
      }

      setConfig({ ...(defaults as any), ...(runtimeJson?.config || {}) });
      setSummary(Array.isArray(runtimeJson?.summary) ? runtimeJson.summary : []);
      setDetails((runtimeJson?.details && typeof runtimeJson.details === "object") ? runtimeJson.details : {});

      const nextChannels: GuildChannel[] = Array.isArray(guildJson?.channels) ? guildJson.channels : [];
      const nextRoles: GuildRole[] = Array.isArray(guildJson?.roles) ? guildJson.roles : [];
      nextRoles.sort((a, b) => (Number(b.position || 0) - Number(a.position || 0)) || a.name.localeCompare(b.name));
      setChannels(nextChannels);
      setRoles(nextRoles);

      const nextGuildName = String(guildJson?.guild?.name || "").trim();
      if (nextGuildName) {
        setGuildName(nextGuildName);
        localStorage.setItem("activeGuildName", nextGuildName);
      }
    } catch (err: any) {
      setMessage(err?.message || "Failed to load engine.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [guildId, engine]);

  async function save(nextPatch?: Partial<T>) {
    if (!guildId) return;
    setSaving(true);
    setMessage("");
    try {
      const patch = { ...(config as any), ...(nextPatch || {}) };
      const res = await fetch("/api/setup/runtime-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, engine, patch }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || "Save failed");
      }
      setConfig({ ...(defaults as any), ...(json?.config || patch) });
      setSummary(Array.isArray(json?.summary) ? json.summary : []);
      setDetails((json?.details && typeof json.details === "object") ? json.details : {});
      setMessage("Saved.");
    } catch (err: any) {
      setMessage(err?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(action: string) {
    if (!guildId) return null;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/setup/runtime-engine-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, engine, action }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || "Action failed");
      }
      setConfig({ ...(defaults as any), ...(json?.config || config) });
      setSummary(Array.isArray(json?.summary) ? json.summary : []);
      setDetails((json?.details && typeof json.details === "object") ? json.details : {});
      setMessage("Action completed.");
      return json?.result ?? null;
    } catch (err: any) {
      setMessage(err?.message || "Action failed.");
      return null;
    } finally {
      setSaving(false);
    }
  }

  return {
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
    reload,
    runAction,
  };
}
