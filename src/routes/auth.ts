import express from 'express';
import { authService, TelegramAuthData } from '../services/auth/AuthService';
import {
  requireAuth,
  optionalAuth,
  validateTelegramWebApp,
  rateLimitByUser,
  auditLog,
} from '../middleware/authMiddleware';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Telegram Web App authentication
router.post('/telegram', validateTelegramWebApp(), auditLog('telegram_auth'), async (req, res) => {
  try {
    const telegramUser = req.body.telegramUser;

    if (!telegramUser) {
      return res.status(400).json({
        error: 'MISSING_TELEGRAM_USER',
        message: 'Telegram user data is required',
      });
    }

    const authData: TelegramAuthData = {
      id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      photo_url: telegramUser.photo_url,
      auth_date: Math.floor(Date.now() / 1000),
      hash: req.body.hash || 'dummy-hash-for-demo',
    };

    const { user, tokens } = await authService.authenticateWithTelegram(authData);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        tokens,
      },
    });
  } catch (error) {
    res.status(400).json({
      error: 'AUTHENTICATION_FAILED',
      message: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
});

// Email/password authentication
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 1 })],
  rateLimitByUser(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  auditLog('login'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
        });
      }

      const { email, password } = req.body;
      const { user, tokens } = await authService.authenticate(email, password);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
          },
          tokens,
        },
      });
    } catch (error) {
      res.status(401).json({
        error: 'AUTHENTICATION_FAILED',
        message: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  }
);

// Refresh token
router.post('/refresh', [body('refreshToken').isLength({ min: 1 })], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Refresh token is required',
      });
    }

    const { refreshToken } = req.body;
    const tokens = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error) {
    res.status(401).json({
      error: 'TOKEN_REFRESH_FAILED',
      message: error instanceof Error ? error.message : 'Token refresh failed',
    });
  }
});

// Logout
router.post('/logout', requireAuth(), auditLog('logout'), async (req, res) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await authService.logout(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'LOGOUT_FAILED',
      message: 'Logout failed',
    });
  }
});

// Logout from all sessions
router.post('/logout-all', requireAuth(), auditLog('logout_all'), async (req, res) => {
  try {
    await authService.logoutAllSessions(req.user!.id);

    res.json({
      success: true,
      message: 'Logged out from all sessions successfully',
    });
  } catch (error) {
    res.status(500).json({
      error: 'LOGOUT_ALL_FAILED',
      message: 'Failed to logout from all sessions',
    });
  }
});

// Get current user profile
router.get('/me', requireAuth(), async (req, res) => {
  try {
    const user = req.user!;
    const sessions = await authService.getUserSessions(user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          emailVerified: user.emailVerified,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        sessions: sessions.map(session => ({
          id: session.id,
          deviceInfo: session.deviceInfo,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          createdAt: session.createdAt,
          lastUsedAt: session.lastUsedAt,
          expiresAt: session.expiresAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'PROFILE_FETCH_FAILED',
      message: 'Failed to fetch user profile',
    });
  }
});

// Change password
router.post(
  '/change-password',
  requireAuth(),
  [
    body('currentPassword').isLength({ min: 1 }),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  rateLimitByUser(3, 60 * 60 * 1000), // 3 attempts per hour
  auditLog('change_password'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
          details: errors.array(),
        });
      }

      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.id, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      res.status(400).json({
        error: 'PASSWORD_CHANGE_FAILED',
        message: error instanceof Error ? error.message : 'Password change failed',
      });
    }
  }
);

// Enable two-factor authentication
router.post(
  '/2fa/enable',
  requireAuth(),
  [body('secret').isLength({ min: 1 })],
  auditLog('enable_2fa'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Secret is required',
        });
      }

      const { secret } = req.body;
      const backupCodes = await authService.enableTwoFactor(req.user!.id, secret);

      res.json({
        success: true,
        data: {
          backupCodes,
          message: 'Two-factor authentication enabled successfully',
        },
      });
    } catch (error) {
      res.status(400).json({
        error: '2FA_ENABLE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to enable 2FA',
      });
    }
  }
);

// Disable two-factor authentication
router.post(
  '/2fa/disable',
  requireAuth(),
  [body('verificationCode').isLength({ min: 6, max: 6 })],
  auditLog('disable_2fa'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Valid verification code is required',
        });
      }

      const { verificationCode } = req.body;
      await authService.disableTwoFactor(req.user!.id, verificationCode);

      res.json({
        success: true,
        message: 'Two-factor authentication disabled successfully',
      });
    } catch (error) {
      res.status(400).json({
        error: '2FA_DISABLE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to disable 2FA',
      });
    }
  }
);

// Get user permissions
router.get('/permissions', requireAuth(), async (req, res) => {
  try {
    if (!req.permissions) {
      return res.status(500).json({
        error: 'PERMISSIONS_NOT_AVAILABLE',
        message: 'Permission helpers not available',
      });
    }

    // Get available resources and actions for the user's role
    const commonResources = ['plugin', 'profile', 'order', 'review', 'analytics'];
    const commonActions = ['create', 'read', 'update', 'delete'];

    const permissions = commonResources.reduce(
      (acc, resource) => {
        acc[resource] = commonActions.reduce(
          (resourcePerms, action) => {
            resourcePerms[action] = req.permissions!.hasPermission(resource, action);
            return resourcePerms;
          },
          {} as Record<string, boolean>
        );
        return acc;
      },
      {} as Record<string, Record<string, boolean>>
    );

    res.json({
      success: true,
      data: {
        role: req.user!.role,
        permissions,
        canAccess: commonResources.reduce(
          (acc, resource) => {
            acc[resource] = req.permissions!.canAccess(resource);
            return acc;
          },
          {} as Record<string, boolean>
        ),
        canModify: commonResources.reduce(
          (acc, resource) => {
            acc[resource] = req.permissions!.canModify(resource);
            return acc;
          },
          {} as Record<string, boolean>
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: 'PERMISSIONS_FETCH_FAILED',
      message: 'Failed to fetch user permissions',
    });
  }
});

// Validate token endpoint
router.get('/validate', optionalAuth(), async (req, res) => {
  if (req.user) {
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: req.user.id,
          role: req.user.role,
          status: req.user.status,
        },
      },
    });
  } else {
    res.json({
      success: true,
      data: {
        valid: false,
      },
    });
  }
});

export default router;
