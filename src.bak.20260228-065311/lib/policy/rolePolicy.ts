export type RolePolicy = {
  roleId: string;

  xpMultiplier: number;
  cooldownReduction: number;

  heistPriority: number;
  heistAccess: boolean;

  ttsAccess: boolean;
  ttsInstanceLimit: number;

  personaAccess: boolean;

  customCommandAccess: boolean;
};

export const defaultRolePolicy: RolePolicy = {
  roleId: "",

  xpMultiplier: 1,
  cooldownReduction: 0,

  heistPriority: 0,
  heistAccess: false,

  ttsAccess: false,
  ttsInstanceLimit: 0,

  personaAccess: false,

  customCommandAccess: false,
};
