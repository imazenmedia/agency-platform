import test from 'node:test';
import assert from 'node:assert/strict';
import { Request, Response, NextFunction } from 'express';
import {
  RequestContext,
  PlatformContext,
  TenantContext,
} from '../src/context/types.js';
import { tenantFilter } from '../src/context/helpers.js';
import { AppError } from '../../../services/api/src/utils/AppError.js';
import { resolveTenantContext } from '../../../services/api/src/middleware/tenantContext.js';
import {
  requireTenantScope,
  requireTenantAccess,
  requirePlatformScope,
} from '../../../services/api/src/middleware/authorize.js';
import { Tenant } from '../src/models/Tenant.js';

test('Context DB Scoping (tenantFilter)', async (t) => {
  await t.test('tenantFilter returns correctly for TENANT context', () => {
    const ctx: TenantContext = {
      scope: 'TENANT',
      tenantId: '123',
      userId: 'user1',
    };
    const result = tenantFilter(ctx);
    assert.deepEqual(result, { tenantId: '123' });
  });

  await t.test('tenantFilter throws explicitly for PLATFORM context', () => {
    const ctx: PlatformContext = {
      scope: 'PLATFORM',
      tenantId: null,
      userId: 'user1',
    };
    assert.throws(() => tenantFilter(ctx), { name: 'PlatformContextError' });
  });
});

test('Context Middleware Unit Tests', async (t) => {
  await t.test(
    'resolveTenantContext attaches PLATFORM context if tenantId is null',
    async () => {
      const req: Partial<Request> = {
        user: { id: 'user1', tenantId: null } as any,
      };
      let called = false;
      const next: NextFunction = () => {
        called = true;
      };

      await resolveTenantContext(req as Request, {} as Response, next);
      assert.equal(called, true);
      assert.equal(req.tenantContext?.scope, 'PLATFORM');
      assert.equal(req.tenantContext?.tenantId, null);
    },
  );
});

test('Authorization Helpers', async (t) => {
  await t.test('requireTenantScope allows TENANT context', () => {
    const req: Partial<Request> = {
      tenantContext: { scope: 'TENANT', tenantId: '123', userId: 'user1' },
    };
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    requireTenantScope()(req as Request, {} as Response, next);
    assert.equal(called, true);
  });

  await t.test('requireTenantScope rejects PLATFORM context', () => {
    const req: Partial<Request> = {
      tenantContext: { scope: 'PLATFORM', tenantId: null, userId: 'user1' },
    };
    let error: any = null;
    const next: NextFunction = (err: any) => {
      error = err;
    };
    requireTenantScope()(req as Request, {} as Response, next);
    assert.equal(error?.statusCode, 403);
  });

  await t.test('requireTenantAccess allows matching tenant', () => {
    const req: Partial<Request> = {
      tenantContext: { scope: 'TENANT', tenantId: '123', userId: 'user1' },
      params: { id: '123' },
    };
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    requireTenantAccess((r) => r.params.id)(
      req as Request,
      {} as Response,
      next,
    );
    assert.equal(called, true);
  });

  await t.test('requireTenantAccess rejects mismatched tenant', () => {
    const req: Partial<Request> = {
      tenantContext: { scope: 'TENANT', tenantId: '123', userId: 'user1' },
      params: { id: '456' },
    };
    let error: any = null;
    const next: NextFunction = (err: any) => {
      error = err;
    };
    requireTenantAccess((r) => r.params.id)(
      req as Request,
      {} as Response,
      next,
    );
    assert.equal(error?.statusCode, 403);
  });

  await t.test('requireTenantAccess allows PLATFORM scope', () => {
    const req: Partial<Request> = {
      tenantContext: { scope: 'PLATFORM', tenantId: null, userId: 'user1' },
      params: { id: '456' },
    };
    let called = false;
    const next: NextFunction = () => {
      called = true;
    };
    requireTenantAccess((r) => r.params.id)(
      req as Request,
      {} as Response,
      next,
    );
    assert.equal(called, true);
  });
  await t.test(
    'requirePlatformScope rejects TENANT context immediately',
    async () => {
      const req: Partial<Request> = {
        tenantContext: { scope: 'TENANT', tenantId: '123', userId: 'user1' },
      };
      let error: any = null;
      const next: NextFunction = (err: any) => {
        error = err;
      };

      // requirePlatformScope is async, so we await it
      const middleware = requirePlatformScope();
      await middleware(req as Request, {} as Response, next);
      assert.equal(error?.statusCode, 403);
    },
  );
});
