import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'user',
  DEVELOPER = 'developer',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TelegramAuthData {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  deviceInfo?: any;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  private readonly TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

  private users: Map<string, User> = new Map();
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    this.initializeDefaultUsers();
  }

  async authenticateWithTelegram(
    authData: TelegramAuthData
  ): Promise<{ user: User; tokens: AuthTokens }> {
    if (!this.verifyTelegramAuth(authData)) {
      throw new Error('Invalid Telegram authentication data');
    }

    let user = this.findUserByTelegramId(authData.id);

    if (!user) {
      user = await this.createUserFromTelegram(authData);
    } else {
      user = await this.updateUserFromTelegram(user, authData);
    }

    const tokens = await this.generateTokens(user);
    await this.createSession(user, tokens, {});

    return { user, tokens };
  }

  async authenticate(email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    const user = this.findUserByEmail(email);

    if (!user || !(await this.verifyPassword(password, user.id))) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new Error(`Account is ${user.status}`);
    }

    const tokens = await this.generateTokens(user);
    await this.createSession(user, tokens, {});

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as any;
      const session = this.sessions.get(decoded.sessionId);

      if (!session || session.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      if (session.expiresAt < new Date()) {
        this.sessions.delete(session.id);
        throw new Error('Refresh token expired');
      }

      const user = this.users.get(session.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const newTokens = await this.generateTokens(user);

      session.sessionToken = newTokens.accessToken;
      session.refreshToken = newTokens.refreshToken;
      session.lastUsedAt = new Date();
      session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return newTokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const user = this.users.get(decoded.userId);

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const session = this.sessions.get(decoded.sessionId);

      if (session) {
        this.sessions.delete(session.id);
      }
    } catch (error) {
      // Token might be invalid, but still try to clean up
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    const userSessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    userSessions.forEach(session => {
      this.sessions.delete(session.id);
    });
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!(await this.verifyPassword(currentPassword, userId))) {
      throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // In a real implementation, you would hash and store the password
    console.log(`Password changed for user ${userId}`);
  }

  async enableTwoFactor(userId: string, secret: string): Promise<string> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.twoFactorEnabled = true;
    user.updatedAt = new Date();

    // Return backup codes in a real implementation
    return 'backup-codes-would-be-generated-here';
  }

  async disableTwoFactor(userId: string, verificationCode: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify 2FA code in a real implementation
    user.twoFactorEnabled = false;
    user.updatedAt = new Date();
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const sessionId = uuidv4();

    const payload = {
      userId: user.id,
      role: user.role,
      sessionId,
      permissions: this.getUserPermissions(user.role),
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id, sessionId }, this.JWT_REFRESH_SECRET, {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiration(this.JWT_EXPIRES_IN),
    };
  }

  private async createSession(
    user: User,
    tokens: AuthTokens,
    deviceInfo: any
  ): Promise<UserSession> {
    const session: UserSession = {
      id: uuidv4(),
      userId: user.id,
      sessionToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      deviceInfo,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private verifyTelegramAuth(authData: TelegramAuthData): boolean {
    const checkString = Object.keys(authData)
      .filter(key => key !== 'hash')
      .sort()
      .map(key => `${key}=${(authData as any)[key]}`)
      .join('\n');

    const secretKey = require('crypto')
      .createHash('sha256')
      .update(this.TELEGRAM_BOT_TOKEN)
      .digest();
    const hmac = require('crypto')
      .createHmac('sha256', secretKey)
      .update(checkString)
      .digest('hex');

    return hmac === authData.hash;
  }

  private findUserByTelegramId(telegramId: number): User | undefined {
    return Array.from(this.users.values()).find(user => user.telegramId === telegramId);
  }

  private findUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  private async createUserFromTelegram(authData: TelegramAuthData): Promise<User> {
    const user: User = {
      id: uuidv4(),
      telegramId: authData.id,
      username: authData.username,
      firstName: authData.first_name,
      lastName: authData.last_name,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);
    return user;
  }

  private async updateUserFromTelegram(user: User, authData: TelegramAuthData): Promise<User> {
    user.username = authData.username || user.username;
    user.firstName = authData.first_name || user.firstName;
    user.lastName = authData.last_name || user.lastName;
    user.updatedAt = new Date();

    return user;
  }

  private async verifyPassword(password: string, userId: string): Promise<boolean> {
    // In a real implementation, compare with hashed password from database
    return password.length > 0;
  }

  private getUserPermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.USER]: [
        'plugin:install',
        'plugin:uninstall',
        'plugin:review',
        'order:create',
        'profile:read',
        'profile:update',
      ],
      [UserRole.DEVELOPER]: [
        'plugin:install',
        'plugin:uninstall',
        'plugin:review',
        'plugin:create',
        'plugin:update',
        'plugin:publish',
        'earnings:read',
        'order:create',
        'profile:read',
        'profile:update',
      ],
      [UserRole.MODERATOR]: [
        'plugin:install',
        'plugin:uninstall',
        'plugin:review',
        'plugin:moderate',
        'user:moderate',
        'review:moderate',
        'order:create',
        'profile:read',
        'profile:update',
      ],
      [UserRole.ADMIN]: ['plugin:*', 'user:*', 'order:*', 'analytics:*', 'system:*'],
    };

    return permissions[role] || permissions[UserRole.USER];
  }

  private parseExpiration(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // 15 minutes default

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit as keyof typeof multipliers] || 60);
  }

  private initializeDefaultUsers(): void {
    const adminUser: User = {
      id: uuidv4(),
      telegramId: 123456789,
      username: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@mtyb.shop',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
  }
}

export const authService = new AuthService();
