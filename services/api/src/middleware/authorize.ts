import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import {
  getUserPermissions,
  hasPlatformRole,
  Permission,
} from '@agency-platform/auth';

/**
 * Ensures the authenticated user has a specific permission via their roles.
 * Must be used AFTER the `authenticate` middleware.
 */
export const requirePermission = (permission: Permission) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      const permissions = await getUserPermissions(req.user.id);

      if (!permissions.includes(permission)) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
      }
    }
  };
};

/**
 * Ensures the authenticated user has a PLATFORM scope role and no tenantId.
 */
export const requirePlatformScope = () => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.tenantContext || req.tenantContext.scope !== 'PLATFORM') {
        throw new AppError('Platform access required', 403, 'FORBIDDEN');
      }

      const isPlatform = await hasPlatformRole(req.tenantContext.userId);
      if (!isPlatform) {
        throw new AppError('Platform access required', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError('Platform access required', 403, 'FORBIDDEN'));
      }
    }
  };
};

/**
 * Ensures the authenticated user is a TENANT user.
 */
export const requireTenantScope = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.tenantContext || req.tenantContext.scope !== 'TENANT') {
      next(new AppError('Tenant access required', 403, 'FORBIDDEN'));
      return;
    }
    next();
  };
};

/**
 * Helper to ensure operations accurately target a designated tenant safely.
 * Platform users can access any tenant. Tenant users can only access their own.
 */
export const requireTenantAccess = (
  extractTargetId: (req: Request) => string,
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.tenantContext) {
      next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
      return;
    }

    if (req.tenantContext.scope === 'PLATFORM') {
      return next();
    }

    const targetTenantId = extractTargetId(req);
    if (req.tenantContext.tenantId !== targetTenantId) {
      next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
};
