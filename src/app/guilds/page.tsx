"use client";

import { useEffect, useMemo, useState } from "react";
import { FALLBACK_GUILD_NAMES, MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

type Guild = {
  id: string;
  name: string;
  icon?: string | null;
  iconUrl?: string | null;
  botPresent?: boolean;
  memberCount?: number | null;
  accessReason?: string | null;
  manageable?: boolean;
  owner?: boolean;
};

type PolicyState = {
  primaryGuildId: string;
  gamesBaselineGuildId: string;
  stockLockNonPrimary: boolean;
};

type DiscordUser = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
};

function badgeStyle(kind: "primary" | "games" | "stock" | "oauth") {
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
  if (kind === "oauth") {
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

function actionButtonStyle(tone: "accent" | "muted" | "open" | "oauth") {
  if (tone === "accent") {
    return {
      border: "1px solid #ff3b3b",
      color: "#ffe0e0",
      background: "rgba(140,0,0,0.35)",
    } as const;
  }
  if (tone === "oauth") {
    return {
      border: "1px solid #0f5f7a",
      color: "#d7f7ff",
      background: "rgba(8,82,112,0.28)",
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

function buildInviteUrl(baseUrl: string, guildId: string) {
  if (!baseUrl) return "";
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("guild_id", guildId);
    url.searchParams.set("disable_guild_select", "true");
    return url.toString();
  } catch {
    return baseUrl;
  }
}

function resolveGuildIcon(guild: Guild) {
  if (guild.iconUrl) return guild.iconUrl;
  if (guild.icon) return guild.icon;
  return null;
}

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [oauthLoggedIn, setOauthLoggedIn] = useState(false);
  const [oauthUser, setOauthUser] = useState<DiscordUser | null>(null);
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
      setLoading(true);
      setMsg("");

      try {
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

        const [oauthRes, installedRes] = await Promise.all([
          fetch("/api/guilds", { cache: "no-store" }).catch(() => null),
          fetch("/api/guilds/installed", { cache: "no-store" }).catch(() => null),
        ]);

        const oauthJson = oauthRes ? await oauthRes.json().catch(() => ({})) : {};
        const installedJson = installedRes ? await installedRes.json().catch(() => ({})) : {};

        const oauthUserValue = oauthJson?.user && typeof oauthJson.user.id === "string"
          ? {
              id: String(oauthJson.user.id),
              username: String(oauthJson.user.username || "Discord User"),
              globalName: oauthJson.user.globalName ?? null,
              avatar: oauthJson.user.avatar ?? null,
            }
          : null;

        setOauthConfigured(Boolean(oauthJson?.oauthConfigured));
        setOauthLoggedIn(Boolean(oauthJson?.loggedIn));
        setOauthUser(oauthUserValue);

        if (oauthUserValue?.id && typeof window !== "undefined") {
          localStorage.setItem("dashboardUserId", oauthUserValue.id);
        }

        const merged = new Map<string, Guild>();

        const installedGuilds = Array.isArray(installedJson?.guilds) ? installedJson.guilds : [];
        for (const guild of installedGuilds) {
          const id = String(guild?.id || "").trim();
          if (!id) continue;
          merged.set(id, {
            id,
            name: String(guild?.name || id),
            icon: guild?.icon || null,
            botPresent: guild?.botPresent !== false,
            memberCount: Number(guild?.memberCount || 0),
            accessReason: guild?.accessReason || null,
            manageable: true,
          });
        }

        const adminGuilds = Array.isArray(oauthJson?.guilds) ? oauthJson.guilds : [];
        for (const guild of adminGuilds) {
          const id = String(guild?.id || "").trim();
          if (!id) continue;
          const existing = merged.get(id);
          merged.set(id, {
            ...existing,
            id,
            name: String(guild?.name || existing?.name || id),
            icon: guild?.icon || existing?.icon || null,
            iconUrl: guild?.iconUrl || existing?.iconUrl || null,
            botPresent: existing?.botPresent ?? false,
            memberCount: existing?.memberCount ?? null,
            accessReason: existing?.accessReason || "oauth_manage_guild",
            manageable: true,
            owner: guild?.owner === true,
          });
        }

        setInviteUrl(typeof installedJson?.inviteUrl === "string" ? installedJson.inviteUrl : "");

        for (const [guildId, guildName] of Object.entries(FALLBACK_GUILD_NAMES)) {
          if (!merged.has(guildId)) {
            merged.set(guildId, {
              id: guildId,
              name: guildName,
              icon: null,
              botPresent: false,
              manageable: false,
            });
          }
        }

        if (installedRes && !installedRes.ok) {
          setMsg(installedJson?.error || `Installed guild API failed (${installedRes.status})`);
        } else if (oauthRes && !oauthRes.ok && oauthJson?.error) {
          setMsg(oauthJson.error);
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
      if ((a.botPresent ? 1 : 0) !== (b.botPresent ? 1 : 0)) {
        return a.botPresent ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [guilds, policy.gamesBaselineGuildId, policy.primaryGuildId]);

  const summary = useMemo(() => {
    const installed = byPrimary.filter((guild) => guild.botPresent !== false).length;
    const missing = byPrimary.filter((guild) => guild.botPresent === false && guild.manageable).length;
    return {
      installed,
      missing,
      total: byPrimary.length,
    };
  }, [byPrimary]);

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

      setMsg(mode === "stock" ? `${guildName} reset to stock off.` : `${guildName} baseline applied.`);
    } catch (e: any) {
      setMsg(e?.message || "Failed to apply guild baseline.");
    } finally {
      setActionKey("");
    }
  }

  return (
    <div
      style={{
        color: "#ff5252",
        minHeight: "100vh",
        padding: 24,
        background:
          "radial-gradient(circle at top, rgba(110,0,0,0.26) 0%, rgba(12,0,0,0.94) 32%, rgba(0,0,0,1) 100%)",
      }}
    >
      <div style={{ maxWidth: 1420 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: "clamp(2.3rem, 6vw, 4.6rem)", letterSpacing: "0.16em", textTransform: "uppercase", lineHeight: 0.92 }}>
        Select Guild
      </h1>
      <p style={{ letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.9, fontSize: 14, maxWidth: 1100 }}>
        Saviors keeps the full original baseline. Alexandria stays public-ready with premium and Pokemon off. Other installed guilds now start on the standard ready baseline so owners only need to finish setup.
      </p>
      {loading ? <p>Loading...</p> : null}
      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div
        style={{
          marginBottom: 16,
          maxWidth: 1340,
          border: "1px solid #6f0000",
          borderRadius: 18,
          background: "linear-gradient(180deg, rgba(120,0,0,0.14), rgba(0,0,0,0.68))",
          padding: 18,
          color: "#ffd7d7",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: 900, fontSize: 24 }}>
            {oauthLoggedIn
              ? `Discord connected as ${oauthUser?.globalName || oauthUser?.username || oauthUser?.id}`
              : "Discord OAuth unlocks admin-owned guild discovery"}
          </div>
          <div style={{ fontSize: 14, opacity: 0.82, marginTop: 8, lineHeight: 1.6 }}>
            {oauthConfigured
              ? oauthLoggedIn
                ? "Open Dashboard appears for guilds the bot is in. Add Bot appears for servers you manage that do not have Possum yet."
                : "Login with Discord to see servers you manage, even if the bot is not installed there yet."
              : "Discord OAuth is not configured in the dashboard env yet, so only bot-installed guilds can be shown right now."}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            {[
              `Installed ${summary.installed}`,
              `Bot Missing ${summary.missing}`,
              `Visible ${summary.total}`,
            ].map((text) => (
              <span
                key={text}
                style={{
                  display: "inline-block",
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  border: "1px solid rgba(255,0,0,0.28)",
                  background: "rgba(120,0,0,0.18)",
                }}
              >
                {text}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/"
            style={{
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textDecoration: "none",
              ...actionButtonStyle("open"),
            }}
          >
            Control Room
          </a>
          <a
            href="/features"
            style={{
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textDecoration: "none",
              ...actionButtonStyle("open"),
            }}
          >
            Features
          </a>
          <a
            href="/status"
            style={{
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textDecoration: "none",
              ...actionButtonStyle("open"),
            }}
          >
            Status
          </a>
          {oauthConfigured && !oauthLoggedIn ? (
            <a
              href="/api/auth/discord/login"
              style={{
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
                ...actionButtonStyle("oauth"),
              }}
            >
              Login With Discord
            </a>
          ) : null}
          {oauthConfigured && oauthLoggedIn ? (
            <a
              href="/api/auth/logout"
              style={{
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                textDecoration: "none",
                ...actionButtonStyle("muted"),
              }}
            >
              Logout
            </a>
          ) : null}
          {inviteUrl ? (
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
          ) : null}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16, maxWidth: 1340 }}>
        {byPrimary.map((g) => {
          const isPrimary = g.id === policy.primaryGuildId;
          const isGamesBaseline = g.id === policy.gamesBaselineGuildId;
          const canConfigureLive = g.botPresent !== false;
          const badge = isPrimary
            ? "PRIMARY BASELINE (ALL ON)"
            : isGamesBaseline
              ? "PUBLIC BASELINE (SECURITY OFF)"
              : g.botPresent === false && g.manageable
                ? "ADMIN GUILD (BOT MISSING)"
                : "STANDARD READY (PREMIUM OFF)";
          const kind = isPrimary
            ? "primary"
            : isGamesBaseline
              ? "games"
              : g.botPresent === false && g.manageable
                ? "oauth"
                : "stock";
          const iconUrl = resolveGuildIcon(g);
          const inviteHref = buildInviteUrl(inviteUrl, g.id);

          return (
            <div
              key={g.id}
              style={{
                textAlign: "left",
                border: "1px solid #6f0000",
                borderRadius: 18,
                background: "linear-gradient(180deg, rgba(120,0,0,0.14), rgba(0,0,0,0.72))",
                color: "#ffd7d7",
                padding: 18,
                minHeight: 250,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 16,
                    border: "1px solid rgba(255,0,0,0.28)",
                    background: iconUrl
                      ? `center / cover no-repeat url(${iconUrl})`
                      : "linear-gradient(135deg, rgba(100,0,0,0.6), rgba(20,20,20,0.9))",
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 900, marginBottom: 4, fontSize: 24 }}>{g.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.72 }}>Guild {g.id}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, opacity: 0.8, minHeight: 38, lineHeight: 1.55 }}>
                {canConfigureLive
                  ? g.memberCount
                    ? `${g.memberCount} members`
                    : "Bot connected"
                  : g.manageable
                    ? "You manage this server. Add the bot to enable the dashboard."
                    : "Bot not detected in this guild yet."}
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "inline-block",
                  borderRadius: 999,
                  padding: "4px 12px",
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: "0.04em",
                  ...badgeStyle(kind),
                }}
              >
                {badge}
              </div>

              <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {canConfigureLive ? (
                  <button
                    onClick={() => applyGuildMode(g.id, g.name, "builtIn")}
                    disabled={actionKey === `${g.id}:builtIn`}
                    style={{
                      borderRadius: 999,
                      padding: "8px 14px",
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
                        : isGamesBaseline
                          ? "Refresh Baseline"
                          : "Turn On Baseline"}
                  </button>
                ) : null}

                {canConfigureLive && !isPrimary ? (
                  <button
                    onClick={() => applyGuildMode(g.id, g.name, "stock")}
                    disabled={actionKey === `${g.id}:stock`}
                    style={{
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: actionKey === `${g.id}:stock` ? "wait" : "pointer",
                      ...actionButtonStyle("muted"),
                    }}
                    title="Reset this guild to stock off."
                  >
                    {actionKey === `${g.id}:stock` ? "Turning Off..." : "Turn Off"}
                  </button>
                ) : null}

                {canConfigureLive ? (
                  <button
                    onClick={() => openGuild(g.id, g.name)}
                    style={{
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      ...actionButtonStyle("open"),
                    }}
                  >
                    Open
                  </button>
                ) : inviteHref ? (
                  <a
                    href={inviteHref}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: "none",
                      ...actionButtonStyle(g.manageable ? "oauth" : "open"),
                    }}
                  >
                    Add Bot
                  </a>
                ) : oauthConfigured && !oauthLoggedIn ? (
                  <a
                    href="/api/auth/discord/login"
                    style={{
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: "none",
                      ...actionButtonStyle("oauth"),
                    }}
                  >
                    Login
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
