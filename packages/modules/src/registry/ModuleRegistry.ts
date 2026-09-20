import { ModuleDefinition, ModuleCategory } from '../types/index.js';
import { ModuleRegistryError } from '../errors/index.js';

const KEY_REGEX = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
const SEMVER_REGEX =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const VALID_CATEGORIES = new Set<ModuleCategory>([
  'CORE',
  'BUSINESS',
  'INDUSTRY',
  'INTEGRATION',
]);

export class ModuleRegistry {
  private modules = new Map<string, ModuleDefinition>();

  public register(module: ModuleDefinition): void {
    if (!module.key) {
      throw new ModuleRegistryError('Module key cannot be empty');
    }

    if (!KEY_REGEX.test(module.key)) {
      throw new ModuleRegistryError(`Invalid module key format: ${module.key}`);
    }

    if (!module.version || !SEMVER_REGEX.test(module.version)) {
      throw new ModuleRegistryError(
        `Invalid semantic version for module ${module.key}: ${module.version}`,
      );
    }

    if (!VALID_CATEGORIES.has(module.category)) {
      throw new ModuleRegistryError(
        `Invalid category for module ${module.key}: ${module.category}`,
      );
    }

    if (this.modules.has(module.key)) {
      throw new ModuleRegistryError(
        `Module with key ${module.key} is already registered`,
      );
    }

    this.modules.set(module.key, { ...module });
  }

  public get(moduleKey: string): ModuleDefinition {
    const module = this.modules.get(moduleKey);
    if (!module) {
      throw new ModuleRegistryError(`Module not found: ${moduleKey}`);
    }
    return module;
  }

  public has(moduleKey: string): boolean {
    return this.modules.has(moduleKey);
  }

  public list(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  public validate(): void {
    for (const module of this.modules.values()) {
      for (const dep of module.dependencies) {
        if (!this.modules.has(dep)) {
          throw new ModuleRegistryError(
            `Module ${module.key} has missing dependency: ${dep}`,
          );
        }
      }
    }

    // Verify there are no circular dependencies
    this.list().forEach((mod) => this.resolveDependencies(mod.key));
  }

  /**
   * Resolves dependencies deterministically (Topological sort using DFS).
   * Throws on circular dependencies.
   */
  public resolveDependencies(moduleKey: string): ModuleDefinition[] {
    if (!this.has(moduleKey)) {
      throw new ModuleRegistryError(`Module not found: ${moduleKey}`);
    }

    const resolved: ModuleDefinition[] = [];
    const visited = new Set<string>();
    const inProgress = new Set<string>();

    const visit = (key: string) => {
      if (inProgress.has(key)) {
        throw new ModuleRegistryError(
          `Circular dependency detected involving module: ${key}`,
        );
      }

      if (!visited.has(key)) {
        inProgress.add(key);

        const mod = this.modules.get(key);
        if (!mod) {
          throw new ModuleRegistryError(
            `Missing dependency in resolution chain: ${key}`,
          );
        }

        // We sort dependencies lexicographically so resolution order is fully deterministic
        const deps = [...mod.dependencies].sort();

        for (const dep of deps) {
          visit(dep);
        }

        inProgress.delete(key);
        visited.add(key);
        resolved.push(mod);
      }
    };

    visit(moduleKey);

    return resolved;
  }
}
