import test from 'node:test';
import assert from 'node:assert/strict';
import { RoleService } from '../src/services/roleService.js';
import { verifyTenantContext } from '../../../services/api/src/middleware/authorize.js';
import { Request } from 'express';

test('verifyTenantContext Helper', async (t) => {
  await t.test('Platform user (tenantId null) can access any tenant', () => {
    const req = { user: { tenantId: null } } as unknown as Request;
    assert.equal(verifyTenantContext(req, 'tenant123'), true);
  });

  await t.test('Tenant user can access their own tenant', () => {
    const req = { user: { tenantId: 'tenant123' } } as unknown as Request;
    assert.equal(verifyTenantContext(req, 'tenant123'), true);
  });

  await t.test('Tenant user cannot access other tenant', () => {
    const req = { user: { tenantId: 'tenant123' } } as unknown as Request;
    assert.equal(verifyTenantContext(req, 'tenant456'), false);
  });

  await t.test('Unauthenticated request is rejected', () => {
    const req = {} as Request;
    assert.equal(verifyTenantContext(req, 'tenant123'), false);
  });
});

test('RoleService Validation', async (t) => {
  const service = new RoleService();

  await t.test('Rejects TENANT role without tenantId', async () => {
    await assert.rejects(
      service.createRole({ name: 'Admin', scope: 'TENANT', permissions: [] }),
      { message: 'Tenant roles require a tenantId' }
    );
  });

  await t.test('Rejects PLATFORM role with tenantId', async () => {
    await assert.rejects(
      service.createRole({ name: 'SuperAdmin', scope: 'PLATFORM', tenantId: '123', permissions: [] }),
      { message: 'Platform roles cannot be assigned to a tenant' }
    );
  });
  
  // Note: Tests for assignRoleToUser, getUserPermissions, and requirePermission middleware 
  // require a MongoDB integration environment and are omitted from this unit test suite.
});
