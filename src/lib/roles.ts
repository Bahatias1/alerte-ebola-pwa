import type { UserRole } from '../types';

/** Canonical role ladder aligned with admin (legacy aliases mapped). */
export type CanonicalRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'HEALTH_AGENT'
  | 'LABORATORY'
  | 'USER';

const ROLE_RANK: Record<CanonicalRole, number> = {
  SUPER_ADMIN: 50,
  ADMIN: 40,
  MODERATOR: 30,
  HEALTH_AGENT: 20,
  LABORATORY: 15,
  USER: 10,
};

export function normalizeRole(role: UserRole | string | undefined | null): CanonicalRole {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'SUPER_ADMIN';
    case 'ADMIN':
    case 'ADMIN_SANTE':
      return 'ADMIN';
    case 'SUPERVISOR':
    case 'MODERATOR':
      return 'MODERATOR';
    case 'HEALTH_AGENT':
      return 'HEALTH_AGENT';
    case 'LABORATORY':
      return 'LABORATORY';
    default:
      return 'USER';
  }
}

export function hasMinimumRole(
  role: UserRole | string | undefined | null,
  minimum: CanonicalRole
): boolean {
  return ROLE_RANK[normalizeRole(role)] >= ROLE_RANK[minimum];
}

/** Official investigation fiches — field agents and above (not public citizens). */
export function canAccessOfficialForms(role: UserRole | string | undefined | null): boolean {
  const r = normalizeRole(role);
  return r === 'HEALTH_AGENT' || r === 'MODERATOR' || r === 'ADMIN' || r === 'SUPER_ADMIN' || r === 'LABORATORY';
}

export function canAccessAgentPortal(role: UserRole | string | undefined | null): boolean {
  return hasMinimumRole(role, 'HEALTH_AGENT') || normalizeRole(role) === 'LABORATORY';
}
