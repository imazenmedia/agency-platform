import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ModuleRegistry,
  ModuleDefinition,
  ModuleCategory,
  ModuleRegistryError,
} from '../src/index.js';

function createValidModule(
  key: string,
  dependencies: string[] = [],
): ModuleDefinition {
  return {
    key,
    name: `Test Module ${key}`,
    description: 'Test description',
    version: '1.0.0',
    category: 'BUSINESS',
    dependencies,
    core: false,
    configurable: true,
  };
}

test('Module Registry', async (t) => {
  await t.test('1. Register module', () => {
    const registry = new ModuleRegistry();
    const mod = createValidModule('test.mod');
    registry.register(mod);
    assert.equal(registry.has('test.mod'), true);
  });

  await t.test('2. Retrieve module', () => {
    const registry = new ModuleRegistry();
    const mod = createValidModule('test.mod');
    registry.register(mod);
    const retrieved = registry.get('test.mod');
    assert.deepEqual(retrieved, mod);
  });

  await t.test('3. Check module existence', () => {
    const registry = new ModuleRegistry();
    assert.equal(registry.has('test.mod'), false);
    registry.register(createValidModule('test.mod'));
    assert.equal(registry.has('test.mod'), true);
  });

  await t.test('4. List modules', () => {
    const registry = new ModuleRegistry();
    registry.register(createValidModule('mod.one'));
    registry.register(createValidModule('mod.two'));
    const list = registry.list();
    assert.equal(list.length, 2);
    assert.equal(list[0].key, 'mod.one');
    assert.equal(list[1].key, 'mod.two');
  });

  await t.test('5. Duplicate registration rejected', () => {
    const registry = new ModuleRegistry();
    registry.register(createValidModule('test.duplicate'));
    assert.throws(
      () => {
        registry.register(createValidModule('test.duplicate'));
      },
      {
        name: 'ModuleRegistryError',
        message: 'Module with key test.duplicate is already registered',
      },
    );
  });

  await t.test('6. Missing dependency detected', () => {
    const registry = new ModuleRegistry();
    registry.register(createValidModule('mod.one', ['mod.two'])); // mod.two does not exist
    assert.throws(
      () => {
        registry.validate();
      },
      {
        name: 'ModuleRegistryError',
        message: 'Module mod.one has missing dependency: mod.two',
      },
    );
  });

  await t.test('7. Dependency chain resolves correctly', () => {
    const registry = new ModuleRegistry();
    registry.register(createValidModule('mod.a', ['mod.b']));
    registry.register(createValidModule('mod.b', ['mod.c']));
    registry.register(createValidModule('mod.c'));

    const resolved = registry.resolveDependencies('mod.a');
    assert.equal(resolved.length, 3);
    assert.equal(resolved[0].key, 'mod.c');
    assert.equal(resolved[1].key, 'mod.b');
    assert.equal(resolved[2].key, 'mod.a');
  });

  await t.test('8. Circular dependency detected', () => {
    const registry = new ModuleRegistry();
    registry.register(createValidModule('mod.a', ['mod.b']));
    registry.register(createValidModule('mod.b', ['mod.c']));
    registry.register(createValidModule('mod.c', ['mod.a'])); // Circular

    assert.throws(
      () => {
        registry.validate();
      },
      {
        name: 'ModuleRegistryError',
        message: 'Circular dependency detected involving module: mod.a',
      },
    );
  });

  await t.test('9. Invalid module key rejected', () => {
    const registry = new ModuleRegistry();

    assert.throws(() => registry.register(createValidModule('')), {
      name: 'ModuleRegistryError',
      message: 'Module key cannot be empty',
    });

    assert.throws(() => registry.register(createValidModule('Invalid Key!')), {
      name: 'ModuleRegistryError',
      message: 'Invalid module key format: Invalid Key!',
    });

    assert.throws(() => registry.register(createValidModule('test_mod')), {
      name: 'ModuleRegistryError',
      message: 'Invalid module key format: test_mod',
    });
  });

  await t.test('10. Invalid version rejected', () => {
    const registry = new ModuleRegistry();
    const mod = createValidModule('mod.one');
    mod.version = '1.0'; // Not valid SemVer (needs patch)
    assert.throws(() => registry.register(mod), {
      name: 'ModuleRegistryError',
      message: 'Invalid semantic version for module mod.one: 1.0',
    });

    mod.version = 'v1.0.0'; // v prefix invalid
    assert.throws(() => registry.register(mod), {
      name: 'ModuleRegistryError',
      message: 'Invalid semantic version for module mod.one: v1.0.0',
    });
  });

  await t.test('11. Invalid category rejected', () => {
    const registry = new ModuleRegistry();
    const mod = createValidModule('mod.one');
    mod.category = 'UNKNOWN' as ModuleCategory;
    assert.throws(() => registry.register(mod), {
      name: 'ModuleRegistryError',
      message: 'Invalid category for module mod.one: UNKNOWN',
    });
  });

  await t.test('12. Registry validation succeeds for valid modules', () => {
    const registry = new ModuleRegistry();
    registry.register(createValidModule('core.auth'));
    registry.register(createValidModule('core.users', ['core.auth']));
    registry.register(createValidModule('business.crm', ['core.users']));

    // Should not throw
    registry.validate();
  });

  await t.test('13. Core module is identified correctly', () => {
    const registry = new ModuleRegistry();
    const mod = createValidModule('core.cms');
    mod.core = true;
    registry.register(mod);

    const retrieved = registry.get('core.cms');
    assert.equal(retrieved.core, true);
  });
});
