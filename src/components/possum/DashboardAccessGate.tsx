"use client";

import { useEffect, useState } from "react";

type AccessConfig = {
  active: boolean;
  ownerBypass: boolean;
  adminRoleIds: string[];
  staffRoleIds: string[];
  allowedUserIds: string[];
  deniedUserIds: string[];
};

const DEFAULT_CFG: AccessConfig = {
  active: false,
  ownerBypass: true,
  adminRoleIds: [],
  staffRoleIds: [],
  allowedUserIds: [],
  deniedUserIds: [],
};

function parseCsvIds(raw: string): string[] {
  return String(raw || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function hasIntersection(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  const set = new Set(a);
  return b.some((x) => set.has(x));
}

function getContext() {
  if (typeof window === "undefined") {
    return { guildId: "", userId: "", userRoleIds: [] as string[] };
  }

  const sp = new URLSearchParams(window.location.search);
  const guildId = String(sp.get("guildId") || localStorage.getItem("activeGuildId") || "").trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);

  const userId = String(
    sp.get("userId") ||
      sp.get("uid") ||
      localStorage.getItem("dashboardUserId") ||
      ""
  ).trim();
  if (userId) localStorage.setItem("dashboardUserId", userId);

  const roleCsv = String(
    sp.get("roleIds") ||
      sp.get("roles") ||
      localStorage.getItem("dashboardUserRoleIds") ||
      ""
  ).trim();
  if (roleCsv) localStorage.setItem("dashboardUserRoleIds", roleCsv);

  return {
    guildId,
    userId,
    userRoleIds: parseCsvIds(roleCsv),
  };
}

export default function DashboardAccessGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(true);
  const [reason, setReason] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { guildId, userId, userRoleIds } = getContext();

      if (!guildId) {
        if (!mounted) return;
        setReady(true);
        setAllowed(true);
        return;
      }

      try {
        const cfgRes = await fetch(`/api/setup/access-control-config?guildId=${encodeURIComponent(guildId)}`, {
          cache: "no-store",
        });
        const cfgJson = await cfgRes.json().catch(() => ({}));
        const cfg = { ...DEFAULT_CFG, ...(cfgJson?.config || {}) } as AccessConfig;

        if (!cfg.active) {
          if (!mounted) return;
          setAllowed(true);
          setReady(true);
          return;
        }

        if (userId && cfg.deniedUserIds.includes(userId)) {
          if (!mounted) return;
          setAllowed(false);
          setReason("Your user is explicitly denied in dashboard access policy.");
          setReady(true);
          return;
        }

        if (userId && cfg.allowedUserIds.includes(userId)) {
          if (!mounted) return;
          setAllowed(true);
          setReady(true);
          return;
        }

        const roleAllowed = hasIntersection(userRoleIds, [...cfg.adminRoleIds, ...cfg.staffRoleIds]);
        if (roleAllowed) {
          if (!mounted) return;
          setAllowed(true);
          setReady(true);
          return;
        }

        if (cfg.ownerBypass && userId) {
          const accessRes = await fetch(
            `/api/bot/guild-access?guildId=${encodeURIComponent(guildId)}&userId=${encodeURIComponent(userId)}`,
            { cache: "no-store" }
          );
          const accessJson = await accessRes.json().catch(() => ({}));
          if (accessRes.ok && accessJson?.access === true) {
            if (!mounted) return;
            setAllowed(true);
            setReady(true);
            return;
          }
        }

        const hasIdentity = Boolean(userId) || userRoleIds.length > 0;
        const hasRules =
          cfg.allowedUserIds.length > 0 ||
          cfg.deniedUserIds.length > 0 ||
          cfg.adminRoleIds.length > 0 ||
          cfg.staffRoleIds.length > 0;

        if (!hasIdentity) {
          if (!mounted) return;
          // Fail-open with explicit warning when identity context is unavailable.
          setAllowed(true);
          if (hasRules) {
            setWarning(
              "Dashboard identity context missing (userId/roleIds). Access policy was not fully enforced for this session."
            );
          }
          setReady(true);
          return;
        }

        if (!mounted) return;
        setAllowed(false);
        setReason("Your account does not match the configured staff access rules for this guild.");
        setReady(true);
      } catch {
        if (!mounted) return;
        setAllowed(true);
        setWarning("Access policy check failed. Continuing in safe-open mode for this session.");
        setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          border: "1px solid #6f0000",
          borderRadius: 12,
          padding: 12,
          background: "rgba(120,0,0,0.10)",
          color: "#ffd3d3",
        }}
      >
        Checking dashboard access policy...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div
        style={{
          border: "1px solid #8f0000",
          borderRadius: 12,
          padding: 16,
          background: "rgba(120,0,0,0.16)",
          color: "#ffd3d3",
          maxWidth: 860,
        }}
      >
        <h2 style={{ marginTop: 0, color: "#ff5555", letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Access denied
        </h2>
        <p style={{ marginBottom: 12 }}>{reason || "Dashboard access denied by role policy."}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/guilds"
            style={{
              border: "1px solid #7a0000",
              borderRadius: 10,
              padding: "8px 12px",
              color: "#ffd0d0",
              textDecoration: "none",
              fontWeight: 700,
              background: "#1a0000",
            }}
          >
            Return to Guild Select
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {warning ? (
        <div
          style={{
            border: "1px solid #8a4d00",
            borderRadius: 10,
            padding: 10,
            background: "rgba(120,70,0,0.16)",
            color: "#ffd9a3",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          {warning}
        </div>
      ) : null}
      {children}
    </>
  );
}
