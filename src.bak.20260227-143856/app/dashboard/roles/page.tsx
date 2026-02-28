"use client";

import { useEffect, useState } from "react";

export default function RolesPage() {
  const [guildId, setGuildId] = useState<string | null>(null);
  const [guildName, setGuildName] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("guildId");

    if (!id) {
      setError("Missing guildId in URL");
      return;
    }

    setGuildId(id);

    fetch(`/api/proxy/guild-data?guildId=${id}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setError("Failed to load guild data");
          return;
        }

        setGuildName(data.guild?.name || "");
        setRoles(data.roles || []);
      })
      .catch(() => {
        setError("API request failed");
      });

  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        ROLE CONTROL
      </h1>

      {error && (
        <div className="text-red-500 mb-6">{error}</div>
      )}

      {guildId && !error && (
        <>
          <div className="mb-6 text-gray-400">
            Guild: {guildName} ({guildId})
          </div>

          <div className="space-y-2">
            {roles.map(role => (
              <div
                key={role.id}
                className="flex justify-between items-center border border-red-800 bg-black p-3 rounded"
              >
                <span>{role.name}</span>
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: role.color }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
