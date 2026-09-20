import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthUser } from '@agency-platform/auth';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

const authService = new AuthService({
  jwtSecret: env.JWT_SECRET!,
  accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN
});

export const authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = await authService.getUserFromAccessToken(accessToken);
    if (!user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
  }
};
