import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { Tenant } from '../src/models/Tenant.js';
import { User } from '../src/models/User.js';
import { Role } from '../src/models/Role.js';
import { hashPassword, verifyPassword } from '../src/password.js';

test('Tenant slug validation and defaults', async () => {
  const tenant = new Tenant({ name: 'Agency One', slug: 'AGENCY-ONE ' });
  
  // Mongoose validation should trim and lowercase
  await tenant.validate();
  
  assert.strictEqual(tenant.slug, 'agency-one', 'Slug should be lowercased and trimmed');
  assert.strictEqual(tenant.status, 'ACTIVE', 'Default status should be ACTIVE');
});

test('User email normalization and tenantId nullability', async () => {
  const user = new User({
    firstName: 'John',
    lastName: 'Doe',
    email: ' JOHN.DOE@EXAMPLE.COM ',
    passwordHash: 'hash',
    tenantId: null // explicitly testing null for platform users
  });

  await user.validate();

  assert.strictEqual(user.email, 'john.doe@example.com', 'Email should be lowercased and trimmed');
  assert.strictEqual(user.tenantId, null, 'tenantId can be null for platform users');
  assert.strictEqual(user.status, 'INVITED', 'Default status should be INVITED');
});

test('User tenantId is enforced by business logic (can be null or ObjectId)', async () => {
  const userWithTenant = new User({
    tenantId: new mongoose.Types.ObjectId(),
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    passwordHash: 'hash'
  });

  await userWithTenant.validate();
  assert.ok(userWithTenant.tenantId instanceof mongoose.Types.ObjectId, 'tenantId is set to an ObjectId');
});

test('Role scope supports PLATFORM and TENANT', async () => {
  const platformRole = new Role({
    name: 'PLATFORM_ADMIN',
    scope: 'PLATFORM',
    tenantId: null
  });

  const tenantRole = new Role({
    name: 'STAFF',
    scope: 'TENANT',
    tenantId: new mongoose.Types.ObjectId()
  });

  await platformRole.validate();
  await tenantRole.validate();

  assert.strictEqual(platformRole.scope, 'PLATFORM');
  assert.strictEqual(tenantRole.scope, 'TENANT');
});

test('Password hashing and verification', async () => {
  const plaintext = 'SuperSecret123!';
  const hash = await hashPassword(plaintext);

  assert.notStrictEqual(hash, plaintext, 'Hash should not be plaintext');
  assert.ok(hash.startsWith('$2b$'), 'Bcrypt hash should start with $2b$');

  const isValid = await verifyPassword(plaintext, hash);
  assert.strictEqual(isValid, true, 'Verification should succeed for correct password');

  const isInvalid = await verifyPassword('WrongPassword', hash);
  assert.strictEqual(isInvalid, false, 'Verification should fail for incorrect password');
});
