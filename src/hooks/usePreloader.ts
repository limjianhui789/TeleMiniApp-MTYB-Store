// ============================================================================
// Resource Preloader Hook
// ============================================================================

import { useEffect, useState } from 'react';
import { resourcePreloader, PRELOAD_CONFIGS } from '../utils/resourcePreloader';

interface UsePreloaderOptions {
  config?: keyof typeof PRELOAD_CONFIGS | string[];
  immediate?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface PreloaderState {
  isLoading: boolean;
  isComplete: boolean;
  progress: number;
  error: Error | null;
}

export const usePreloader = (options: UsePreloaderOptions = {}) => {
  const [state, setState] = useState<PreloaderState>({
    isLoading: false,
    isComplete: false,
    progress: 0,
    error: null,
  });

  const preload = async (configKey?: keyof typeof PRELOAD_CONFIGS | string[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let resources: string[] = [];

      if (Array.isArray(configKey)) {
        resources = configKey;
      } else if (configKey && PRELOAD_CONFIGS[configKey]) {
        const config = PRELOAD_CONFIGS[configKey];
        resources = config.images || [];
      } else if (options.config) {
        if (Array.isArray(options.config)) {
          resources = options.config;
        } else if (PRELOAD_CONFIGS[options.config]) {
          const config = PRELOAD_CONFIGS[options.config];
          resources = config.images || [];
        }
      }

      if (resources.length === 0) {
        setState(prev => ({ ...prev, isLoading: false, isComplete: true, progress: 100 }));
        options.onComplete?.();
        return;
      }

      let loadedCount = 0;
      const total = resources.length;

      // Preload resources one by one for progress tracking
      for (const resource of resources) {
        try {
          await resourcePreloader.preloadImage(resource);
          loadedCount++;
          const progress = Math.round((loadedCount / total) * 100);

          setState(prev => ({ ...prev, progress }));
          options.onProgress?.(loadedCount, total);
        } catch (error) {
          console.warn(`Failed to preload resource: ${resource}`, error);
          // Continue with other resources even if one fails
          loadedCount++;
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isComplete: true,
        progress: 100,
      }));

      options.onComplete?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Preload failed');
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err,
      }));
      options.onError?.(err);
    }
  };

  useEffect(() => {
    if (options.immediate && options.config) {
      preload();
    }
  }, [options.immediate, options.config]);

  return {
    ...state,
    preload,
    preloadConfig: (configKey: keyof typeof PRELOAD_CONFIGS) => preload(configKey),
    preloadImages: (images: string[]) => preload(images),
  };
};

// Hook for preloading critical resources on app startup
export const useCriticalPreloader = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const preloadCritical = async () => {
      try {
        // Create preload links for immediate download
        resourcePreloader.createPreloadLinks(PRELOAD_CONFIGS.critical);

        // Wait for critical resources to load
        await resourcePreloader.preloadResources(PRELOAD_CONFIGS.critical);

        setIsReady(true);
      } catch (error) {
        console.warn('Failed to preload critical resources:', error);
        // Still mark as ready to prevent blocking the app
        setIsReady(true);
      }
    };

    preloadCritical();
  }, []);

  return isReady;
};

// Hook for intelligent resource preloading based on user behavior
export const useIntelligentPreloader = () => {
  useEffect(() => {
    let timeoutId: number;

    const preloadOnIdle = () => {
      // Preload non-critical resources when the browser is idle
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => {
          resourcePreloader.preloadResources(PRELOAD_CONFIGS.products);
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        timeoutId = setTimeout(() => {
          resourcePreloader.preloadResources(PRELOAD_CONFIGS.products);
        }, 2000);
      }
    };

    // Start preloading after initial page load
    if (document.readyState === 'complete') {
      preloadOnIdle();
    } else {
      window.addEventListener('load', preloadOnIdle);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('load', preloadOnIdle);
    };
  }, []);
};
