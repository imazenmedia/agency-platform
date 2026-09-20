import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, Tenant, AuthSession } from '../models/index.js';
import { verifyPassword } from '../password.js';
import { LoginRequest } from '../schemas/login.js';

export interface AuthConfig {
  jwtSecret: string;
  accessTokenExpiresIn: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tenantId: string | null;
  status: string;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export class AuthService {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  public async login(data: LoginRequest): Promise<AuthResult> {
    const email = data.email.toLowerCase().trim();
    
    // Find user explicitly requesting passwordHash
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    if (user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify password
    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify tenant if it exists
    if (user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'ARCHIVED') {
        throw new Error('INVALID_CREDENTIALS');
      }
    }

    // Generate tokens
    const refreshToken = this.generateRefreshToken();
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await AuthSession.create({
      userId: user._id,
      tenantId: user.tenantId,
      tokenHash,
      expiresAt
    });

    const accessToken = jwt.sign(
      { 
        userId: user._id.toString(), 
        tenantId: user.tenantId?.toString() || null,
        sessionId: session._id.toString()
      },
      this.config.jwtSecret,
      { expiresIn: this.config.accessTokenExpiresIn as jwt.SignOptions['expiresIn'] } as jwt.SignOptions
    );

    return {
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tenantId: user.tenantId?.toString() || null,
        status: user.status
      },
      accessToken,
      refreshToken,
      sessionId: session._id.toString()
    };
  }

  public async refresh(refreshToken: string): Promise<AuthResult> {
    if (!refreshToken) {
      throw new Error('UNAUTHORIZED');
    }

    const tokenHash = this.hashToken(refreshToken);
    const session = await AuthSession.findOne({ tokenHash });

    if (!session || session.revokedAt) {
      throw new Error('UNAUTHORIZED');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('UNAUTHORIZED');
    }

    const user = await User.findById(session.userId);
    if (!user || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      throw new Error('UNAUTHORIZED');
    }

    if (user.tenantId) {
      const tenant = await Tenant.findById(user.tenantId);
      if (!tenant || tenant.status === 'SUSPENDED' || tenant.status === 'ARCHIVED') {
        throw new Error('UNAUTHORIZED');
      }
    }

    // Rotate session: revoke old, create new
    session.revokedAt = new Date();
    await session.save();

    const newRefreshToken = this.generateRefreshToken();
    const newTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newSession = await AuthSession.create({
      userId: user._id,
      tenantId: user.tenantId,
      tokenHash: newTokenHash,
      expiresAt
    });

    const accessToken = jwt.sign(
      { 
        userId: user._id.toString(), 
        tenantId: user.tenantId?.toString() || null,
        sessionId: newSession._id.toString()
      },
      this.config.jwtSecret,
      { expiresIn: this.config.accessTokenExpiresIn as jwt.SignOptions['expiresIn'] } as jwt.SignOptions
    );

    return {
      user: {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tenantId: user.tenantId?.toString() || null,
        status: user.status
      },
      accessToken,
      refreshToken: newRefreshToken,
      sessionId: newSession._id.toString()
    };
  }

  public async logout(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    
    const tokenHash = this.hashToken(refreshToken);
    await AuthSession.updateOne(
      { tokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
  }

  public async getUserFromAccessToken(accessToken: string): Promise<AuthUser | null> {
    try {
      const decoded = jwt.verify(accessToken, this.config.jwtSecret) as any;
      const user = await User.findById(decoded.userId);
      
      if (!user || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
        return null;
      }
      
      return {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tenantId: user.tenantId?.toString() || null,
        status: user.status
      };
    } catch (err) {
      return null;
    }
  }
}
