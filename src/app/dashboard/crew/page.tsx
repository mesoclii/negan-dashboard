"use client";

import { useMemo, useState } from "react";
import EngineContractPanel from "@/components/possum/EngineContractPanel";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type CrewCfg = {
  enabled: boolean;
  maxCrews: number;
  creationCost: number;
  maxCrewSize: number;
  allowPublicRecruitment: boolean;
  recruitChannelId: string;
  inviteExpiryHours: number;
  crewRolePrefix: string;
};

const DEFAULT_CREW: CrewCfg = {
  enabled: true,
  maxCrews: 25,
  creationCost: 10000,
  maxCrewSize: 25,
  allowPublicRecruitment: true,
  recruitChannelId: "",
  inviteExpiryHours: 72,
  crewRolePrefix: "Crew",
};

const shell: React.CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1280 };
const card: React.CSSProperties = { border: "1px solid #6a0000", borderRadius: 12, background: "rgba(120,0,0,0.10)", padding: 14, marginBottom: 12 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "#0b0b0b", color: "#ffd8d8", border: "1px solid #7a0000", borderRadius: 8 };

export default function CrewEnginePage() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    channels,
    summary,
    details,
    loading,
    saving,
    message,
    save,
    runAction,
  } = useGuildEngineEditor<CrewCfg>("crew", DEFAULT_CREW);
  const [inviteCrewName, setInviteCrewName] = useState("");
  const [inviteTargetUserId, setInviteTargetUserId] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );

  const crewChoices = useMemo(() => {
    const detailBuckets = [
      Array.isArray(details?.crews) ? details.crews : [],
      Array.isArray(details?.leaderboard) ? details.leaderboard : [],
    ];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const bucket of detailBuckets) {
      for (const entry of bucket) {
        const raw =
          typeof entry?.title === "string" && entry.title.trim()
            ? entry.title.trim()
            : typeof entry?.name === "string" && entry.name.trim()
              ? entry.name.trim()
              : "";
        if (!raw) continue;
        const normalized = raw.replace(/^\[[^\]]+\]\s*/, "").trim();
        if (!normalized || seen.has(normalized.toLowerCase())) continue;
        seen.add(normalized.toLowerCase());
        out.push(normalized);
      }
    }
    return out;
  }, [details]);

  const pendingInvites = useMemo(
    () => (Array.isArray(details?.pendingInvites) ? details.pendingInvites : []),
    [details]
  );

  function normalizeUserId(value: string) {
    const match = String(value || "").match(/\d{16,20}/);
    return match ? match[0] : "";
  }

  async function sendInvite() {
    const targetUserId = normalizeUserId(inviteTargetUserId);
    if (!targetUserId) {
      setInviteMessage("Enter a member mention or Discord user ID.");
      return;
    }
    if (!inviteCrewName.trim()) {
      setInviteMessage("Choose the crew you want to invite them into.");
      return;
    }
    setInviteMessage("");
    const result = await runAction("inviteMember", {
      crewName: inviteCrewName.trim(),
      targetUserId,
      note: inviteNote.trim(),
    });
    if (result?.ok) {
      const delivery = [
        result?.delivery?.recruitChannelId ? "posted in the recruit lane" : "",
        result?.delivery?.dmSent ? "DM sent" : "",
      ].filter(Boolean);
      setInviteMessage(
        `Invite sent to ${targetUserId} for ${result.crewName}.${delivery.length ? ` ${delivery.join(" + ")}.` : ""}`
      );
      setInviteTargetUserId("");
      setInviteNote("");
    } else {
      setInviteMessage("Invite action failed.");
    }
  }

  if (!guildId) return <div style={{ ...shell, color: "#ff8a8a" }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={shell}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Crew Engine</h1>
      <div style={{ color: "#ff9c9c", marginTop: 6 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb0b0", fontSize: 12, marginTop: 4 }}>
        Real bot controls for crew creation cost, size limits, recruitment routing, and live crew state.
      </div>
      {message ? <div style={{ color: "#ffd27a", marginTop: 8 }}>{message}</div> : null}

      {loading ? (
        <div style={card}>Loading crew...</div>
      ) : (
        <>
          <EngineContractPanel
            engineKey="crew"
            intro="Crew is the identity and treasury layer for the GTA side of the bot. This surface controls how expensive it is to found a crew, how large crews can grow, and whether public recruiting stays open."
            related={[
              { label: "Dominion", route: "/dashboard/dominion", reason: "dominion raids, wars, and territory ownership resolve by crew identity" },
              { label: "Contracts", route: "/dashboard/contracts", reason: "crew-facing objectives should stay economically aligned with contract payouts" },
              { label: "Profile", route: "/dashboard/profile", reason: "crew status, rank, and member-facing identity should stay aligned with profile surfaces" },
            ]}
          />
          <EngineInsights summary={summary} details={details} />

          <section style={{ ...card, marginTop: 12 }}>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <label><input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg((p) => ({ ...p, enabled: e.target.checked }))} /> Crew Enabled</label>
              <label><input type="checkbox" checked={cfg.allowPublicRecruitment} onChange={(e) => setCfg((p) => ({ ...p, allowPublicRecruitment: e.target.checked }))} /> Allow public recruitment</label>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6, color: "#ff9c9c", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>Founding Rules</div>
                <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
                  Creation cost and max crews define how scarce crew ownership feels. If these are too soft, dominion and treasury loops lose value fast.
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6, color: "#ff9c9c", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>Recruitment Surface</div>
                <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
                  Public recruitment should only be on when a clear recruiting lane exists. Otherwise the engine should be staff-driven and routed through direct management commands.
                </div>
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6 }}>Max Crews</div>
                <input style={input} type="number" min={1} value={cfg.maxCrews} onChange={(e) => setCfg((p) => ({ ...p, maxCrews: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Creation Cost (coins)</div>
                <input style={input} type="number" min={0} value={cfg.creationCost} onChange={(e) => setCfg((p) => ({ ...p, creationCost: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Max Crew Size</div>
                <input style={input} type="number" min={1} value={cfg.maxCrewSize} onChange={(e) => setCfg((p) => ({ ...p, maxCrewSize: Number(e.target.value || 0) }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Crew Role Prefix</div>
                <input style={input} value={cfg.crewRolePrefix} onChange={(e) => setCfg((p) => ({ ...p, crewRolePrefix: e.target.value }))} />
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Invite Expiry (hours)</div>
                <input style={input} type="number" min={1} value={cfg.inviteExpiryHours} onChange={(e) => setCfg((p) => ({ ...p, inviteExpiryHours: Number(e.target.value || 1) }))} />
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12, alignItems: "end" }}>
              <div>
                <div style={{ marginBottom: 6 }}>Recruitment Channel</div>
                <select style={input} value={cfg.recruitChannelId || ""} onChange={(e) => setCfg((p) => ({ ...p, recruitChannelId: e.target.value }))}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}
                </select>
              </div>
              <div style={{ color: "#ffb2b2", fontSize: 12, lineHeight: 1.7 }}>
                Used as the public crew recruiting lane when recruitment stays enabled. Leave it blank if recruiting should remain controlled by staff only.
              </div>
            </div>
          </section>

          <section style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, alignItems: "end" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ marginBottom: 6, color: "#ff9c9c", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>Staff Invite Lane</div>
                <div style={{ color: "#ffd0d0", lineHeight: 1.7 }}>
                  Use this when a crew is staff-run or public recruitment is off. The bot sends a real invite the member can accept, and it honors the crew&apos;s live size limit.
                </div>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Crew Name</div>
                <input
                  list="crew-name-options"
                  style={input}
                  value={inviteCrewName}
                  onChange={(e) => setInviteCrewName(e.target.value)}
                  placeholder="Start typing a crew name"
                />
                <datalist id="crew-name-options">
                  {crewChoices.map((crewName) => <option key={crewName} value={crewName} />)}
                </datalist>
              </div>
              <div>
                <div style={{ marginBottom: 6 }}>Member Mention or ID</div>
                <input
                  style={input}
                  value={inviteTargetUserId}
                  onChange={(e) => setInviteTargetUserId(e.target.value)}
                  placeholder="@member or 123456789012345678"
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div style={{ marginBottom: 6 }}>Invite Note</div>
                <textarea
                  style={{ ...input, minHeight: 96 }}
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                  placeholder="Optional note about the crew or what they should know before joining."
                />
              </div>
              <div style={{ color: "#ffb2b2", fontSize: 12, lineHeight: 1.7 }}>
                Invite delivery uses the recruit channel when one is set and also tries DM. If buttons fail, the invited member can still use <code>/crew join</code>.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => void sendInvite()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                  {saving ? "Sending..." : "Send Crew Invite"}
                </button>
              </div>
              {inviteMessage ? <div style={{ gridColumn: "1 / -1", color: "#ffd27a" }}>{inviteMessage}</div> : null}
            </div>
          </section>

          {pendingInvites.length ? (
            <section style={card}>
              <div style={{ marginBottom: 10, color: "#ff9c9c", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12 }}>Pending Invites</div>
              <div style={{ display: "grid", gap: 8 }}>
                {pendingInvites.map((entry, index) => (
                  <div key={`${entry.title || "invite"}_${index}`} style={{ borderTop: index ? "1px solid #330000" : "none", paddingTop: index ? 8 : 0 }}>
                    <div style={{ color: "#ffdcdc", fontWeight: 700 }}>{entry.title || `Invite ${index + 1}`}</div>
                    <div style={{ color: "#ffbdbd", fontSize: 12, marginTop: 2 }}>{entry.value}</div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div style={{ ...card, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : "Save Crew"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
