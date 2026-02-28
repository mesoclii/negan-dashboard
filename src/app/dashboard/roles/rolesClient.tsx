"use client";

import { useEffect, useMemo, useState } from "react";

type RoleRow = {
  id: string;
  name: string;
  color?: string;
  position?: number;
  managed?: boolean;
  mentionable?: boolean;
  hoist?: boolean;
  permissions?: string;
};

export default function RolesClient({ guildId }: { guildId: string | null }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [guildName, setGuildName] = useState<string>("");
  const [roles, setRoles] = useState<RoleRow[]>([]);

  const hasGuild = !!guildId && String(guildId).trim().length > 0;

  useEffect(() => {
    if (!hasGuild) return;

    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const res = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(String(guildId))}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`API ${res.status}`);
        }

        const data = await res.json();

        if (cancelled) return;

        setGuildName(data?.guild?.name ?? "");
        const list: RoleRow[] = Array.isArray(data?.roles) ? data.roles : [];

        // Clean sort: highest role first, drop @everyone to bottom automatically
        const sorted = [...list].sort((a, b) => (b.position ?? 0) - (a.position ?? 0));
        setRoles(sorted);
      } catch (e: any) {
        if (cancelled) return;
        setErr(e?.message || "Failed to load roles");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasGuild, guildId]);

  const visibleRoles = useMemo(() => {
    // Don’t show empty names
    return roles.filter(r => (r.name ?? "").trim().length > 0);
  }, [roles]);

  if (!hasGuild) {
    return (
      <div className="possum-bg min-h-screen p-8">
        <div className="text-white text-lg">Missing guildId in URL</div>
        <div className="possum-soft mt-2 text-sm">
          Use: <span className="possum-red">/dashboard/roles?guildId=YOUR_ID</span>
        </div>
      </div>
    );
  }

  return (
    <div className="possum-bg min-h-screen p-8">
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="possum-red possum-glow text-3xl font-extrabold tracking-widest">
              ROLE CONTROL
            </div>
            <div className="possum-soft mt-2 text-sm">
              {guildName ? (
                <>
                  Guild: <span className="text-white">{guildName}</span>{" "}
                  <span className="opacity-60">({guildId})</span>
                </>
              ) : (
                <>
                  Guild ID: <span className="text-white">{guildId}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="possum-soft text-sm">Loading roles…</div>
            ) : (
              <div className="possum-soft text-sm">
                Loaded: <span className="text-white">{visibleRoles.length}</span>
              </div>
            )}
          </div>
        </div>

        {err && (
          <div className="mb-6 rounded-xl border border-red-800/50 bg-black/40 p-4">
            <div className="possum-red font-bold">Roles API error</div>
            <div className="possum-soft text-sm mt-1">{err}</div>
          </div>
        )}

        <div className="rounded-2xl border border-red-800/40 bg-black/35 p-4">
          <div className="possum-soft text-xs mb-3">
            (No “Position:” spam. No white page. Just the list, in-theme.)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleRoles.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-red-900/40 bg-black/45 p-3 hover:border-red-600/50 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-white font-semibold truncate">{r.name}</div>
                  <button
                    className="text-xs px-3 py-1 rounded-lg border border-red-800/50 bg-black/50 text-white hover:border-red-500/70"
                    onClick={() => navigator.clipboard.writeText(r.id)}
                    title="Copy Role ID"
                  >
                    Copy ID
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {r.managed ? (
                    <span className="px-2 py-1 rounded-md border border-red-800/40 bg-black/40 text-white/80">
                      managed
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-md border border-red-800/20 bg-black/30 text-white/60">
                      normal
                    </span>
                  )}
                  {r.mentionable ? (
                    <span className="px-2 py-1 rounded-md border border-red-800/40 bg-black/40 text-white/80">
                      mentionable
                    </span>
                  ) : null}
                  {r.hoist ? (
                    <span className="px-2 py-1 rounded-md border border-red-800/40 bg-black/40 text-white/80">
                      hoist
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {!loading && !err && visibleRoles.length === 0 && (
            <div className="possum-soft text-sm p-3">No roles returned.</div>
          )}
        </div>
      </div>
    </div>
  );
}
