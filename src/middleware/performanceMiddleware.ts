import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { performanceMonitor } from '../services/performance/PerformanceMonitor';
import { cacheService, apiCache } from '../services/performance/CacheService';

// Response compression middleware
export function compressionMiddleware() {
  return compression({
    level: 6, // Compression level (1-9)
    threshold: 1024, // Only compress responses > 1KB
    filter: (req: Request, res: Response) => {
      // Don't compress if response is already compressed
      if (res.getHeader('Content-Encoding')) {
        return false;
      }

      // Compress text-based content types
      const contentType = res.getHeader('Content-Type') as string;
      return /text|javascript|json|xml|svg/.test(contentType || '');
    },
  });
}

// Performance timing middleware
export function performanceTimingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Store start time
    req.startTime = startTime;

    // Override res.send to capture timing
    const originalSend = res.send;
    res.send = function (data) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Track performance metrics
      performanceMonitor.trackRequest(
        req.path,
        req.method,
        startTime,
        res.statusCode,
        req.user?.id,
        res.locals.cacheHit
      );

      // Add performance headers
      res.setHeader('X-Response-Time', `${duration}ms`);
      res.setHeader('X-Cache-Status', res.locals.cacheHit ? 'HIT' : 'MISS');

      return originalSend.call(this, data);
    };

    next();
  };
}

// API response caching middleware
export function apiCacheMiddleware(ttl: number = 300000) {
  // 5 minutes default
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching for authenticated users unless explicitly allowed
    if (req.user && !res.locals.allowCache) {
      return next();
    }

    const cacheKey = apiCache.generateApiCacheKey(req.method, req.path, req.query);

    try {
      // Try to get cached response
      const cachedResponse = await apiCache.get(cacheKey);

      if (cachedResponse) {
        res.locals.cacheHit = true;

        // Set cache headers
        res.setHeader('X-Cache-Status', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);

        return res.json(cachedResponse);
      }

      // Cache miss - continue to handler
      res.locals.cacheHit = false;

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (data) {
        // Only cache successful responses
        if (res.statusCode < 400) {
          apiCache.set(cacheKey, data, ttl).catch(error => {
            console.error('Failed to cache response:', error);
          });

          // Set cache headers
          res.setHeader('Cache-Control', `public, max-age=${Math.floor(ttl / 1000)}`);
          res.setHeader('X-Cache-Status', 'MISS');
        }

        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

// Request size monitoring
export function requestSizeMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');

    // Log large requests
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB
      console.warn(`Large request detected: ${req.path} - ${contentLength} bytes`);
    }

    // Add request size to metrics
    req.requestSize = contentLength;

    next();
  };
}

// Memory usage monitoring
export function memoryMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const initialMemory = process.memoryUsage();

    // Override res.send to measure memory delta
    const originalSend = res.send;
    res.send = function (data) {
      const finalMemory = process.memoryUsage();
      const memoryDelta = finalMemory.heapUsed - initialMemory.heapUsed;

      // Log significant memory increases
      if (memoryDelta > 50 * 1024 * 1024) {
        // 50MB
        console.warn(`High memory usage for ${req.path}: ${memoryDelta / (1024 * 1024)}MB`);
      }

      res.setHeader('X-Memory-Delta', `${memoryDelta}`);

      return originalSend.call(this, data);
    };

    next();
  };
}

// Static asset optimization
export function staticAssetOptimization() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set aggressive caching for static assets
    if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      // Check if file has hash in name (for immutable assets)
      const hasHash = /\.[a-f0-9]{8,}\./i.test(req.path);

      if (hasHash) {
        // Immutable assets - cache for 1 year
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        // Regular assets - cache for 1 week
        res.setHeader('Cache-Control', 'public, max-age=604800');
      }

      // Add ETag
      res.setHeader('ETag', `"${Date.now()}"`);
    }

    next();
  };
}

// Response optimization
export function responseOptimization() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Remove unnecessary headers
    res.removeHeader('X-Powered-By');

    // Add performance hints
    res.setHeader('X-DNS-Prefetch-Control', 'on');
    res.setHeader('X-Frame-Options', 'DENY');

    // Optimize JSON responses
    const originalJson = res.json;
    res.json = function (data) {
      // Minify JSON in production
      if (process.env.NODE_ENV === 'production') {
        return originalJson.call(this, JSON.parse(JSON.stringify(data)));
      }

      return originalJson.call(this, data);
    };

    next();
  };
}

// Conditional requests handling
export function conditionalRequests() {
  return (req: Request, res: Response, next: NextFunction) => {
    const ifNoneMatch = req.get('If-None-Match');
    const ifModifiedSince = req.get('If-Modified-Since');

    // Override res.send to handle conditional requests
    const originalSend = res.send;
    res.send = function (data) {
      const etag = res.get('ETag');
      const lastModified = res.get('Last-Modified');

      // Check If-None-Match
      if (ifNoneMatch && etag && ifNoneMatch === etag) {
        res.status(304).end();
        return res;
      }

      // Check If-Modified-Since
      if (ifModifiedSince && lastModified) {
        const ifModifiedSinceDate = new Date(ifModifiedSince);
        const lastModifiedDate = new Date(lastModified);

        if (ifModifiedSinceDate >= lastModifiedDate) {
          res.status(304).end();
          return res;
        }
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

// Bundle analysis middleware (development only)
export function bundleAnalysis() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    // Add bundle info to response headers for analysis
    if (req.path.endsWith('.js')) {
      res.setHeader('X-Bundle-Type', 'javascript');
      res.setHeader('X-Bundle-Size', res.get('Content-Length') || '0');
    }

    if (req.path.endsWith('.css')) {
      res.setHeader('X-Bundle-Type', 'stylesheet');
      res.setHeader('X-Bundle-Size', res.get('Content-Length') || '0');
    }

    next();
  };
}

// Performance budget enforcement
export function performanceBudgetEnforcement() {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;

    res.send = function (data) {
      const responseSize = Buffer.byteLength(data, 'utf8');
      const maxResponseSize = 5 * 1024 * 1024; // 5MB

      if (responseSize > maxResponseSize) {
        console.warn(`Response size budget exceeded: ${req.path} - ${responseSize} bytes`);
        res.setHeader('X-Budget-Warning', 'Response size exceeds budget');
      }

      res.setHeader('X-Response-Size', responseSize.toString());

      return originalSend.call(this, data);
    };

    next();
  };
}

// Resource hints middleware
export function resourceHints() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add resource hints for HTML responses
    if (req.accepts('html')) {
      const hints = [
        '</api/plugins/featured>; rel=prefetch',
        '</fonts/inter.woff2>; rel=preload; as=font; crossorigin',
        '</css/main.css>; rel=preload; as=style',
      ];

      res.setHeader('Link', hints.join(', '));
    }

    next();
  };
}

// Lazy loading support
export function lazyLoadingSupport() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add intersection observer polyfill hint
    if (req.get('User-Agent')?.includes('Chrome/')) {
      res.setHeader('X-IntersectionObserver-Support', 'native');
    } else {
      res.setHeader('X-IntersectionObserver-Support', 'polyfill');
    }

    next();
  };
}

// Web vitals monitoring endpoint
export function webVitalsEndpoint() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/vitals' && req.method === 'POST') {
      const vitals = req.body;

      // Store web vitals data
      console.log('Web Vitals received:', vitals);

      // In a real implementation, store in database or analytics service

      res.json({ success: true });
      return;
    }

    next();
  };
}

// Performance monitoring dashboard data
export function performanceDashboard() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/performance/dashboard' && req.method === 'GET') {
      const stats = performanceMonitor.getStats();
      const cacheStats = cacheService.getStats();

      res.json({
        performance: stats,
        cache: cacheStats,
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
        },
      });
      return;
    }

    next();
  };
}

// Combined performance middleware
export function applyPerformanceOptimizations() {
  return [
    compressionMiddleware(),
    performanceTimingMiddleware(),
    requestSizeMonitoring(),
    memoryMonitoring(),
    staticAssetOptimization(),
    responseOptimization(),
    conditionalRequests(),
    resourceHints(),
    lazyLoadingSupport(),
    webVitalsEndpoint(),
    performanceDashboard(),
    ...(process.env.NODE_ENV === 'development' ? [bundleAnalysis()] : []),
    performanceBudgetEnforcement(),
  ];
}

// Declare module augmentation
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      requestSize?: number;
    }

    interface Response {
      locals: {
        cacheHit?: boolean;
        allowCache?: boolean;
        [key: string]: any;
      };
    }
  }
}
