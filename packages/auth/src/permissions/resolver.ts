import { User, Role } from '../models/index.js';
import { Permission } from './definitions.js';

export async function getUserPermissions(userId: string): Promise<Permission[]> {
  const user = await User.findById(userId);
  
  if (!user || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
    return [];
  }

  if (!user.roleIds || user.roleIds.length === 0) {
    return [];
  }

  const roles = await Role.find({ _id: { $in: user.roleIds } });
  
  const permissionsSet = new Set<Permission>();

  for (const role of roles) {
    if (role.permissions && Array.isArray(role.permissions)) {
      role.permissions.forEach((p: string) => permissionsSet.add(p as Permission));
    }
  }

  return Array.from(permissionsSet);
}

export async function hasPlatformRole(userId: string): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user || user.tenantId !== null) return false;

  const roles = await Role.find({ _id: { $in: user.roleIds }, scope: 'PLATFORM' });
  return roles.length > 0;
}
