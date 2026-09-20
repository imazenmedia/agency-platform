import mongoose from 'mongoose';
import { ModuleRegistry, ModuleDefinition } from '@agency-platform/modules';
import { TenantModuleConfiguration } from '../models/TenantModuleConfiguration.js';

export interface ModuleConfigurationResult {
  moduleKey: string;
  enabled: boolean;
  source: 'DEFAULT' | 'OVERRIDE';
}

export class TenantModuleService {
  constructor(private registry: ModuleRegistry) {}

  public async getModuleConfiguration(
    tenantId: string | mongoose.Types.ObjectId,
    moduleKey: string,
  ): Promise<ModuleConfigurationResult> {
    const module = this.registry.get(moduleKey);

    const config = await TenantModuleConfiguration.findOne({
      tenantId,
      moduleKey,
    });

    if (config) {
      return {
        moduleKey,
        enabled: config.enabled,
        source: 'OVERRIDE',
      };
    }

    return {
      moduleKey,
      enabled: module.core ? true : module.defaultEnabled,
      source: 'DEFAULT',
    };
  }

  public async isModuleEnabled(
    tenantId: string | mongoose.Types.ObjectId,
    moduleKey: string,
  ): Promise<boolean> {
    const config = await this.getModuleConfiguration(tenantId, moduleKey);
    return config.enabled;
  }

  public async listEnabledModules(
    tenantId: string | mongoose.Types.ObjectId,
  ): Promise<ModuleDefinition[]> {
    const allModules = this.registry.list();
    const enabledModules: ModuleDefinition[] = [];

    // Optimize by fetching all overrides for the tenant
    const overrides = await TenantModuleConfiguration.find({ tenantId });
    const overrideMap = new Map(overrides.map((o) => [o.moduleKey, o.enabled]));

    for (const mod of allModules) {
      const isOverrideEnabled = overrideMap.get(mod.key);
      const isEnabled =
        isOverrideEnabled !== undefined
          ? isOverrideEnabled
          : mod.core
            ? true
            : mod.defaultEnabled;
      if (isEnabled) {
        enabledModules.push(mod);
      }
    }

    return enabledModules;
  }

  public async enableModule(
    tenantId: string | mongoose.Types.ObjectId,
    moduleKey: string,
  ): Promise<void> {
    const module = this.registry.get(moduleKey);

    // Validate dependencies
    for (const dep of module.dependencies) {
      const isDepEnabled = await this.isModuleEnabled(tenantId, dep);
      if (!isDepEnabled) {
        throw new Error(
          `Cannot enable module '${moduleKey}': missing required dependency '${dep}'`,
        );
      }
    }

    await TenantModuleConfiguration.findOneAndUpdate(
      { tenantId, moduleKey },
      { enabled: true },
      { upsert: true, new: true },
    );
  }

  public async disableModule(
    tenantId: string | mongoose.Types.ObjectId,
    moduleKey: string,
  ): Promise<void> {
    const module = this.registry.get(moduleKey);

    if (module.core) {
      throw new Error(`Cannot disable core module: '${moduleKey}'`);
    }

    // Check if any other enabled module depends on this one
    const enabledModules = await this.listEnabledModules(tenantId);

    for (const activeMod of enabledModules) {
      if (activeMod.dependencies.includes(moduleKey)) {
        throw new Error(
          `Cannot disable module '${moduleKey}' because '${activeMod.key}' depends on it.`,
        );
      }
    }

    await TenantModuleConfiguration.findOneAndUpdate(
      { tenantId, moduleKey },
      { enabled: false },
      { upsert: true, new: true },
    );
  }
}
