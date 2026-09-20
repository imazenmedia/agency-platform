import { Role, User } from '../models/index.js';
import { Permission } from '../permissions/definitions.js';

export interface CreateRoleDto {
  name: string;
  scope: 'PLATFORM' | 'TENANT';
  tenantId?: string | null;
  permissions: Permission[];
}

export class RoleService {
  public async createRole(data: CreateRoleDto) {
    if (data.scope === 'TENANT' && !data.tenantId) {
      throw new Error('Tenant roles require a tenantId');
    }

    if (data.scope === 'PLATFORM' && data.tenantId) {
      throw new Error('Platform roles cannot be assigned to a tenant');
    }

    const role = await Role.create({
      name: data.name,
      scope: data.scope,
      tenantId: data.tenantId || null,
      permissions: data.permissions
    });

    return role;
  }

  public async assignRoleToUser(userId: string, roleId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const role = await Role.findById(roleId);
    if (!role) throw new Error('Role not found');

    if (role.scope === 'PLATFORM' && user.tenantId !== null) {
      throw new Error('Cannot assign PLATFORM roles to tenant users');
    }

    if (role.scope === 'TENANT' && user.tenantId?.toString() !== role.tenantId?.toString()) {
      throw new Error('Cannot assign role from different tenant');
    }

    const hasRole = user.roleIds.some(id => id.toString() === role._id.toString());
    if (!hasRole) {
      user.roleIds.push(role._id);
      await user.save();
    }

    return user;
  }

  public async removeRoleFromUser(userId: string, roleId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    user.roleIds = user.roleIds.filter(id => id.toString() !== roleId.toString());
    await user.save();

    return user;
  }
}
