import { ModuleRegistry } from '@agency-platform/modules';

export const registry = new ModuleRegistry();

// For testing purposes, we can pre-register some mock modules or let services do it.
// In a real application, modules would be registered here during startup based on what is installed.
registry.register({
  key: 'core.auth',
  name: 'Authentication',
  description: 'Core authentication module',
  version: '1.0.0',
  category: 'CORE',
  dependencies: [],
  core: true,
  configurable: false,
  defaultEnabled: true,
});

registry.register({
  key: 'core.cms',
  name: 'Content Management System',
  description: 'Core CMS',
  version: '1.0.0',
  category: 'BUSINESS',
  dependencies: ['core.auth'],
  core: false,
  configurable: true,
  defaultEnabled: true,
});

registry.register({
  key: 'core.crm',
  name: 'CRM',
  description: 'Customer Relationship Management',
  version: '1.0.0',
  category: 'BUSINESS',
  dependencies: ['core.auth'],
  core: false,
  configurable: true,
  defaultEnabled: false,
});
