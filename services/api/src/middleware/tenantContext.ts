import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { Tenant } from '@agency-platform/auth';

export const resolveTenantContext = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (req.user.tenantId === null) {
      req.tenantContext = {
        scope: 'PLATFORM',
        userId: req.user.id,
        tenantId: null,
      };
      return next();
    }

    const tenant = await Tenant.findById(req.user.tenantId);

    if (!tenant) {
      throw new AppError('Tenant not found', 404, 'NOT_FOUND');
    }

    if (tenant.status === 'SUSPENDED' || tenant.status === 'ARCHIVED') {
      throw new AppError('Tenant is inactive', 403, 'FORBIDDEN');
    }

    req.tenantContext = {
      scope: 'TENANT',
      tenantId: tenant._id.toString(),
      userId: req.user.id,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(
        new AppError(
          'Failed to resolve tenant context',
          500,
          'INTERNAL_SERVER_ERROR',
        ),
      );
    }
  }
};
