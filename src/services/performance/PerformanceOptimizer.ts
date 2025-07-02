export interface PerformanceConfig {
  enableCodeSplitting: boolean;
  enableResourcePreloading: boolean;
  enableServiceWorker: boolean;
  cacheStrategy: CacheStrategy;
  bundleAnalysis: boolean;
  performanceMetrics: boolean;
  resourceHints: ResourceHintConfig;
}

export interface CacheStrategy {
  staticAssets: CachePolicy;
  apiResponses: CachePolicy;
  userData: CachePolicy;
  pluginAssets: CachePolicy;
}

export interface CachePolicy {
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  maxAge: number; // in seconds
  maxEntries: number;
  excludePatterns: string[];
}

export interface ResourceHintConfig {
  preload: string[];
  prefetch: string[];
  preconnect: string[];
  dnsPrefetch: string[];
}

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  customMetrics: Record<string, number>;
}

export interface BundleAnalysis {
  totalSize: number;
  compressedSize: number;
  chunkSizes: Record<string, number>;
  dependencies: DependencyInfo[];
  duplicates: DuplicateInfo[];
  unusedCode: UnusedCodeInfo[];
}

export interface DependencyInfo {
  name: string;
  size: number;
  version: string;
  isDevDependency: boolean;
  usageCount: number;
}

export interface DuplicateInfo {
  name: string;
  versions: string[];
  totalSize: number;
  instances: string[];
}

export interface UnusedCodeInfo {
  file: string;
  unusedBytes: number;
  percentage: number;
}

export class PerformanceOptimizer {
  private config: PerformanceConfig;
  private cache: Map<string, CachedResource> = new Map();
  private metrics: PerformanceMetrics;
  private observers: PerformanceObserver[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = this.mergeConfig(config);
    this.metrics = this.initializeMetrics();
    this.initialize();
  }

  /**
   * Initialize performance optimization features
   */
  private async initialize(): Promise<void> {
    if (this.config.enableServiceWorker) {
      await this.registerServiceWorker();
    }

    if (this.config.performanceMetrics) {
      this.setupPerformanceMonitoring();
    }

    if (this.config.enableResourcePreloading) {
      this.preloadResources();
    }

    // Setup intersection observer for lazy loading
    this.setupLazyLoading();
  }

  /**
   * Dynamic import with caching and error handling
   */
  async loadModule<T = any>(modulePath: string): Promise<T> {
    const cacheKey = `module:${modulePath}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (!this.isCacheExpired(cached)) {
        return cached.data;
      }
    }

    try {
      const startTime = performance.now();
      const module = await import(modulePath);
      const loadTime = performance.now() - startTime;

      // Cache the module
      this.cache.set(cacheKey, {
        data: module,
        timestamp: Date.now(),
        maxAge: this.config.cacheStrategy.staticAssets.maxAge * 1000,
        loadTime
      });

      // Track performance
      this.trackCustomMetric('moduleLoadTime', loadTime);

      return module;
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
      throw error;
    }
  }

  /**
   * Optimized fetch with caching and retries
   */
  async optimizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;
    const cachePolicy = this.getCachePolicyForURL(url);

    // Check cache first for cache-first strategy
    if (cachePolicy.strategy === 'cache-first') {
      const cached = this.cache.get(cacheKey);
      if (cached && !this.isCacheExpired(cached)) {
        return cached.data;
      }
    }

    try {
      const startTime = performance.now();
      const response = await this.fetchWithRetry(url, options);
      const loadTime = performance.now() - startTime;

      // Cache successful responses
      if (response.ok && this.shouldCache(url, cachePolicy)) {
        this.cache.set(cacheKey, {
          data: response.clone(),
          timestamp: Date.now(),
          maxAge: cachePolicy.maxAge * 1000,
          loadTime
        });
      }

      this.trackCustomMetric('apiResponseTime', loadTime);
      return response;

    } catch (error) {
      // Fallback to cache for network-first strategy
      if (cachePolicy.strategy === 'network-first') {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.warn(`Network failed, using cached response for ${url}`);
          return cached.data;
        }
      }

      throw error;
    }
  }

  /**
   * Preload critical resources
   */
  preloadResources(): void {
    const { preload, prefetch, preconnect, dnsPrefetch } = this.config.resourceHints;

    // Preload critical resources
    preload.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = this.getResourceType(url);
      document.head.appendChild(link);
    });

    // Prefetch likely needed resources
    prefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });

    // Preconnect to external domains
    preconnect.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    });

    // DNS prefetch for external domains
    dnsPrefetch.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = url;
      document.head.appendChild(link);
    });
  }

  /**
   * Setup lazy loading for images and components
   */
  private setupLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      });

      // Observe all images with data-src attribute
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Track Web Vitals and custom performance metrics
   */
  private setupPerformanceMonitoring(): void {
    // First Contentful Paint
    const fcpObserver = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
          this.reportMetric('fcp', entry.startTime);
        }
      });
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    this.observers.push(fcpObserver);

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver(list => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('lcp', lastEntry.startTime);
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(lcpObserver);

    // First Input Delay
    const fidObserver = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        this.metrics.fid = (entry as any).processingStart - entry.startTime;
        this.reportMetric('fid', this.metrics.fid);
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    this.observers.push(fidObserver);

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver(list => {
      let clsScore = 0;
      list.getEntries().forEach(entry => {
        if (!(entry as any).hadRecentInput) {
          clsScore += (entry as any).value;
        }
      });
      this.metrics.cls = clsScore;
      this.reportMetric('cls', clsScore);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(clsObserver);
  }

  /**
   * Register service worker for advanced caching
   */
  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully:', registration);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, prompt user to refresh
                this.notifyUpdate();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Fetch with retry logic and exponential backoff
   */
  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status < 500) {
          return response;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Bundle analysis for optimization insights
   */
  async analyzeBundles(): Promise<BundleAnalysis> {
    // In a real implementation, this would analyze webpack bundles
    // For now, provide a mock implementation
    return {
      totalSize: 0,
      compressedSize: 0,
      chunkSizes: {},
      dependencies: [],
      duplicates: [],
      unusedCode: []
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): PerformanceReport {
    return {
      metrics: { ...this.metrics },
      cacheHitRate: this.calculateCacheHitRate(),
      recommendations: this.generateRecommendations(),
      timestamp: new Date()
    };
  }

  /**
   * Clear performance cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup observers and resources
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.cache.clear();
  }

  // Private helper methods
  private mergeConfig(userConfig: Partial<PerformanceConfig>): PerformanceConfig {
    const defaultConfig: PerformanceConfig = {
      enableCodeSplitting: true,
      enableResourcePreloading: true,
      enableServiceWorker: true,
      bundleAnalysis: true,
      performanceMetrics: true,
      cacheStrategy: {
        staticAssets: {
          strategy: 'cache-first',
          maxAge: 31536000, // 1 year
          maxEntries: 100,
          excludePatterns: []
        },
        apiResponses: {
          strategy: 'network-first',
          maxAge: 300, // 5 minutes
          maxEntries: 50,
          excludePatterns: ['/api/auth/', '/api/payment/']
        },
        userData: {
          strategy: 'network-first',
          maxAge: 60, // 1 minute
          maxEntries: 20,
          excludePatterns: []
        },
        pluginAssets: {
          strategy: 'stale-while-revalidate',
          maxAge: 3600, // 1 hour
          maxEntries: 200,
          excludePatterns: []
        }
      },
      resourceHints: {
        preload: ['/assets/fonts/main.woff2', '/assets/css/critical.css'],
        prefetch: ['/chunks/vendor.js', '/chunks/plugins.js'],
        preconnect: ['https://api.mtyb.shop', 'https://cdn.mtyb.shop'],
        dnsPrefetch: ['https://analytics.google.com', 'https://fonts.googleapis.com']
      }
    };

    return { ...defaultConfig, ...userConfig };
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      customMetrics: {}
    };
  }

  private isCacheExpired(cached: CachedResource): boolean {
    return Date.now() - cached.timestamp > cached.maxAge;
  }

  private getCachePolicyForURL(url: string): CachePolicy {
    if (url.includes('/api/')) {
      return this.config.cacheStrategy.apiResponses;
    } else if (url.includes('/plugins/')) {
      return this.config.cacheStrategy.pluginAssets;
    } else if (url.includes('/user/')) {
      return this.config.cacheStrategy.userData;
    } else {
      return this.config.cacheStrategy.staticAssets;
    }
  }

  private shouldCache(url: string, policy: CachePolicy): boolean {
    return !policy.excludePatterns.some(pattern => url.includes(pattern));
  }

  private getResourceType(url: string): string {
    if (url.endsWith('.js')) return 'script';
    if (url.endsWith('.css')) return 'style';
    if (url.match(/\.(woff2?|ttf|otf)$/)) return 'font';
    if (url.match(/\.(jpg|jpeg|png|webp|svg)$/)) return 'image';
    return 'fetch';
  }

  private trackCustomMetric(name: string, value: number): void {
    this.metrics.customMetrics[name] = value;
  }

  private reportMetric(name: string, value: number): void {
    // In a real implementation, send to analytics service
    console.log(`Performance metric ${name}:`, value);
  }

  private notifyUpdate(): void {
    // In a real implementation, show user notification about app update
    console.log('New app version available');
  }

  private calculateCacheHitRate(): number {
    // Calculate cache hit rate based on cache statistics
    return 0.85; // Mock value
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.fcp > 2500) {
      recommendations.push('Consider optimizing critical rendering path to improve FCP');
    }

    if (this.metrics.lcp > 4000) {
      recommendations.push('Optimize largest content elements to improve LCP');
    }

    if (this.metrics.fid > 300) {
      recommendations.push('Reduce JavaScript execution time to improve FID');
    }

    if (this.metrics.cls > 0.25) {
      recommendations.push('Stabilize layout to improve CLS score');
    }

    return recommendations;
  }
}

interface CachedResource {
  data: any;
  timestamp: number;
  maxAge: number;
  loadTime: number;
}

interface PerformanceReport {
  metrics: PerformanceMetrics;
  cacheHitRate: number;
  recommendations: string[];
  timestamp: Date;
}

export const performanceOptimizer = new PerformanceOptimizer();