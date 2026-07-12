import type { Role } from '../types';

export const roleDashboardPaths: Record<Role, string> = {
  fleet_manager: '/app/dashboard',
  dispatcher: '/app/trips',
  safety_officer: '/app/trips',
  financial_analyst: '/app/dashboard',
  cargo_control_officer: '/cco/dashboard',
};

export function getRoleDashboardPath(role: Role): string {
  return roleDashboardPaths[role];
}
