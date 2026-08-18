import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import type { PermissionLevel, PermissionResource, UserRole } from '../types';

/**
 * Mirrors has_farm_permission()'s CASE block in supabase/schema.sql — keep
 * these in sync. This copy is for UI reflection only (hiding/showing
 * buttons); RLS is the actual security boundary, not this file.
 */
const RESOURCE_PERMISSIONS: Record<Exclude<UserRole, 'owner'>, Record<PermissionResource, PermissionLevel>> = {
  manager: {
    paddocks: 'write', livestock: 'write', crops: 'write', equipment: 'write',
    finance: 'write', inventory: 'write', tasks: 'write', devices: 'write',
    announcements: 'write', team: 'read', integrations: 'read',
  },
  operator: {
    paddocks: 'write', livestock: 'write', crops: 'write', equipment: 'write',
    finance: 'read', inventory: 'write', tasks: 'write', devices: 'write',
    announcements: 'write', team: 'read', integrations: 'none',
  },
  agronomist: {
    paddocks: 'read', livestock: 'read', crops: 'write', equipment: 'read',
    finance: 'none', inventory: 'read', tasks: 'write', devices: 'none',
    announcements: 'write', team: 'read', integrations: 'none',
  },
  accountant: {
    paddocks: 'read', livestock: 'read', crops: 'read', equipment: 'read',
    finance: 'write', inventory: 'read', tasks: 'read', devices: 'none',
    announcements: 'write', team: 'read', integrations: 'none',
  },
  readonly: {
    paddocks: 'read', livestock: 'read', crops: 'read', equipment: 'read',
    finance: 'read', inventory: 'read', tasks: 'read', devices: 'read',
    announcements: 'write', team: 'read', integrations: 'none',
  },
};

function effectiveLevel(role: UserRole, resource: PermissionResource, customPermissions?: Partial<Record<PermissionResource, PermissionLevel>>): PermissionLevel {
  if (role === 'owner') return 'write';
  const override = customPermissions?.[resource];
  if (override) return override;
  return RESOURCE_PERMISSIONS[role][resource];
}

export function canRead(role: UserRole, resource: PermissionResource, customPermissions?: Partial<Record<PermissionResource, PermissionLevel>>): boolean {
  const level = effectiveLevel(role, resource, customPermissions);
  return level === 'read' || level === 'write';
}

export function canWrite(role: UserRole, resource: PermissionResource, customPermissions?: Partial<Record<PermissionResource, PermissionLevel>>): boolean {
  return effectiveLevel(role, resource, customPermissions) === 'write';
}

/** Resolves the signed-in user's role (and any override map) for the active farm. Defaults to 'owner' in demo mode and while data is still loading, matching this app's existing fail-open-to-owner UI conventions elsewhere (see SettingsPage.tsx's myProfile lookup). */
export function useMyRole(): { role: UserRole; customPermissions?: Partial<Record<PermissionResource, PermissionLevel>> } {
  const { demoMode, activeFarmId } = useAppStore();
  const { user: authUser } = useAuthStore();
  const users = useDataStore((s) => s.users);

  if (demoMode) return { role: 'owner' };

  const myProfile = users.find((u) => u.farmId === activeFarmId && u.userId === authUser?.id);
  if (!myProfile) return { role: 'owner' };
  return { role: myProfile.role, customPermissions: myProfile.customPermissions };
}

export function useCanWrite(resource: PermissionResource): boolean {
  const { role, customPermissions } = useMyRole();
  return canWrite(role, resource, customPermissions);
}
