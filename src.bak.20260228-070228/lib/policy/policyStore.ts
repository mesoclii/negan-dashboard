import { RolePolicy } from "./rolePolicy";

const policyMap: Record<string, RolePolicy> = {};

export function getPolicy(roleId: string): RolePolicy | null {
  return policyMap[roleId] || null;
}

export function setPolicy(policy: RolePolicy) {
  policyMap[policy.roleId] = policy;
}

export function getAllPolicies() {
  return Object.values(policyMap);
}
