"use client";

import { useState } from "react";
import { SplitModuleLayout } from "@/components/possum/SplitModuleLayout";
import { possum } from "@/styles/possumTheme";
import { RolePolicy, defaultRolePolicy } from "@/lib/policy/rolePolicy";
import { setPolicy } from "@/lib/policy/policyStore";

function PolicyEditor({ roleName }: { roleName: string }) {
  const [policy, setLocalPolicy] = useState<RolePolicy>({
    ...defaultRolePolicy,
    roleId: roleName,
  });

  function update<K extends keyof RolePolicy>(key: K, value: RolePolicy[K]) {
    setLocalPolicy({ ...policy, [key]: value });
  }

  function save() {
    setPolicy(policy);
    alert("Policy saved (DEV MODE)");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="possum-soft">XP Multiplier</div>
      <input
        type="number"
        value={policy.xpMultiplier}
        onChange={(e) => update("xpMultiplier", Number(e.target.value))}
      />

      <div className="possum-soft">Cooldown Reduction (seconds)</div>
      <input
        type="number"
        value={policy.cooldownReduction}
        onChange={(e) => update("cooldownReduction", Number(e.target.value))}
      />

      <div className="possum-soft">Heist Priority Weight</div>
      <input
        type="number"
        value={policy.heistPriority}
        onChange={(e) => update("heistPriority", Number(e.target.value))}
      />

      <label>
        <input
          type="checkbox"
          checked={policy.heistAccess}
          onChange={(e) => update("heistAccess", e.target.checked)}
        />
        Heist Access
      </label>

      <label>
        <input
          type="checkbox"
          checked={policy.ttsAccess}
          onChange={(e) => update("ttsAccess", e.target.checked)}
        />
        TTS Access
      </label>

      <label>
        <input
          type="checkbox"
          checked={policy.personaAccess}
          onChange={(e) => update("personaAccess", e.target.checked)}
        />
        Persona Access
      </label>

      <label>
        <input
          type="checkbox"
          checked={policy.customCommandAccess}
          onChange={(e) =>
            update("customCommandAccess", e.target.checked)
          }
        />
        Custom Command Access
      </label>

      <button
        onClick={save}
        style={{
          marginTop: 10,
          padding: "10px 14px",
          border: `1px solid ${possum.border}`,
          background: "rgba(255,0,0,0.16)",
          color: "#fff",
          fontWeight: 900,
          borderRadius: 10,
          cursor: "pointer",
        }}
      >
        Save Policy
      </button>
    </div>
  );
}

export default function VIPPage() {
  return (
    <SplitModuleLayout
      title="VIP / Access"
      sections={[
        {
          key: "supporter",
          label: "Supporter",
          content: <PolicyEditor roleName="supporter" />,
        },
        {
          key: "vip",
          label: "VIP",
          content: <PolicyEditor roleName="vip" />,
        },
        {
          key: "nitro",
          label: "Nitro Booster",
          content: <PolicyEditor roleName="nitro" />,
        },
      ]}
    />
  );
}
