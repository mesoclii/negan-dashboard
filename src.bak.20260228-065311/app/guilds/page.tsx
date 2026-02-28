"use client";

import { useEffect, useState } from "react";

type GuildRow = {
  id: string;
  name: string;
  icon: string | null;
};

type Api = {
  success?: boolean;
  guilds?: GuildRow[];
  error?: string;
};

function initials(name: string) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");
}

export default function GuildSelectPage() {
  const [guilds, setGuilds] = useState<GuildRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/bot/guilds", { cache: "no-store" });
        const data = (await res.json()) as Api;

        if (cancelled) return;
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to load guilds");
        }

        setGuilds(Array.isArray(data.guilds) ? data.guilds : []);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load guilds");
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="possum-bg" style={{ minHeight: "100vh", padding: "28px 20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          className="possum-red possum-glow"
          style={{
            textAlign: "center",
            fontSize: 34,
            fontWeight: 950,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 8
          }}
        >
          Select Guild
        </div>

        <div
          className="possum-soft"
          style={{
            textAlign: "center",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontSize: 12,
            marginBottom: 24
          }}
        >
          Choose a server to enter dashboard context
        </div>

        {loading ? <div className="possum-soft" style={{ textAlign: "center" }}>Loading guilds...</div> : null}
        {error ? <div style={{ color: "#ff7a7a", textAlign: "center", marginBottom: 16 }}>{error}</div> : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14
          }}
        >
          {guilds.map((g) => (
            <div
              key={g.id}
              style={{
                border: "1px solid rgba(255,0,0,0.35)",
                borderRadius: 12,
                padding: 12,
                background: "rgba(0,0,0,0.45)",
                boxShadow: "0 0 16px rgba(255,0,0,0.11)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {g.icon ? (
                  <img
                    src={g.icon}
                    alt={g.name}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,0,0,0.45)",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      border: "1px solid rgba(255,0,0,0.45)",
                      display: "grid",
                      placeItems: "center",
                      color: "#ff9e9e",
                      fontSize: 12,
                      fontWeight: 900,
                      letterSpacing: "0.08em"
                    }}
                  >
                    {initials(g.name)}
                  </div>
                )}

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: 15,
                      letterSpacing: "0.04em",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                    title={g.name}
                  >
                    {g.name}
                  </div>
                  <div className="possum-soft" style={{ fontSize: 10, letterSpacing: "0.08em" }}>
                    {g.id}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <a
                  href={`/dashboard?guildId=${encodeURIComponent(g.id)}`}
                  className="possum-pill"
                  style={{
                    textDecoration: "none",
                    display: "inline-block",
                    padding: "7px 11px",
                    fontSize: 11,
                    letterSpacing: "0.16em"
                  }}
                >
                  Open
                </a>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && guilds.length === 0 ? (
          <div className="possum-soft" style={{ textAlign: "center", marginTop: 14 }}>
            No guilds found. Add IDs in `DASHBOARD_GUILD_IDS`.
          </div>
        ) : null}
      </div>
    </div>
  );
}
