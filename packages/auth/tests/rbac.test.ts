import test from 'node:test';
import assert from 'node:assert/strict';
import { RoleService } from '../src/services/roleService.js';

// Context tests moved to context.test.ts

test('RoleService Validation', async (t) => {
  const service = new RoleService();

  await t.test('Rejects TENANT role without tenantId', async () => {
    await assert.rejects(
      service.createRole({ name: 'Admin', scope: 'TENANT', permissions: [] }),
      { message: 'Tenant roles require a tenantId' },
    );
  });

  await t.test('Rejects PLATFORM role with tenantId', async () => {
    await assert.rejects(
      service.createRole({
        name: 'SuperAdmin',
        scope: 'PLATFORM',
        tenantId: '123',
        permissions: [],
      }),
      { message: 'Platform roles cannot be assigned to a tenant' },
    );
  });

  // Note: Tests for assignRoleToUser, getUserPermissions, and requirePermission middleware
  // require a MongoDB integration environment and are omitted from this unit test suite.
});
