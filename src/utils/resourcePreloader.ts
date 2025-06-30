// ============================================================================
// Resource Preloader Utility
// ============================================================================

interface PreloadConfig {
  images?: string[];
  scripts?: string[];
  styles?: string[];
  priority?: 'high' | 'low';
}

class ResourcePreloader {
  private loadedResources = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();

  /**
   * Preload an image resource
   */
  async preloadImage(src: string): Promise<void> {
    if (this.loadedResources.has(src)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedResources.add(src);
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Preload multiple images
   */
  async preloadImages(srcs: string[]): Promise<void[]> {
    return Promise.all(srcs.map(src => this.preloadImage(src)));
  }

  /**
   * Preload a script resource
   */
  async preloadScript(src: string): Promise<void> {
    if (this.loadedResources.has(src)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      
      script.onload = () => {
        this.loadedResources.add(src);
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  /**
   * Preload a CSS resource
   */
  async preloadStyle(href: string): Promise<void> {
    if (this.loadedResources.has(href)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(href)) {
      return this.loadingPromises.get(href)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const link = document.createElement('link');
      
      link.onload = () => {
        this.loadedResources.add(href);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load stylesheet: ${href}`));
      };
      
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });

    this.loadingPromises.set(href, promise);
    return promise;
  }

  /**
   * Preload resources based on configuration
   */
  async preloadResources(config: PreloadConfig): Promise<void> {
    const promises: Promise<any>[] = [];

    if (config.images) {
      promises.push(this.preloadImages(config.images));
    }

    if (config.scripts) {
      promises.push(...config.scripts.map(src => this.preloadScript(src)));
    }

    if (config.styles) {
      promises.push(...config.styles.map(href => this.preloadStyle(href)));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Create preload link tags for critical resources
   */
  createPreloadLinks(config: PreloadConfig): void {
    const fragment = document.createDocumentFragment();

    // Preload critical images
    if (config.images) {
      config.images.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        if (config.priority === 'high') {
          link.setAttribute('fetchpriority', 'high');
        }
        fragment.appendChild(link);
      });
    }

    // Preload critical scripts
    if (config.scripts) {
      config.scripts.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = src;
        if (config.priority === 'high') {
          link.setAttribute('fetchpriority', 'high');
        }
        fragment.appendChild(link);
      });
    }

    // Preload critical styles
    if (config.styles) {
      config.styles.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = href;
        if (config.priority === 'high') {
          link.setAttribute('fetchpriority', 'high');
        }
        fragment.appendChild(link);
      });
    }

    document.head.appendChild(fragment);
  }

  /**
   * Check if a resource is already loaded
   */
  isLoaded(src: string): boolean {
    return this.loadedResources.has(src);
  }

  /**
   * Get loading statistics
   */
  getStats() {
    return {
      loadedCount: this.loadedResources.size,
      loadingCount: this.loadingPromises.size,
      loadedResources: Array.from(this.loadedResources)
    };
  }
}

// Create singleton instance
export const resourcePreloader = new ResourcePreloader();

// Predefined resource configurations for different sections
export const PRELOAD_CONFIGS = {
  // Critical resources needed immediately
  critical: {
    images: [
      '/images/logo.png',
      '/images/curlec-logo.png'
    ],
    priority: 'high' as const
  },

  // Payment flow resources
  payment: {
    images: [
      '/images/payment-icons/visa.png',
      '/images/payment-icons/mastercard.png',
      '/images/payment-icons/curlec.png'
    ],
    priority: 'high' as const
  },

  // Product page resources
  products: {
    images: [
      '/images/placeholder-product.png',
      '/images/category-icons/digital-goods.png'
    ],
    priority: 'low' as const
  }
};