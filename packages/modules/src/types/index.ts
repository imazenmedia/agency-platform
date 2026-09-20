export type ModuleCategory = 'CORE' | 'BUSINESS' | 'INDUSTRY' | 'INTEGRATION';

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  version: string;
  category: ModuleCategory;
  dependencies: string[];
  core: boolean;
  configurable: boolean;
}
