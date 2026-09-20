import { Router } from 'express';
import { TenantModuleService } from '@agency-platform/auth';
import { registry } from '../modules/registry.js';
import { authenticate } from '../middleware/authenticate.js';
import { resolveTenantContext } from '../middleware/tenantContext.js';
import {
  requireTenantScope,
  requirePermission,
} from '../middleware/authorize.js';
import { Permissions } from '@agency-platform/auth';

export const modulesRouter = Router();

const moduleService = new TenantModuleService(registry);

// All these routes require a tenant context
modulesRouter.use(authenticate);
modulesRouter.use(resolveTenantContext);
modulesRouter.use(requireTenantScope());

modulesRouter.get(
  '/',
  requirePermission(Permissions.MODULES_READ),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId!;
      const enabledModules = await moduleService.listEnabledModules(tenantId);
      res.json({
        success: true,
        data: enabledModules,
      });
    } catch (error) {
      next(error);
    }
  },
);

modulesRouter.get(
  '/:moduleKey',
  requirePermission(Permissions.MODULES_READ),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId!;
      const config = await moduleService.getModuleConfiguration(
        tenantId,
        req.params.moduleKey as string,
      );
      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  },
);

modulesRouter.post(
  '/:moduleKey/enable',
  requirePermission(Permissions.MODULES_UPDATE),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId!;
      await moduleService.enableModule(
        tenantId,
        req.params.moduleKey as string,
      );
      res.json({
        success: true,
        message: `Module ${req.params.moduleKey} enabled`,
      });
    } catch (error) {
      next(error);
    }
  },
);

modulesRouter.post(
  '/:moduleKey/disable',
  requirePermission(Permissions.MODULES_UPDATE),
  async (req, res, next) => {
    try {
      const tenantId = req.tenantContext!.tenantId!;
      await moduleService.disableModule(
        tenantId,
        req.params.moduleKey as string,
      );
      res.json({
        success: true,
        message: `Module ${req.params.moduleKey} disabled`,
      });
    } catch (error) {
      next(error);
    }
  },
);
