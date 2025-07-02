import { Request, Response, NextFunction } from 'express';
import { authService, User, UserRole } from '../services/auth/AuthService';
import { permissionService, PermissionContext } from '../services/auth/PermissionService';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      permissions?: {
        hasPermission: (
          resource: string,
          action: string,
          context?: Partial<PermissionContext>
        ) => boolean;
        canAccess: (resource: string, context?: Partial<PermissionContext>) => boolean;
        canModify: (resource: string, context?: Partial<PermissionContext>) => boolean;
      };
    }
  }
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: UserRole[];
  permissions?: Array<{ resource: string; action: string }>;
}

export function authenticate(options: AuthMiddlewareOptions = {}) {
  const { required = true, roles = [], permissions = [] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);

      if (!token) {
        if (required) {
          return res.status(401).json({
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication token is required',
          });
        }
        return next();
      }

      // Validate token and get user
      const user = await authService.validateToken(token);

      // Check role requirements
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({
          error: 'INSUFFICIENT_ROLE',
          message: `Required role: ${roles.join(' or ')}, user role: ${user.role}`,
        });
      }

      // Check permission requirements
      if (permissions.length > 0) {
        const hasRequiredPermissions = permissionService.hasAllPermissions(user.role, permissions);

        if (!hasRequiredPermissions) {
          return res.status(403).json({
            error: 'INSUFFICIENT_PERMISSIONS',
            message: 'User does not have required permissions',
          });
        }
      }

      // Attach user and permission helpers to request
      req.user = user;
      req.permissions = createPermissionHelpers(user);

      next();
    } catch (error) {
      if (required) {
        return res.status(401).json({
          error: 'INVALID_TOKEN',
          message: error instanceof Error ? error.message : 'Invalid authentication token',
        });
      }
      next();
    }
  };
}

export function requireAuth() {
  return authenticate({ required: true });
}

export function requireRole(...roles: UserRole[]) {
  return authenticate({ required: true, roles });
}

export function requirePermission(resource: string, action: string) {
  return authenticate({
    required: true,
    permissions: [{ resource, action }],
  });
}

export function requirePermissions(...permissions: Array<{ resource: string; action: string }>) {
  return authenticate({
    required: true,
    permissions,
  });
}

export function optionalAuth() {
  return authenticate({ required: false });
}

export function checkPermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required for this action',
      });
    }

    const context = createPermissionContext(req);
    const hasPermission = permissionService.hasPermission(req.user.role, resource, action, context);

    if (!hasPermission) {
      return res.status(403).json({
        error: 'PERMISSION_DENIED',
        message: `Permission denied for ${action} on ${resource}`,
      });
    }

    next();
  };
}

export function checkResourceOwnership(
  resourceIdParam: string = 'id',
  ownerField: string = 'authorId'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required for this action',
      });
    }

    const resourceId = req.params[resourceIdParam];
    if (!resourceId) {
      return res.status(400).json({
        error: 'MISSING_RESOURCE_ID',
        message: `Resource ID parameter '${resourceIdParam}' is required`,
      });
    }

    // In a real implementation, you would fetch the resource from the database
    // and check if the user is the owner
    // For now, we'll assume the user is the owner if they are a developer or admin
    if (req.user.role === UserRole.ADMIN || req.user.role === UserRole.DEVELOPER) {
      return next();
    }

    return res.status(403).json({
      error: 'ACCESS_DENIED',
      message: 'You do not have permission to access this resource',
    });
  };
}

export function rateLimitByUser(
  maxRequests: number = 100,
  windowMs: number = 60 * 1000, // 1 minute
  message: string = 'Too many requests from this user'
) {
  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequestCounts.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      });
    }

    userLimit.count++;
    next();
  };
}

export function validateTelegramWebApp() {
  return (req: Request, res: Response, next: NextFunction) => {
    const initData = req.headers['x-telegram-web-app-init-data'] as string;

    if (!initData) {
      return res.status(400).json({
        error: 'MISSING_TELEGRAM_DATA',
        message: 'Telegram Web App initialization data is required',
      });
    }

    try {
      // Parse and validate Telegram Web App data
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      params.delete('hash');

      if (!hash) {
        throw new Error('Missing hash parameter');
      }

      // In a real implementation, validate the hash using Telegram Bot Token
      // const botToken = process.env.TELEGRAM_BOT_TOKEN;
      // const secretKey = crypto.createHash('sha256').update(botToken).digest();
      // const hmac = crypto.createHmac('sha256', secretKey).update(params.toString()).digest('hex');
      // if (hmac !== hash) throw new Error('Invalid hash');

      // Extract user data
      const userParam = params.get('user');
      if (userParam) {
        req.body.telegramUser = JSON.parse(userParam);
      }

      next();
    } catch (error) {
      return res.status(400).json({
        error: 'INVALID_TELEGRAM_DATA',
        message: 'Invalid Telegram Web App data',
      });
    }
  };
}

export function auditLog(action: string, resourceType?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data) {
      // Log the action after successful response
      if (res.statusCode < 400) {
        logAuditEvent({
          userId: req.user?.id,
          action,
          resourceType,
          resourceId: req.params.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          timestamp: new Date(),
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for token in query parameter (for WebSocket connections, etc.)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}

function createPermissionHelpers(user: User) {
  return {
    hasPermission: (resource: string, action: string, context?: Partial<PermissionContext>) => {
      const fullContext = permissionService.createPermissionContext(user.id, user.role, context);
      return permissionService.hasPermission(user.role, resource, action, fullContext);
    },

    canAccess: (resource: string, context?: Partial<PermissionContext>) => {
      const fullContext = permissionService.createPermissionContext(user.id, user.role, context);
      return permissionService.canAccessResource(user.role, resource, fullContext);
    },

    canModify: (resource: string, context?: Partial<PermissionContext>) => {
      const fullContext = permissionService.createPermissionContext(user.id, user.role, context);
      return permissionService.canModifyResource(user.role, resource, fullContext);
    },
  };
}

function createPermissionContext(req: Request): PermissionContext | undefined {
  if (!req.user) return undefined;

  return permissionService.createPermissionContext(req.user.id, req.user.role, {
    resourceId: req.params.id,
    resourceOwnerId: req.body.authorId || req.body.ownerId,
    additionalData: {
      ...req.body,
      ...req.query,
      method: req.method,
      path: req.path,
    },
  });
}

function logAuditEvent(event: {
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  method: string;
  path: string;
  statusCode: number;
  timestamp: Date;
}) {
  // In a real implementation, this would write to the audit_logs table
  console.log('Audit Log:', JSON.stringify(event, null, 2));
}
