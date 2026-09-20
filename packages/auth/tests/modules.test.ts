import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { ModuleRegistry } from '@agency-platform/modules';
import {
  TenantModuleService,
  TenantModuleConfiguration,
} from '../src/index.js';
import { connectDatabase } from '@agency-platform/database';

test('TenantModuleService Integration Tests', async (t) => {
  if (!process.env.DATABASE_URL) {
    t.skip('DATABASE_URL not set, skipping DB integration tests');
    return;
  }

  await connectDatabase(process.env.DATABASE_URL);

  const registry = new ModuleRegistry();

  registry.register({
    key: 'core.auth',
    name: 'Auth',
    description: 'Auth',
    version: '1.0.0',
    category: 'CORE',
    dependencies: [],
    core: true,
    configurable: false,
    defaultEnabled: true,
  });

  registry.register({
    key: 'core.cms',
    name: 'CMS',
    description: 'CMS',
    version: '1.0.0',
    category: 'BUSINESS',
    dependencies: ['core.auth'],
    core: false,
    configurable: true,
    defaultEnabled: true, // Default ON
  });

  registry.register({
    key: 'core.crm',
    name: 'CRM',
    description: 'CRM',
    version: '1.0.0',
    category: 'BUSINESS',
    dependencies: ['core.auth'],
    core: false,
    configurable: true,
    defaultEnabled: false, // Default OFF
  });

  registry.register({
    key: 'core.rentals',
    name: 'Rentals',
    description: 'Rentals',
    version: '1.0.0',
    category: 'BUSINESS',
    dependencies: ['core.crm'],
    core: false,
    configurable: true,
    defaultEnabled: false, // Default OFF
  });

  const moduleService = new TenantModuleService(registry);
  const tenantId = new mongoose.Types.ObjectId();
  const tenantIdStr = tenantId.toString();

  await t.test('1. Default configuration behavior tested', async () => {
    // core.auth is core, so true
    let conf = await moduleService.getModuleConfiguration(
      tenantIdStr,
      'core.auth',
    );
    assert.equal(conf.enabled, true);
    assert.equal(conf.source, 'DEFAULT');

    // core.cms defaultEnabled is true
    conf = await moduleService.getModuleConfiguration(tenantIdStr, 'core.cms');
    assert.equal(conf.enabled, true);
    assert.equal(conf.source, 'DEFAULT');

    // core.crm defaultEnabled is false
    conf = await moduleService.getModuleConfiguration(tenantIdStr, 'core.crm');
    assert.equal(conf.enabled, false);
    assert.equal(conf.source, 'DEFAULT');
  });

  await t.test('2. Cannot enable module with missing dependency', async () => {
    // rentals depends on crm, which is OFF by default
    await assert.rejects(
      moduleService.enableModule(tenantIdStr, 'core.rentals'),
      /Cannot enable module 'core.rentals': missing required dependency 'core.crm'/,
    );
  });

  await t.test('3. Enable valid module', async () => {
    await moduleService.enableModule(tenantIdStr, 'core.crm');
    const conf = await moduleService.getModuleConfiguration(
      tenantIdStr,
      'core.crm',
    );
    assert.equal(conf.enabled, true);
    assert.equal(conf.source, 'OVERRIDE');
  });

  await t.test('4. Duplicate enable does not create duplicates', async () => {
    await moduleService.enableModule(tenantIdStr, 'core.crm'); // again
    const configs = await TenantModuleConfiguration.find({
      tenantId,
      moduleKey: 'core.crm',
    });
    assert.equal(configs.length, 1); // Should upsert/update, not duplicate
  });

  await t.test(
    '5. Cannot disable module required by enabled dependent module',
    async () => {
      // Enable rentals now that CRM is enabled
      await moduleService.enableModule(tenantIdStr, 'core.rentals');

      // Now try to disable CRM
      await assert.rejects(
        moduleService.disableModule(tenantIdStr, 'core.crm'),
        /Cannot disable module 'core.crm' because 'core.rentals' depends on it./,
      );
    },
  );

  await t.test('6. Disable module', async () => {
    // First disable rentals
    await moduleService.disableModule(tenantIdStr, 'core.rentals');
    const conf = await moduleService.getModuleConfiguration(
      tenantIdStr,
      'core.rentals',
    );
    assert.equal(conf.enabled, false);
    assert.equal(conf.source, 'OVERRIDE');
  });

  await t.test('7. Core-module rule enforced', async () => {
    await assert.rejects(
      moduleService.disableModule(tenantIdStr, 'core.auth'),
      /Cannot disable core module: 'core.auth'/,
    );
  });

  await t.test('8. Unknown module rejected', async () => {
    await assert.rejects(
      moduleService.enableModule(tenantIdStr, 'core.unknown'),
      /Module not found: core.unknown/,
    );
  });
});
