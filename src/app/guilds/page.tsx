"use client";

import { useEffect, useMemo, useState } from "react";
import { FALLBACK_GUILD_NAMES, MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

type Guild = {
  id: string;
  name: string;
  icon?: string | null;
  botPresent?: boolean;
  memberCount?: number | null;
  accessReason?: string | null;
};

type PolicyState = {
  primaryGuildId: string;
  gamesBaselineGuildId: string;
  stockLockNonPrimary: boolean;
};

function badgeStyle(kind: "primary" | "games" | "stock") {
  if (kind === "primary") {
    return {
      border: "1px solid #0f7a0f",
      color: "#b8ffb8",
      background: "rgba(16,100,16,0.2)",
    } as const;
  }
  if (kind === "games") {
    return {
      border: "1px solid #0f5f7a",
      color: "#b8f4ff",
      background: "rgba(8,82,112,0.22)",
    } as const;
  }
  return {
    border: "1px solid #8a4d00",
    color: "#ffd9a3",
    background: "rgba(120,70,0,0.18)",
  } as const;
}

function actionButtonStyle(tone: "accent" | "muted" | "open") {
  if (tone === "accent") {
    return {
      border: "1px solid #ff3b3b",
      color: "#ffe0e0",
      background: "rgba(140,0,0,0.35)",
    } as const;
  }
  if (tone === "open") {
    return {
      border: "1px solid #7a0000",
      color: "#fff5f5",
      background: "transparent",
    } as const;
  }
  return {
    border: "1px solid #8a4d00",
    color: "#ffd9a3",
    background: "rgba(120,70,0,0.18)",
  } as const;
}

function readStoredDashboardUserId() {
  if (typeof window === "undefined") return "";
  return String(localStorage.getItem("dashboardUserId") || MASTER_OWNER_USER_ID).trim();
}

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [policy, setPolicy] = useState<PolicyState>({
    primaryGuildId: "1431799056211906582",
    gamesBaselineGuildId: "1336178965202599936",
    stockLockNonPrimary: false,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const userId = String(
        params.get("userId") ||
        params.get("uid") ||
        localStorage.getItem("dashboardUserId") ||
        MASTER_OWNER_USER_ID
      ).trim();
      const roleIds = String(
        params.get("roleIds") ||
        params.get("roles") ||
        localStorage.getItem("dashboardUserRoleIds") ||
        ""
      ).trim();

      if (userId) localStorage.setItem("dashboardUserId", userId);
      if (roleIds) localStorage.setItem("dashboardUserRoleIds", roleIds);
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const policyRes = await fetch("/api/bot/enforce-stock-policy?dryRun=true", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun: true }),
        }).catch(() => null);

        if (policyRes) {
          const p = await policyRes.json().catch(() => ({}));
          if (p?.primaryGuildId) {
            setPolicy({
              primaryGuildId: String(p.primaryGuildId),
              gamesBaselineGuildId: String(p.gamesBaselineGuildId || "1336178965202599936"),
              stockLockNonPrimary: Boolean(p.stockLockNonPrimary),
            });
          }
        }

        const params = new URLSearchParams();
        const actorUserId = readStoredDashboardUserId();
        if (actorUserId) params.set("userId", actorUserId);

        const res = await fetch(`/api/bot/guilds${params.toString() ? `?${params.toString()}` : ""}`, { cache: "no-store" });
        const text = await res.text();

        let json: any = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(text?.slice(0, 180) || "Invalid API response");
        }

        if (!res.ok || json?.success === false) {
          throw new Error(json?.error || `Guild API failed (${res.status})`);
        }

        const list = Array.isArray(json?.guilds) ? json.guilds : [];
        const merged = new Map<string, Guild>();
        for (const guild of list) {
          merged.set(String(guild.id), guild);
        }
        setInviteUrl(typeof json?.inviteUrl === "string" ? json.inviteUrl : "");
        for (const [guildId, guildName] of Object.entries(FALLBACK_GUILD_NAMES)) {
          if (!merged.has(guildId)) {
            merged.set(guildId, { id: guildId, name: guildName, icon: null, botPresent: false });
          }
        }
        setGuilds([...merged.values()]);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load guilds.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const byPrimary = useMemo(() => {
    return [...guilds].sort((a, b) => {
      const rank = (guildId: string) => {
        if (guildId === policy.primaryGuildId) return 0;
        if (guildId === policy.gamesBaselineGuildId) return 1;
        return 2;
      };
      const ap = rank(a.id);
      const bp = rank(b.id);
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
  }, [guilds, policy.gamesBaselineGuildId, policy.primaryGuildId]);

  function openGuild(guildId: string, guildName: string) {
    localStorage.setItem("activeGuildId", guildId);
    localStorage.setItem("activeGuildName", guildName || guildId);

    const userId = String(localStorage.getItem("dashboardUserId") || "").trim();
    const roleIds = String(localStorage.getItem("dashboardUserRoleIds") || "").trim();
    const next = new URLSearchParams({ guildId });
    if (userId) next.set("userId", userId);
    if (roleIds) next.set("roleIds", roleIds);

    window.location.href = `/dashboard?${next.toString()}`;
  }

  async function applyGuildMode(guildId: string, guildName: string, mode: "builtIn" | "stock") {
    const nextActionKey = `${guildId}:${mode}`;
    try {
      setActionKey(nextActionKey);
      setMsg("");

      const res = await fetch("/api/bot/guild-baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          mode,
          userId: readStoredDashboardUserId(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || `Guild baseline failed (${res.status})`);
      }

      setMsg(
        mode === "stock"
          ? `${guildName} reset to stock off.`
          : `${guildName} baseline applied.`
      );
    } catch (e: any) {
      setMsg(e?.message || "Failed to apply guild baseline.");
    } finally {
      setActionKey("");
    }
  }

  return (
    <div style={{ color: "#ff5252", padding: 24 }}>
      <h1 style={{ marginTop: 0, letterSpacing: "0.16em", textTransform: "uppercase" }}>Select Guild</h1>
      <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.9 }}>
        Saviors = full baseline. Alexandria = public baseline. Other guilds start stock off, but stay fully editable.
      </p>
      {loading ? <p>Loading...</p> : null}
      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}
      {inviteUrl ? (
        <div
          style={{
            marginBottom: 12,
            maxWidth: 1040,
            border: "1px solid #6f0000",
            borderRadius: 12,
            background: "rgba(120,0,0,0.08)",
            padding: 14,
            color: "#ffd7d7",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 900 }}>Add Negan To Another Server</div>
            <div style={{ fontSize: 12, opacity: 0.76 }}>
              Live guilds appear here automatically once the bot joins. External admin-owned guild discovery still needs Discord OAuth.
            </div>
          </div>
          <a
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              border: "1px solid #7a0000",
              color: "#fff0f0",
              textDecoration: "none",
              background: "rgba(140,0,0,0.32)",
            }}
          >
            Invite Bot
          </a>
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12, maxWidth: 1040 }}>
        {byPrimary.map((g) => {
          const isPrimary = g.id === policy.primaryGuildId;
          const isGamesBaseline = g.id === policy.gamesBaselineGuildId;
          const isEditableBaseline = isPrimary || isGamesBaseline;
          const badge = isPrimary
            ? "PRIMARY BASELINE (ALL ON)"
            : isGamesBaseline
              ? "PUBLIC BASELINE (SECURITY OFF)"
              : "STOCK DEFAULT (STARTS OFF)";
          const kind = isPrimary ? "primary" : isGamesBaseline ? "games" : "stock";

          return (
            <div
              key={g.id}
              style={{
                textAlign: "left",
                border: "1px solid #6f0000",
                borderRadius: 12,
                background: "rgba(120,0,0,0.08)",
                color: "#ffd7d7",
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 4 }}>{g.name}</div>
              <div style={{ fontSize: 12, opacity: 0.72 }}>Guild {g.id}</div>
              <div style={{ fontSize: 12, opacity: 0.72 }}>
                {g.botPresent === false
                  ? "Bot not detected in this guild yet."
                  : g.memberCount
                    ? `${g.memberCount} members`
                    : "Bot connected"}
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "inline-block",
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  ...badgeStyle(kind),
                }}
              >
                {badge}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {isEditableBaseline ? (
                  <button
                    onClick={() => applyGuildMode(g.id, g.name, "builtIn")}
                    disabled={actionKey === `${g.id}:builtIn`}
                    style={{
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: actionKey === `${g.id}:builtIn` ? "wait" : "pointer",
                      ...actionButtonStyle("accent"),
                    }}
                  >
                    {actionKey === `${g.id}:builtIn`
                      ? "Applying..."
                      : isPrimary
                        ? "Restore Baseline"
                        : "Turn On Baseline"}
                  </button>
                ) : null}

                {!isPrimary ? (
                  <button
                    onClick={() => applyGuildMode(g.id, g.name, "stock")}
                    disabled={actionKey === `${g.id}:stock`}
                    style={{
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: actionKey === `${g.id}:stock` ? "wait" : "pointer",
                      opacity: 1,
                      ...actionButtonStyle("muted"),
                    }}
                    title="Reset this guild to stock off."
                  >
                    {actionKey === `${g.id}:stock` ? "Turning Off..." : "Turn Off"}
                  </button>
                ) : null}

                {g.botPresent === false && inviteUrl ? (
                  <a
                    href={inviteUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: "none",
                      ...actionButtonStyle("open"),
                    }}
                  >
                    Invite
                  </a>
                ) : (
                  <button
                    onClick={() => openGuild(g.id, g.name)}
                    style={{
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      ...actionButtonStyle("open"),
                    }}
                  >
                    Open
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
