import { Router, CookieOptions } from 'express';
import { AuthService, loginSchema } from '@agency-platform/auth';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/authenticate.js';
import { AppError } from '../utils/AppError.js';

export const authRouter = Router();

const authService = new AuthService({
  jwtSecret: env.JWT_SECRET!,
  accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN
});

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: env.AUTH_COOKIE_SECURE,
  sameSite: env.AUTH_COOKIE_SAME_SITE,
  domain: env.AUTH_COOKIE_DOMAIN,
  path: '/'
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const result = await authService.login(parsed.data);

    res.cookie('accessToken', result.accessToken, getCookieOptions());
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());

    res.json({
      success: true,
      data: {
        user: result.user
      }
    });
  } catch (error: any) {
    if (error.message === 'INVALID_CREDENTIALS') {
      next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    } else {
      next(error);
    }
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const result = await authService.refresh(refreshToken);

    res.cookie('accessToken', result.accessToken, getCookieOptions());
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());

    res.json({
      success: true,
      data: {
        user: result.user
      }
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      res.clearCookie('accessToken', getCookieOptions());
      res.clearCookie('refreshToken', getCookieOptions());
      next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    } else {
      next(error);
    }
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie('accessToken', getCookieOptions());
    res.clearCookie('refreshToken', getCookieOptions());

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});
