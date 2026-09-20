import { User, Role } from '../models/index.js';
import { CreateUserRequest, UpdateUserRequest } from '../schemas/user.js';
import { hashPassword } from '../password.js';

export class UserService {
  public async createUser(
    data: CreateUserRequest,
    executorTenantId: string | null,
  ) {
    let targetTenantId = data.tenantId || null;

    if (executorTenantId !== null) {
      targetTenantId = executorTenantId;
    }

    const email = data.email.toLowerCase().trim();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    let validRoleIds: string[] = [];
    if (data.roleIds && data.roleIds.length > 0) {
      const roles = await Role.find({ _id: { $in: data.roleIds } });

      for (const role of roles) {
        if (role.scope === 'PLATFORM' && targetTenantId !== null) {
          throw new Error('Cannot assign PLATFORM roles to a tenant user');
        }
        if (
          role.scope === 'TENANT' &&
          targetTenantId &&
          role.tenantId?.toString() !== targetTenantId
        ) {
          throw new Error('Cannot assign roles from a different tenant');
        }
        validRoleIds.push(role._id.toString());
      }
    }

    const user = await User.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email,
      passwordHash: hashedPassword,
      tenantId: targetTenantId,
      status: 'ACTIVE',
      roleIds: validRoleIds,
    });

    const userObject = user.toObject();
    delete (userObject as any).passwordHash;
    return userObject;
  }

  public async getUserById(userId: string, executorTenantId: string | null) {
    const query: any = { _id: userId };
    if (executorTenantId !== null) query.tenantId = executorTenantId;

    const user = await User.findOne(query);
    if (!user) throw new Error('User not found');

    return user;
  }

  public async updateUser(
    userId: string,
    data: UpdateUserRequest,
    executorTenantId: string | null,
  ) {
    const query: any = { _id: userId };
    if (executorTenantId !== null) query.tenantId = executorTenantId;

    const user = await User.findOne(query);
    if (!user) throw new Error('User not found');

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;

    if (data.email) {
      const email = data.email.toLowerCase().trim();
      const existing = await User.findOne({ email, _id: { $ne: user._id } });
      if (existing) throw new Error('Email already in use');
      user.email = email;
    }

    if (data.roleIds) {
      const roles = await Role.find({ _id: { $in: data.roleIds } });
      let validRoleIds: string[] = [];
      for (const role of roles) {
        if (role.scope === 'PLATFORM' && user.tenantId !== null) {
          throw new Error('Cannot assign PLATFORM roles to a tenant user');
        }
        if (
          role.scope === 'TENANT' &&
          user.tenantId &&
          role.tenantId?.toString() !== user.tenantId.toString()
        ) {
          throw new Error('Cannot assign roles from a different tenant');
        }
        validRoleIds.push(role._id.toString());
      }
      user.roleIds = validRoleIds as any[];
    }

    await user.save();
    return user;
  }

  public async setStatus(
    userId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED',
    executorTenantId: string | null,
    executorUserId: string,
  ) {
    if (
      userId === executorUserId &&
      (status === 'SUSPENDED' || status === 'DISABLED')
    ) {
      throw new Error('Users cannot suspend or disable themselves');
    }

    const query: any = { _id: userId };
    if (executorTenantId !== null) query.tenantId = executorTenantId;

    const user = await User.findOne(query);
    if (!user) throw new Error('User not found');

    user.status = status;
    await user.save();
    return user;
  }

  public async listUsers(executorTenantId: string | null) {
    const filter =
      executorTenantId !== null ? { tenantId: executorTenantId } : {};
    return await User.find(filter);
  }
}
