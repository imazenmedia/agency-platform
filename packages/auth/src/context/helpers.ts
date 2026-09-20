import { RequestContext } from './types.js';

export class PlatformContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlatformContextError';
  }
}

/**
 * Ensures MongoDB queries are inherently restricted to the authenticated tenant.
 * Intentionally throws if called by a PLATFORM context without explicit intent.
 */
export function tenantFilter(context: RequestContext) {
  if (context.scope === 'PLATFORM') {
    throw new PlatformContextError(
      'Platform context cannot use tenantFilter automatically. Provide explicit queries for platform operations.',
    );
  }

  return { tenantId: context.tenantId };
}
