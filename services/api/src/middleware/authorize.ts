import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { getUserPermissions, hasPlatformRole, Permission } from '@agency-platform/auth';

/**
 * Ensures the authenticated user has a specific permission via their roles.
 * Must be used AFTER the `authenticate` middleware.
 */
export const requirePermission = (permission: Permission) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
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
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      if (req.user.tenantId !== null) {
        throw new AppError('Platform access required', 403, 'FORBIDDEN');
      }

      const isPlatform = await hasPlatformRole(req.user.id);
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
 * Helper to check if a target tenant belongs to the current user's scope.
 * Platform users can access any tenant. Tenant users can only access their own.
 */
export const verifyTenantContext = (req: Request, targetTenantId: string): boolean => {
  if (!req.user) return false;
  
  if (req.user.tenantId === null) return true;
  
  return req.user.tenantId === targetTenantId;
};
