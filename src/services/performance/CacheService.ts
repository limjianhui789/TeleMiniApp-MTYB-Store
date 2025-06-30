import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

export interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  updateAgeOnGet?: boolean;
  allowStale?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
}

export interface CacheEntry<T> {
  value: T;
  createdAt: Date;
  expiresAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

export class CacheService {
  private memoryCache: LRUCache<string, CacheEntry<any>>;
  private distributedCache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0,
    hitRate: 0
  };

  constructor(config: CacheConfig = { maxSize: 1000, ttl: 300000 }) {
    this.memoryCache = new LRUCache({
      max: config.maxSize,
      ttl: config.ttl,
      updateAgeOnGet: config.updateAgeOnGet ?? true,
      allowStale: config.allowStale ?? false
    });
  }

  // Memory caching methods
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key);
    
    // Try memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      memoryEntry.accessCount++;
      memoryEntry.lastAccessed = new Date();
      this.stats.hits++;
      this.updateHitRate();
      return memoryEntry.value;
    }

    // Try distributed cache
    const distributedEntry = this.distributedCache.get(cacheKey);
    if (distributedEntry && !this.isExpired(distributedEntry)) {
      // Promote to memory cache
      this.memoryCache.set(cacheKey, distributedEntry);
      distributedEntry.accessCount++;
      distributedEntry.lastAccessed = new Date();
      this.stats.hits++;
      this.updateHitRate();
      return distributedEntry.value;
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const now = new Date();
    const expirationTime = ttl || 300000; // 5 minutes default
    
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      expiresAt: new Date(now.getTime() + expirationTime),
      accessCount: 0,
      lastAccessed: now
    };

    // Set in both memory and distributed cache
    this.memoryCache.set(cacheKey, entry);
    this.distributedCache.set(cacheKey, entry);
    
    this.stats.sets++;
    this.stats.size = this.memoryCache.size;
  }

  async delete(key: string): Promise<boolean> {
    const cacheKey = this.generateCacheKey(key);
    
    const memoryDeleted = this.memoryCache.delete(cacheKey);
    const distributedDeleted = this.distributedCache.delete(cacheKey);
    
    if (memoryDeleted || distributedDeleted) {
      this.stats.deletes++;
      this.stats.size = this.memoryCache.size;
      return true;
    }
    
    return false;
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.distributedCache.clear();
    this.stats.size = 0;
  }

  // Cache patterns
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null) {
      value = await factory();
      await this.set(key, value, ttl);
    }
    
    return value;
  }

  async mget<T>(keys: string[]): Promise<Array<T | null>> {
    const results: Array<T | null> = [];
    
    for (const key of keys) {
      results.push(await this.get<T>(key));
    }
    
    return results;
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = entries.map(entry => 
      this.set(entry.key, entry.value, entry.ttl)
    );
    
    await Promise.all(promises);
  }

  // Tag-based caching
  async setWithTags<T>(
    key: string, 
    value: T, 
    tags: string[], 
    ttl?: number
  ): Promise<void> {
    await this.set(key, value, ttl);
    
    // Store tag relationships
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.get<string[]>(tagKey) || [];
      
      if (!taggedKeys.includes(key)) {
        taggedKeys.push(key);
        await this.set(tagKey, taggedKeys, ttl);
      }
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `tag:${tag}`;
    const taggedKeys = await this.get<string[]>(tagKey);
    
    if (taggedKeys) {
      const deletePromises = taggedKeys.map(key => this.delete(key));
      await Promise.all(deletePromises);
      await this.delete(tagKey);
    }
  }

  // Statistics and monitoring
  getStats(): CacheStats {
    return {
      ...this.stats,
      size: this.memoryCache.size
    };
  }

  getHitRate(): number {
    return this.stats.hitRate;
  }

  // Cache warming
  async warmup(warmupData: Array<{ key: string; factory: () => Promise<any>; ttl?: number }>): Promise<void> {
    console.log(`🔥 Warming up cache with ${warmupData.length} entries...`);
    
    const promises = warmupData.map(async (item) => {
      try {
        const value = await item.factory();
        await this.set(item.key, value, item.ttl);
      } catch (error) {
        console.error(`Cache warmup failed for key ${item.key}:`, error);
      }
    });
    
    await Promise.all(promises);
    console.log('✅ Cache warmup completed');
  }

  // Cache compression for large objects
  async setCompressed<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const compressed = await this.compress(serialized);
    await this.set(`compressed:${key}`, compressed, ttl);
  }

  async getCompressed<T>(key: string): Promise<T | null> {
    const compressed = await this.get<Buffer>(`compressed:${key}`);
    if (!compressed) return null;
    
    const decompressed = await this.decompress(compressed);
    return JSON.parse(decompressed);
  }

  // Utility methods
  private generateCacheKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return new Date() > entry.expiresAt;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private async compress(data: string): Promise<Buffer> {
    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);
    
    return await gzipAsync(Buffer.from(data, 'utf8'));
  }

  private async decompress(data: Buffer): Promise<string> {
    const { gunzip } = await import('zlib');
    const { promisify } = await import('util');
    const gunzipAsync = promisify(gunzip);
    
    const decompressed = await gunzipAsync(data);
    return decompressed.toString('utf8');
  }

  // Cleanup expired entries
  cleanup(): void {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.distributedCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.distributedCache.delete(key);
    }
    
    this.stats.size = this.memoryCache.size;
  }
}

// Application-specific cache instances
export class PluginCacheService extends CacheService {
  constructor() {
    super({ maxSize: 500, ttl: 600000 }); // 10 minutes for plugins
  }

  async getPlugin(pluginId: string) {
    return this.get(`plugin:${pluginId}`);
  }

  async setPlugin(pluginId: string, plugin: any) {
    return this.setWithTags(`plugin:${pluginId}`, plugin, ['plugins', `author:${plugin.authorId}`]);
  }

  async getFeaturedPlugins() {
    return this.getOrSet('plugins:featured', async () => {
      // In a real implementation, fetch from database
      return [];
    }, 300000); // 5 minutes
  }

  async getPluginsByCategory(category: string) {
    return this.getOrSet(`plugins:category:${category}`, async () => {
      // In a real implementation, fetch from database
      return [];
    }, 600000); // 10 minutes
  }

  async invalidatePluginCache(pluginId: string) {
    await this.delete(`plugin:${pluginId}`);
    await this.invalidateByTag('plugins');
  }
}

export class UserCacheService extends CacheService {
  constructor() {
    super({ maxSize: 1000, ttl: 900000 }); // 15 minutes for users
  }

  async getUser(userId: string) {
    return this.get(`user:${userId}`);
  }

  async setUser(userId: string, user: any) {
    return this.set(`user:${userId}`, user);
  }

  async getUserPermissions(userId: string) {
    return this.getOrSet(`user:${userId}:permissions`, async () => {
      // In a real implementation, calculate permissions
      return [];
    }, 1800000); // 30 minutes
  }

  async invalidateUserCache(userId: string) {
    await this.delete(`user:${userId}`);
    await this.delete(`user:${userId}:permissions`);
  }
}

export class ApiResponseCacheService extends CacheService {
  constructor() {
    super({ maxSize: 2000, ttl: 180000 }); // 3 minutes for API responses
  }

  generateApiCacheKey(method: string, url: string, params?: any): string {
    const key = `api:${method}:${url}`;
    if (params) {
      const sortedParams = JSON.stringify(params, Object.keys(params).sort());
      return `${key}:${crypto.createHash('md5').update(sortedParams).digest('hex')}`;
    }
    return key;
  }

  async getCachedResponse(method: string, url: string, params?: any) {
    const key = this.generateApiCacheKey(method, url, params);
    return this.get(key);
  }

  async setCachedResponse(method: string, url: string, response: any, params?: any, ttl?: number) {
    const key = this.generateApiCacheKey(method, url, params);
    return this.set(key, response, ttl);
  }
}

// Export singleton instances
export const pluginCache = new PluginCacheService();
export const userCache = new UserCacheService();
export const apiCache = new ApiResponseCacheService();

// Main cache service instance
export const cacheService = new CacheService();

// Cache cleanup scheduler
setInterval(() => {
  cacheService.cleanup();
  pluginCache.cleanup();
  userCache.cleanup();
  apiCache.cleanup();
}, 60000); // Cleanup every minute