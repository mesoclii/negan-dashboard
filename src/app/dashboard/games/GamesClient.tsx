"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { resolveGuildContext } from "@/lib/liveRuntime";
import GameSocialClient from "@/components/possum/GameSocialClient";

const card: CSSProperties = {
  border: "1px solid rgba(255,0,0,.35)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(90,0,0,.10)",
  marginBottom: 12,
};

export default function GamesClient() {
  const [guildContext] = useState(() => resolveGuildContext());
  const guildId = guildContext.guildId;
  const guildName = guildContext.guildName;

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from `/guilds` first.</div>;
  }

  return (
    <div style={{ maxWidth: 1280, color: "#ffcaca" }}>
      <div style={card}>
        <div style={{ fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 900, color: "#ff2f2f" }}>
          Outside Games Control
        </div>
        <div style={{ color: "#ff9e9e", marginTop: 4 }}>Guild: {guildName || guildId}</div>
        <div style={{ color: "#ffb7b7", fontSize: 12, marginTop: 8 }}>
          This page is only for the external game stack: linked identities, Steam / Epic / Xbox / Battle.net / PlayStation / Rockstar accounts, live presence, provider stats, hours, gamer cards, and squad finder.
        </div>
        <div style={{ color: "#ffb7b7", fontSize: 12, marginTop: 8 }}>
          Cat Drop, Pokemon, Truth Dare, Crew, Dominion, and other server mini-game engines stay on their own dedicated dashboard pages.
        </div>
      </div>
      <GameSocialClient guildId={guildId} guildName={guildName} />
    </div>
  );
}
