import { Router } from 'express';
import {
  UserService,
  createUserSchema,
  updateUserSchema,
} from '@agency-platform/auth';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/authorize.js';
import { AppError } from '../utils/AppError.js';

export const usersRouter = Router();
const userService = new UserService();

usersRouter.use(authenticate);

usersRouter.post(
  '/',
  requirePermission('users.create'),
  async (req, res, next) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Invalid user data', 400, 'BAD_REQUEST');
      }

      const user = await userService.createUser(
        parsed.data,
        req.user!.tenantId,
      );
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      next(new AppError(error.message, 400, 'BAD_REQUEST'));
    }
  },
);

usersRouter.get(
  '/',
  requirePermission('users.read'),
  async (req, res, next) => {
    try {
      const users = await userService.listUsers(req.user!.tenantId);
      res.json({ success: true, data: users });
    } catch (error: any) {
      next(new AppError(error.message, 400, 'BAD_REQUEST'));
    }
  },
);

usersRouter.get(
  '/:id',
  requirePermission('users.read'),
  async (req, res, next) => {
    try {
      const user = await userService.getUserById(
        req.params.id as string,
        req.user!.tenantId,
      );
      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      } else {
        next(new AppError(error.message, 404, 'NOT_FOUND'));
      }
    }
  },
);

usersRouter.patch(
  '/:id',
  requirePermission('users.update'),
  async (req, res, next) => {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('Invalid user data', 400, 'BAD_REQUEST');
      }

      const user = await userService.updateUser(
        req.params.id as string,
        parsed.data,
        req.user!.tenantId,
      );
      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      } else {
        next(new AppError(error.message, 400, 'BAD_REQUEST'));
      }
    }
  },
);

usersRouter.post(
  '/:id/disable',
  requirePermission('users.update'),
  async (req, res, next) => {
    try {
      const user = await userService.setStatus(
        req.params.id as string,
        'DISABLED',
        req.user!.tenantId,
        req.user!.id,
      );
      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      } else {
        next(new AppError(error.message, 400, 'BAD_REQUEST'));
      }
    }
  },
);

usersRouter.post(
  '/:id/enable',
  requirePermission('users.update'),
  async (req, res, next) => {
    try {
      const user = await userService.setStatus(
        req.params.id as string,
        'ACTIVE',
        req.user!.tenantId,
        req.user!.id,
      );
      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      } else {
        next(new AppError(error.message, 400, 'BAD_REQUEST'));
      }
    }
  },
);

usersRouter.post(
  '/:id/suspend',
  requirePermission('users.update'),
  async (req, res, next) => {
    try {
      const user = await userService.setStatus(
        req.params.id as string,
        'SUSPENDED',
        req.user!.tenantId,
        req.user!.id,
      );
      res.json({ success: true, data: user });
    } catch (error: any) {
      if (error.message === 'Access denied') {
        next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      } else {
        next(new AppError(error.message, 400, 'BAD_REQUEST'));
      }
    }
  },
);
