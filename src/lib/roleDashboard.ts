import type { Role } from '../types';

export const roleDashboardPaths: Record<Role, string> = {
  fleet_manager: '/dashboard/fleet',
  dispatcher: '/dashboard/dispatch',
  safety_officer: '/dashboard/safety',
  financial_analyst: '/dashboard/finance',
};

export function getRoleDashboardPath(role: Role): string {
  return roleDashboardPaths[role];
}
