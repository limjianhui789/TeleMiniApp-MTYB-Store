import { performance, PerformanceObserver } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: Date;
  endpoint: string;
  method: string;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  statusCode?: number;
  userId?: string;
  cacheHit?: boolean;
}

export interface ResourceMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  gc: {
    collections: number;
    duration: number;
  };
  eventLoop: {
    delay: number;
    utilization: number;
  };
}

export interface PerformanceAlert {
  type: 'slow_request' | 'high_memory' | 'high_cpu' | 'gc_pressure' | 'event_loop_lag';
  severity: 'warning' | 'critical';
  message: string;
  metrics: any;
  timestamp: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private thresholds = {
    slowRequest: 5000, // 5 seconds
    highMemory: 512 * 1024 * 1024, // 512MB
    highCpu: 80, // 80%
    eventLoopLag: 100, // 100ms
    gcDuration: 50, // 50ms
  };

  private observers: PerformanceObserver[] = [];
  private intervalId?: number;

  constructor() {
    this.setupPerformanceObservers();
    this.startResourceMonitoring();
  }

  // Track request performance
  trackRequest(
    endpoint: string,
    method: string,
    startTime: number,
    statusCode?: number,
    userId?: string,
    cacheHit?: boolean
  ): PerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - startTime;
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metric: PerformanceMetrics = {
      timestamp: new Date(),
      endpoint,
      method,
      duration,
      memoryUsage,
      cpuUsage,
      statusCode,
      userId,
      cacheHit,
    };

    this.metrics.push(metric);
    this.checkPerformanceThresholds(metric);
    this.limitMetricsSize();

    return metric;
  }

  // Create performance timing middleware
  createTimingMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const originalSend = res.send;

      res.send = function (data: any) {
        const metric = req.app.locals.performanceMonitor?.trackRequest(
          req.path,
          req.method,
          startTime,
          res.statusCode,
          req.user?.id,
          res.locals?.cacheHit
        );

        // Add performance header
        res.setHeader('X-Response-Time', `${metric.duration.toFixed(2)}ms`);

        return originalSend.call(this, data);
      };

      next();
    };
  }

  // Get performance statistics
  getStats(timeRange?: { start: Date; end: Date }) {
    let filteredMetrics = this.metrics;

    if (timeRange) {
      filteredMetrics = this.metrics.filter(
        m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    if (filteredMetrics.length === 0) {
      return null;
    }

    const durations = filteredMetrics.map(m => m.duration);
    const memoryUsages = filteredMetrics.map(m => m.memoryUsage.heapUsed);

    return {
      totalRequests: filteredMetrics.length,
      averageResponseTime: this.average(durations),
      medianResponseTime: this.median(durations),
      p95ResponseTime: this.percentile(durations, 95),
      p99ResponseTime: this.percentile(durations, 99),
      slowRequests: filteredMetrics.filter(m => m.duration > this.thresholds.slowRequest).length,
      averageMemoryUsage: this.average(memoryUsages),
      peakMemoryUsage: Math.max(...memoryUsages),
      cacheHitRate: this.calculateCacheHitRate(filteredMetrics),
      errorRate: this.calculateErrorRate(filteredMetrics),
      endpointStats: this.getEndpointStats(filteredMetrics),
      timeRange: {
        start: Math.min(...filteredMetrics.map(m => m.timestamp.getTime())),
        end: Math.max(...filteredMetrics.map(m => m.timestamp.getTime())),
      },
    };
  }

  // Get current resource metrics
  getCurrentResourceMetrics(): ResourceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpu: {
        usage: this.calculateCpuPercentage(cpuUsage),
        load: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
      },
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      },
      gc: {
        collections: 0, // Will be updated by observer
        duration: 0, // Will be updated by observer
      },
      eventLoop: {
        delay: this.measureEventLoopDelay(),
        utilization: this.measureEventLoopUtilization(),
      },
    };
  }

  // Get performance alerts
  getAlerts(severity?: 'warning' | 'critical'): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return this.alerts;
  }

  // Clear old metrics and alerts
  cleanup(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  // Setup performance observers
  private setupPerformanceObservers(): void {
    // HTTP request observer
    if (PerformanceObserver.supportedEntryTypes.includes('measure')) {
      const httpObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('http-request')) {
            this.analyzeHttpTiming(entry);
          }
        }
      });

      httpObserver.observe({ entryTypes: ['measure'] });
      this.observers.push(httpObserver);
    }

    // GC observer
    if (PerformanceObserver.supportedEntryTypes.includes('gc')) {
      const gcObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
        for (const entry of list.getEntries()) {
          this.analyzeGcTiming(entry);
        }
      });

      gcObserver.observe({ entryTypes: ['gc'] });
      this.observers.push(gcObserver);
    }
  }

  // Start resource monitoring
  private startResourceMonitoring(): void {
    this.intervalId = setInterval(() => {
      const resourceMetrics = this.getCurrentResourceMetrics();
      this.checkResourceThresholds(resourceMetrics);
    }, 5000); // Check every 5 seconds
  }

  // Check performance thresholds
  private checkPerformanceThresholds(metric: PerformanceMetrics): void {
    // Slow request alert
    if (metric.duration > this.thresholds.slowRequest) {
      this.addAlert({
        type: 'slow_request',
        severity: metric.duration > this.thresholds.slowRequest * 2 ? 'critical' : 'warning',
        message: `Slow request detected: ${metric.endpoint} took ${metric.duration.toFixed(2)}ms`,
        metrics: metric,
        timestamp: new Date(),
      });
    }

    // High memory alert
    if (metric.memoryUsage.heapUsed > this.thresholds.highMemory) {
      this.addAlert({
        type: 'high_memory',
        severity:
          metric.memoryUsage.heapUsed > this.thresholds.highMemory * 1.5 ? 'critical' : 'warning',
        message: `High memory usage: ${(metric.memoryUsage.heapUsed / (1024 * 1024)).toFixed(2)}MB`,
        metrics: metric.memoryUsage,
        timestamp: new Date(),
      });
    }
  }

  // Check resource thresholds
  private checkResourceThresholds(metrics: ResourceMetrics): void {
    // High CPU alert
    if (metrics.cpu.usage > this.thresholds.highCpu) {
      this.addAlert({
        type: 'high_cpu',
        severity: metrics.cpu.usage > 95 ? 'critical' : 'warning',
        message: `High CPU usage: ${metrics.cpu.usage.toFixed(2)}%`,
        metrics: metrics.cpu,
        timestamp: new Date(),
      });
    }

    // Event loop lag alert
    if (metrics.eventLoop.delay > this.thresholds.eventLoopLag) {
      this.addAlert({
        type: 'event_loop_lag',
        severity:
          metrics.eventLoop.delay > this.thresholds.eventLoopLag * 2 ? 'critical' : 'warning',
        message: `Event loop lag detected: ${metrics.eventLoop.delay.toFixed(2)}ms`,
        metrics: metrics.eventLoop,
        timestamp: new Date(),
      });
    }
  }

  // Add performance alert
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Log critical alerts immediately
    if (alert.severity === 'critical') {
      console.error('🚨 CRITICAL PERFORMANCE ALERT:', alert);
    } else {
      console.warn('⚠️ PERFORMANCE WARNING:', alert);
    }

    // Limit alerts size
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
  }

  // Analyze HTTP timing
  private analyzeHttpTiming(entry: any): void {
    // Custom analysis for HTTP request timing
    if (entry.duration > this.thresholds.slowRequest) {
      console.warn(`Slow HTTP request: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
    }
  }

  // Analyze GC timing
  private analyzeGcTiming(entry: any): void {
    if (entry.duration > this.thresholds.gcDuration) {
      this.addAlert({
        type: 'gc_pressure',
        severity: entry.duration > this.thresholds.gcDuration * 2 ? 'critical' : 'warning',
        message: `Long GC pause: ${entry.duration.toFixed(2)}ms (${entry.detail?.kind || 'unknown'})`,
        metrics: { duration: entry.duration, kind: entry.detail?.kind },
        timestamp: new Date(),
      });
    }
  }

  // Calculate CPU percentage
  private calculateCpuPercentage(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified calculation
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(100, (totalUsage / 1000000) * 100); // Convert to percentage
  }

  // Measure event loop delay
  private measureEventLoopDelay(): number {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const delay = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
      return delay;
    });
    return 0; // Placeholder - would need async measurement
  }

  // Measure event loop utilization
  private measureEventLoopUtilization(): number {
    // This would require more sophisticated measurement
    return 0; // Placeholder
  }

  // Statistics helper methods
  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private median(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private percentile(numbers: number[], p: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private calculateCacheHitRate(metrics: PerformanceMetrics[]): number {
    const withCacheInfo = metrics.filter(m => m.cacheHit !== undefined);
    if (withCacheInfo.length === 0) return 0;

    const hits = withCacheInfo.filter(m => m.cacheHit).length;
    return (hits / withCacheInfo.length) * 100;
  }

  private calculateErrorRate(metrics: PerformanceMetrics[]): number {
    const withStatusCode = metrics.filter(m => m.statusCode !== undefined);
    if (withStatusCode.length === 0) return 0;

    const errors = withStatusCode.filter(m => m.statusCode! >= 400).length;
    return (errors / withStatusCode.length) * 100;
  }

  private getEndpointStats(metrics: PerformanceMetrics[]) {
    const endpointMap = new Map<string, PerformanceMetrics[]>();

    for (const metric of metrics) {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!endpointMap.has(key)) {
        endpointMap.set(key, []);
      }
      endpointMap.get(key)!.push(metric);
    }

    const stats: any = {};

    for (const [endpoint, endpointMetrics] of endpointMap.entries()) {
      const durations = endpointMetrics.map(m => m.duration);
      stats[endpoint] = {
        count: endpointMetrics.length,
        averageTime: this.average(durations),
        medianTime: this.median(durations),
        maxTime: Math.max(...durations),
        minTime: Math.min(...durations),
        errorRate: this.calculateErrorRate(endpointMetrics),
      };
    }

    return stats;
  }

  private limitMetricsSize(): void {
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  // Destroy observers
  destroy(): void {
    for (const observer of this.observers) {
      observer.disconnect();
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Graceful shutdown
process.on('SIGINT', () => {
  performanceMonitor.destroy();
});

process.on('SIGTERM', () => {
  performanceMonitor.destroy();
});
