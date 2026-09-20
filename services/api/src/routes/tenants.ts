import { Router } from 'express';
import {
  TenantService,
  createTenantSchema,
  updateTenantSchema,
} from '@agency-platform/auth';
import { authenticate } from '../middleware/authenticate.js';
import { resolveTenantContext } from '../middleware/tenantContext.js';
import {
  requirePermission,
  requirePlatformScope,
  requireTenantAccess,
} from '../middleware/authorize.js';
import { AppError } from '../utils/AppError.js';

export const tenantsRouter = Router();
const tenantService = new TenantService();

tenantsRouter.use(authenticate);
tenantsRouter.use(resolveTenantContext);

tenantsRouter.post(
  '/',
  requirePlatformScope(),
  requirePermission('tenants.create'),
  async (req, res, next) => {
    try {
      const parsed = createTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Invalid tenant data', 400, 'BAD_REQUEST');
      }
      const tenant = await tenantService.createTenant(parsed.data);
      res.status(201).json({ success: true, data: tenant });
    } catch (error: any) {
      next(new AppError(error.message, 400, 'BAD_REQUEST'));
    }
  },
);

tenantsRouter.get(
  '/',
  requirePlatformScope(),
  requirePermission('tenants.read'),
  async (_req, res, next) => {
    try {
      const tenants = await tenantService.listTenants();
      res.json({ success: true, data: tenants });
    } catch (error: any) {
      next(new AppError(error.message, 400, 'BAD_REQUEST'));
    }
  },
);

tenantsRouter.get(
  '/:id',
  requirePermission('tenants.read'),
  requireTenantAccess((req) => req.params.id as string),
  async (req, res, next) => {
    try {
      const tenant = await tenantService.getTenantById(req.params.id as string);
      res.json({ success: true, data: tenant });
    } catch (error: any) {
      next(new AppError(error.message, 404, 'NOT_FOUND'));
    }
  },
);

tenantsRouter.patch(
  '/:id',
  requirePermission('tenants.update'),
  requireTenantAccess((req) => req.params.id as string),
  async (req, res, next) => {
    try {
      const parsed = updateTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Invalid update data', 400, 'BAD_REQUEST');
      }

      const tenant = await tenantService.updateTenant(
        req.params.id as string,
        parsed.data,
        req.tenantContext!.tenantId,
      );
      res.json({ success: true, data: tenant });
    } catch (error: any) {
      if (error.message.includes('Tenant admins cannot change tenant status')) {
        next(new AppError(error.message, 403, 'FORBIDDEN'));
      } else {
        next(new AppError(error.message, 400, 'BAD_REQUEST'));
      }
    }
  },
);
