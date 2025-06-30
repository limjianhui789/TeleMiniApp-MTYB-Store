import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { securityService } from '../services/security/SecurityService';
import { pluginSandbox } from '../services/security/PluginSandbox';

// Enhanced security middleware
export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    const nonce = securityService.generateCSPNonce();
    const headers = securityService.getSecurityHeaders(nonce);
    
    // Set all security headers
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Make nonce available for templates
    res.locals.nonce = nonce;
    
    next();
  };
}

// Rate limiting middleware with different tiers
export const createRateLimit = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) => {
  const { 
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, 
    message = 'Too many requests',
    keyGenerator = (req) => req.ip
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'RATE_LIMIT_EXCEEDED',
      message,
      retryAfter: windowMs / 1000
    },
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityService.auditSecurityEvent('rate_limit_exceeded', 'medium', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      });
      
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Specific rate limits for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later'
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: 'Too many API requests, please slow down'
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later'
});

// User-based rate limiting
export const userRateLimit = (maxRequests: number = 100, windowMs: number = 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id || req.ip;
    
    if (!securityService.checkRateLimit(userId, maxRequests, windowMs)) {
      securityService.auditSecurityEvent('user_rate_limit_exceeded', 'medium', {
        userId: req.user?.id,
        ip: req.ip,
        endpoint: req.path
      });
      
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this user',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    next();
  };
};

// Input validation and sanitization
export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Sanitize string inputs in body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    next();
  };
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return securityService.sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
}

// CSRF protection
export function csrfProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }
    
    const token = req.headers['x-csrf-token'] as string || req.body._csrf;
    const sessionToken = req.headers.authorization?.substring(7) || '';
    
    if (!token || !securityService.validateCSRFToken(token, sessionToken)) {
      securityService.auditSecurityEvent('csrf_validation_failed', 'high', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        hasToken: !!token
      });
      
      return res.status(403).json({
        error: 'CSRF_TOKEN_INVALID',
        message: 'CSRF token is missing or invalid'
      });
    }
    
    next();
  };
}

// File upload security
export function secureFileUpload() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];
    
    for (const file of files) {
      if (!file) continue;
      
      const validation = securityService.validateFileUpload(file);
      if (!validation.valid) {
        securityService.auditSecurityEvent('malicious_file_upload', 'high', {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          errors: validation.errors,
          userId: req.user?.id,
          ip: req.ip
        });
        
        return res.status(400).json({
          error: 'FILE_VALIDATION_FAILED',
          message: 'File validation failed',
          details: validation.errors
        });
      }
    }
    
    next();
  };
}

// Plugin code security scanning
export function scanPluginCode() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const code = req.body.code || req.body.source;
    
    if (!code || typeof code !== 'string') {
      return next();
    }
    
    try {
      const scanResult = await securityService.scanForMaliciousCode(code);
      
      if (!scanResult.safe) {
        securityService.auditSecurityEvent('malicious_plugin_code', 'critical', {
          threats: scanResult.threats,
          codeLength: code.length,
          userId: req.user?.id,
          ip: req.ip
        });
        
        return res.status(400).json({
          error: 'MALICIOUS_CODE_DETECTED',
          message: 'Plugin code contains potentially malicious patterns',
          threats: scanResult.threats
        });
      }
      
      next();
    } catch (error) {
      console.error('Code scanning error:', error);
      next(); // Continue if scanning fails
    }
  };
}

// IP address validation and blocking
export function ipSecurity() {
  const blockedIPs = new Set<string>();
  const suspiciousIPs = new Map<string, { count: number; lastSeen: Date }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    // Check if IP is blocked
    if (blockedIPs.has(clientIP)) {
      securityService.auditSecurityEvent('blocked_ip_access', 'high', {
        ip: clientIP,
        userAgent: req.get('User-Agent'),
        endpoint: req.path
      });
      
      return res.status(403).json({
        error: 'IP_BLOCKED',
        message: 'Access denied from this IP address'
      });
    }
    
    // Track suspicious activity
    const suspicious = suspiciousIPs.get(clientIP);
    if (suspicious) {
      suspicious.count++;
      suspicious.lastSeen = new Date();
      
      // Block IP if too many suspicious activities
      if (suspicious.count > 10) {
        blockedIPs.add(clientIP);
        securityService.auditSecurityEvent('ip_auto_blocked', 'high', {
          ip: clientIP,
          suspiciousCount: suspicious.count
        });
      }
    }
    
    // Validate IP format
    if (!securityService.validateIPAddress(clientIP)) {
      securityService.auditSecurityEvent('invalid_ip_format', 'medium', {
        ip: clientIP
      });
    }
    
    next();
  };
}

// Request size limiting
export function requestSizeLimit(maxSize: number = 10 * 1024 * 1024) { // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      securityService.auditSecurityEvent('request_size_exceeded', 'medium', {
        contentLength,
        maxSize,
        endpoint: req.path,
        ip: req.ip
      });
      
      return res.status(413).json({
        error: 'REQUEST_TOO_LARGE',
        message: `Request size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`
      });
    }
    
    next();
  };
}

// Security monitoring
export function securityMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Log suspicious patterns
    const suspiciousPatterns = [
      /\.\./,  // Directory traversal
      /<script/i,  // XSS attempts
      /union.*select/i,  // SQL injection
      /javascript:/i,  // JavaScript injection
      /eval\(/i,  // Code injection
      /__proto__/,  // Prototype pollution
      /constructor/  // Constructor access
    ];
    
    const userAgent = req.get('User-Agent') || '';
    const queryString = req.url;
    const bodyString = JSON.stringify(req.body || {});
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(queryString) || pattern.test(bodyString) || pattern.test(userAgent)) {
        securityService.auditSecurityEvent('suspicious_request_pattern', 'high', {
          pattern: pattern.source,
          ip: req.ip,
          userAgent,
          endpoint: req.path,
          method: req.method
        });
        break;
      }
    }
    
    // Monitor response for errors
    const originalSend = res.send;
    res.send = function(data) {
      const responseTime = Date.now() - startTime;
      
      // Log slow requests
      if (responseTime > 5000) { // 5 seconds
        securityService.auditSecurityEvent('slow_request', 'low', {
          responseTime,
          endpoint: req.path,
          method: req.method
        });
      }
      
      // Log errors
      if (res.statusCode >= 400) {
        securityService.auditSecurityEvent('error_response', 'medium', {
          statusCode: res.statusCode,
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          responseTime
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Plugin execution security
export function securePluginExecution() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add security context to plugin executions
    req.pluginSecurityContext = {
      sandbox: pluginSandbox,
      permissions: [], // Will be populated based on user and plugin
      resourceLimits: {
        maxCpuTime: 10000,
        maxMemoryUsage: 64 * 1024 * 1024,
        maxNetworkRequests: 50,
        maxFileOperations: 25,
        maxApiCalls: 100
      }
    };
    
    next();
  };
}

// Security cleanup middleware (should run periodically)
export function securityCleanup() {
  setInterval(() => {
    securityService.cleanupExpiredTokens();
  }, 60 * 60 * 1000); // Every hour
  
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
}

// Helmet configuration for comprehensive security
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://telegram.org"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.telegram.org"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Telegram Web App compatibility
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Export all security middleware as a combined function
export function applySecurity() {
  return [
    helmetConfig,
    securityHeaders(),
    ipSecurity(),
    sanitizeInput(),
    securityMonitoring(),
    securityCleanup()
  ];
}

// Declare module augmentation for custom properties
declare global {
  namespace Express {
    interface Request {
      pluginSecurityContext?: {
        sandbox: typeof pluginSandbox;
        permissions: any[];
        resourceLimits: any;
      };
    }
  }
}