import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';

// Code splitting utilities
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType
) => {
  const LazyComponent = lazy(importFn);

  return (props: any) => (
    <Suspense fallback={fallback ? fallback({}) : <div>Loading...</div>}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Resource optimization utilities
export class ResourceOptimizer {
  private static instance: ResourceOptimizer;
  private loadedResources = new Set<string>();
  private preloadQueue: string[] = [];

  static getInstance(): ResourceOptimizer {
    if (!ResourceOptimizer.instance) {
      ResourceOptimizer.instance = new ResourceOptimizer();
    }
    return ResourceOptimizer.instance;
  }

  // Image optimization
  optimizeImageUrl(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
    } = {}
  ): string {
    const { width, height, quality = 85, format = 'webp' } = options;

    // If using a CDN service like Cloudinary or ImageKit
    const params = new URLSearchParams();

    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    params.append('f', format);

    // For demo purposes, return original URL with query params
    return `${url}?${params.toString()}`;
  }

  // Preload critical resources
  preloadResource(
    url: string,
    type: 'script' | 'style' | 'image' | 'font' = 'script'
  ): Promise<void> {
    if (this.loadedResources.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;

      switch (type) {
        case 'script':
          link.as = 'script';
          break;
        case 'style':
          link.as = 'style';
          break;
        case 'image':
          link.as = 'image';
          break;
        case 'font':
          link.as = 'font';
          link.crossOrigin = 'anonymous';
          break;
      }

      link.onload = () => {
        this.loadedResources.add(url);
        resolve();
      };

      link.onerror = reject;

      document.head.appendChild(link);
    });
  }

  // Batch preload resources
  async preloadResources(
    resources: Array<{ url: string; type: 'script' | 'style' | 'image' | 'font' }>
  ): Promise<void> {
    const promises = resources.map(resource => this.preloadResource(resource.url, resource.type));

    await Promise.allSettled(promises);
  }

  // Dynamic script loading
  async loadScript(url: string): Promise<void> {
    if (this.loadedResources.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;

      script.onload = () => {
        this.loadedResources.add(url);
        resolve();
      };

      script.onerror = reject;

      document.head.appendChild(script);
    });
  }

  // Dynamic CSS loading
  async loadStylesheet(url: string): Promise<void> {
    if (this.loadedResources.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;

      link.onload = () => {
        this.loadedResources.add(url);
        resolve();
      };

      link.onerror = reject;

      document.head.appendChild(link);
    });
  }

  // Service worker registration
  async registerServiceWorker(
    swPath: string = '/sw.js'
  ): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(swPath);
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
}

// Bundle analysis utilities
export class BundleAnalyzer {
  private chunks = new Map<string, { size: number; modules: string[] }>();

  analyzeChunk(chunkName: string, modules: string[]): void {
    const size = this.estimateChunkSize(modules);
    this.chunks.set(chunkName, { size, modules });
  }

  getChunkReport(): Record<string, { size: number; modules: string[]; percentage: number }> {
    const totalSize = Array.from(this.chunks.values()).reduce((sum, chunk) => sum + chunk.size, 0);
    const report: Record<string, any> = {};

    for (const [name, chunk] of this.chunks.entries()) {
      report[name] = {
        ...chunk,
        percentage: (chunk.size / totalSize) * 100,
      };
    }

    return report;
  }

  getLargestChunks(limit: number = 5): Array<{ name: string; size: number; percentage: number }> {
    const report = this.getChunkReport();

    return Object.entries(report)
      .sort(([, a], [, b]) => b.size - a.size)
      .slice(0, limit)
      .map(([name, data]) => ({
        name,
        size: data.size,
        percentage: data.percentage,
      }));
  }

  private estimateChunkSize(modules: string[]): number {
    // Simplified size estimation - in real implementation would use actual bundle data
    return modules.length * 1024; // Assume 1KB per module
  }
}

// Performance budget checker
export class PerformanceBudget {
  private budgets = {
    totalJSSize: 500 * 1024, // 500KB
    totalCSSSize: 100 * 1024, // 100KB
    totalImageSize: 2 * 1024 * 1024, // 2MB
    firstContentfulPaint: 2000, // 2 seconds
    largestContentfulPaint: 4000, // 4 seconds
    timeToInteractive: 5000, // 5 seconds
    cumulativeLayoutShift: 0.1,
  };

  checkBudget(metrics: {
    jsSize?: number;
    cssSize?: number;
    imageSize?: number;
    fcp?: number;
    lcp?: number;
    tti?: number;
    cls?: number;
  }): { passed: boolean; violations: string[] } {
    const violations: string[] = [];

    if (metrics.jsSize && metrics.jsSize > this.budgets.totalJSSize) {
      violations.push(
        `JavaScript size (${metrics.jsSize}) exceeds budget (${this.budgets.totalJSSize})`
      );
    }

    if (metrics.cssSize && metrics.cssSize > this.budgets.totalCSSSize) {
      violations.push(
        `CSS size (${metrics.cssSize}) exceeds budget (${this.budgets.totalCSSSize})`
      );
    }

    if (metrics.imageSize && metrics.imageSize > this.budgets.totalImageSize) {
      violations.push(
        `Image size (${metrics.imageSize}) exceeds budget (${this.budgets.totalImageSize})`
      );
    }

    if (metrics.fcp && metrics.fcp > this.budgets.firstContentfulPaint) {
      violations.push(
        `First Contentful Paint (${metrics.fcp}ms) exceeds budget (${this.budgets.firstContentfulPaint}ms)`
      );
    }

    if (metrics.lcp && metrics.lcp > this.budgets.largestContentfulPaint) {
      violations.push(
        `Largest Contentful Paint (${metrics.lcp}ms) exceeds budget (${this.budgets.largestContentfulPaint}ms)`
      );
    }

    if (metrics.tti && metrics.tti > this.budgets.timeToInteractive) {
      violations.push(
        `Time to Interactive (${metrics.tti}ms) exceeds budget (${this.budgets.timeToInteractive}ms)`
      );
    }

    if (metrics.cls && metrics.cls > this.budgets.cumulativeLayoutShift) {
      violations.push(
        `Cumulative Layout Shift (${metrics.cls}) exceeds budget (${this.budgets.cumulativeLayoutShift})`
      );
    }

    return {
      passed: violations.length === 0,
      violations,
    };
  }

  updateBudget(newBudgets: Partial<typeof this.budgets>): void {
    Object.assign(this.budgets, newBudgets);
  }
}

// Web Vitals monitoring
export class WebVitalsMonitor {
  private metrics: Record<string, number> = {};
  private observers: PerformanceObserver[] = [];

  startMonitoring(): void {
    this.monitorFCP();
    this.monitorLCP();
    this.monitorFID();
    this.monitorCLS();
    this.monitorTTFB();
  }

  getMetrics(): Record<string, number> {
    return { ...this.metrics };
  }

  private monitorFCP(): void {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
      }
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.push(observer);
  }

  private monitorLCP(): void {
    const observer = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  private monitorFID(): void {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        this.metrics.fid = (entry as any).processingStart - entry.startTime;
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  private monitorCLS(): void {
    let clsValue = 0;

    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          this.metrics.cls = clsValue;
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  private monitorTTFB(): void {
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          this.metrics.ttfb = (entry as any).responseStart - entry.startTime;
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Image lazy loading utility
export class LazyImageLoader {
  private observer?: IntersectionObserver;
  private images = new Set<HTMLImageElement>();

  init(): void {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              this.loadImage(img);
              this.observer?.unobserve(img);
              this.images.delete(img);
            }
          });
        },
        { rootMargin: '50px' }
      );
    }
  }

  observe(img: HTMLImageElement): void {
    if (this.observer) {
      this.observer.observe(img);
      this.images.add(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  private loadImage(img: HTMLImageElement): void {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.removeAttribute('data-src');
    }
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

// Critical resource preloader
export class CriticalResourcePreloader {
  async preloadCriticalResources(): Promise<void> {
    const criticalResources = [
      { url: '/api/plugins/featured', type: 'fetch' },
      { url: '/fonts/inter.woff2', type: 'font' },
      { url: '/images/hero-bg.webp', type: 'image' },
    ];

    const promises = criticalResources.map(async resource => {
      switch (resource.type) {
        case 'fetch':
          return fetch(resource.url, { priority: 'high' } as any);
        case 'font':
        case 'image':
          return ResourceOptimizer.getInstance().preloadResource(
            resource.url,
            resource.type as any
          );
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(promises);
  }
}

// Export singleton instances
export const resourceOptimizer = ResourceOptimizer.getInstance();
export const bundleAnalyzer = new BundleAnalyzer();
export const performanceBudget = new PerformanceBudget();
export const webVitalsMonitor = new WebVitalsMonitor();
export const lazyImageLoader = new LazyImageLoader();
export const criticalResourcePreloader = new CriticalResourcePreloader();

// Auto-initialize
if (typeof window !== 'undefined') {
  webVitalsMonitor.startMonitoring();
  lazyImageLoader.init();

  // Preload critical resources on page load
  window.addEventListener('load', () => {
    criticalResourcePreloader.preloadCriticalResources();
  });
}

// Performance optimization configuration
export const performanceConfig = {
  codesplitting: {
    enabled: true,
    chunkStrategy: 'route-based',
    vendorChunkThreshold: 100 * 1024, // 100KB
  },
  bundleOptimization: {
    treeshaking: true,
    minification: true,
    compression: 'gzip',
    sourceMaps: process.env.NODE_ENV === 'development',
  },
  caching: {
    staticAssets: {
      maxAge: 31536000, // 1 year
      immutable: true,
    },
    apiResponses: {
      maxAge: 300, // 5 minutes
      staleWhileRevalidate: 60,
    },
  },
  preloading: {
    criticalResources: true,
    preloadLimit: 3,
    prefetchOnHover: true,
  },
};
