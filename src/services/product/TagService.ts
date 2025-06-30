// ============================================================================
// MTYB Virtual Goods Platform - Product Tag Management Service
// ============================================================================

import { ApiResponse } from '../../types';
import { Logger } from '../../core/utils/Logger';

// ============================================================================
// Tag Interface Definitions
// ============================================================================

export interface ProductTag {
  id: string;
  name: string;
  description?: string;
  color?: string;
  category?: string; // 标签分类
  isSystem?: boolean; // 是否为系统标签
  usageCount?: number; // 使用次数
  createdAt: Date;
  updatedAt: Date;
}

export interface TagCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface TagStats {
  totalTags: number;
  systemTags: number;
  userTags: number;
  mostUsedTags: { tag: ProductTag; count: number }[];
  tagsByCategory: Record<string, number>;
  unusedTags: ProductTag[];
}

export interface TagFilters {
  category?: string;
  isSystem?: boolean;
  minUsageCount?: number;
  maxUsageCount?: number;
  searchQuery?: string;
  sortBy?: 'name' | 'usageCount' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// Tag Service Implementation
// ============================================================================

export class TagService {
  private logger: Logger;
  private tags: ProductTag[] = [];
  private tagCategories: TagCategory[] = [];

  constructor() {
    this.logger = new Logger('TagService');
    this.initializeDefaultTags();
    this.initializeTagCategories();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeTagCategories(): void {
    this.tagCategories = [
      {
        id: 'features',
        name: 'Features',
        description: 'Product features and capabilities',
        color: '#4CAF50',
        icon: '⭐',
        sortOrder: 1,
        isActive: true,
      },
      {
        id: 'quality',
        name: 'Quality',
        description: 'Quality and performance indicators',
        color: '#2196F3',
        icon: '🏆',
        sortOrder: 2,
        isActive: true,
      },
      {
        id: 'delivery',
        name: 'Delivery',
        description: 'Delivery method and timing',
        color: '#FF9800',
        icon: '🚀',
        sortOrder: 3,
        isActive: true,
      },
      {
        id: 'technical',
        name: 'Technical',
        description: 'Technical specifications and requirements',
        color: '#9C27B0',
        icon: '⚙️',
        sortOrder: 4,
        isActive: true,
      },
      {
        id: 'promotion',
        name: 'Promotion',
        description: 'Promotional and marketing tags',
        color: '#E91E63',
        icon: '🎯',
        sortOrder: 5,
        isActive: true,
      },
    ];
  }

  private initializeDefaultTags(): void {
    const defaultTags: Omit<ProductTag, 'createdAt' | 'updatedAt'>[] = [
      // Feature tags
      {
        id: 'premium',
        name: 'Premium',
        description: 'Premium quality product',
        color: '#FFD700',
        category: 'features',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'unlimited',
        name: 'Unlimited',
        description: 'Unlimited usage or bandwidth',
        color: '#4CAF50',
        category: 'features',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'secure',
        name: 'Secure',
        description: 'High security standards',
        color: '#FF5722',
        category: 'features',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'fast',
        name: 'Fast',
        description: 'High performance and speed',
        color: '#2196F3',
        category: 'features',
        isSystem: true,
        usageCount: 0,
      },

      // Quality tags
      {
        id: 'high-quality',
        name: 'High Quality',
        description: 'Superior quality product',
        color: '#9C27B0',
        category: 'quality',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'tested',
        name: 'Tested',
        description: 'Thoroughly tested product',
        color: '#4CAF50',
        category: 'quality',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'verified',
        name: 'Verified',
        description: 'Verified authenticity',
        color: '#2196F3',
        category: 'quality',
        isSystem: true,
        usageCount: 0,
      },

      // Delivery tags
      {
        id: 'instant',
        name: 'Instant',
        description: 'Instant delivery',
        color: '#FF9800',
        category: 'delivery',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'automated',
        name: 'Automated',
        description: 'Automated delivery process',
        color: '#607D8B',
        category: 'delivery',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'manual',
        name: 'Manual',
        description: 'Manual delivery process',
        color: '#795548',
        category: 'delivery',
        isSystem: true,
        usageCount: 0,
      },

      // Technical tags
      {
        id: 'windows',
        name: 'Windows',
        description: 'Windows compatible',
        color: '#0078D4',
        category: 'technical',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'mac',
        name: 'Mac',
        description: 'Mac compatible',
        color: '#000000',
        category: 'technical',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'linux',
        name: 'Linux',
        description: 'Linux compatible',
        color: '#FCC624',
        category: 'technical',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'mobile',
        name: 'Mobile',
        description: 'Mobile device compatible',
        color: '#34A853',
        category: 'technical',
        isSystem: true,
        usageCount: 0,
      },

      // Promotion tags
      {
        id: 'bestseller',
        name: 'Bestseller',
        description: 'Top selling product',
        color: '#FF6B6B',
        category: 'promotion',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'new',
        name: 'New',
        description: 'New product',
        color: '#4ECDC4',
        category: 'promotion',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'sale',
        name: 'Sale',
        description: 'On sale',
        color: '#E74C3C',
        category: 'promotion',
        isSystem: true,
        usageCount: 0,
      },
      {
        id: 'limited',
        name: 'Limited',
        description: 'Limited availability',
        color: '#F39C12',
        category: 'promotion',
        isSystem: true,
        usageCount: 0,
      },
    ];

    this.tags = defaultTags.map(tag => ({
      ...tag,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  // ============================================================================
  // Tag Management
  // ============================================================================

  async getAllTags(): Promise<ProductTag[]> {
    return [...this.tags];
  }

  async getTagById(id: string): Promise<ProductTag | null> {
    return this.tags.find(tag => tag.id === id) || null;
  }

  async getTagsByIds(ids: string[]): Promise<ProductTag[]> {
    return this.tags.filter(tag => ids.includes(tag.id));
  }

  async searchTags(query: string): Promise<ProductTag[]> {
    const searchTerm = query.toLowerCase();
    return this.tags.filter(
      tag =>
        tag.name.toLowerCase().includes(searchTerm) ||
        tag.description?.toLowerCase().includes(searchTerm)
    );
  }

  async getTagsWithFilters(filters: TagFilters): Promise<ProductTag[]> {
    let filteredTags = [...this.tags];

    // Apply filters
    if (filters.category !== undefined) {
      filteredTags = filteredTags.filter(tag => tag.category === filters.category);
    }

    if (filters.isSystem !== undefined) {
      filteredTags = filteredTags.filter(tag => tag.isSystem === filters.isSystem);
    }

    if (filters.minUsageCount !== undefined) {
      filteredTags = filteredTags.filter(tag => (tag.usageCount || 0) >= filters.minUsageCount!);
    }

    if (filters.maxUsageCount !== undefined) {
      filteredTags = filteredTags.filter(tag => (tag.usageCount || 0) <= filters.maxUsageCount!);
    }

    if (filters.searchQuery) {
      const searchTerm = filters.searchQuery.toLowerCase();
      filteredTags = filteredTags.filter(
        tag =>
          tag.name.toLowerCase().includes(searchTerm) ||
          tag.description?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort tags
    if (filters.sortBy) {
      filteredTags.sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'usageCount':
            comparison = (a.usageCount || 0) - (b.usageCount || 0);
            break;
          case 'createdAt':
            comparison = a.createdAt.getTime() - b.createdAt.getTime();
            break;
          case 'updatedAt':
            comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
            break;
        }

        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filteredTags;
  }

  async createTag(
    tagData: Omit<ProductTag, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<ProductTag>> {
    try {
      // Generate unique ID
      const id = tagData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if tag already exists
      if (this.tags.find(tag => tag.id === id)) {
        return {
          success: false,
          error: {
            code: 'TAG_EXISTS',
            message: 'Tag with this name already exists',
          },
        };
      }

      const newTag: ProductTag = {
        ...tagData,
        id,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.tags.push(newTag);

      this.logger.info(`Created new tag: ${newTag.name} (${newTag.id})`);

      return {
        success: true,
        data: newTag,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TAG_CREATE_ERROR',
          message: 'Failed to create tag',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async updateTag(
    id: string,
    updates: Partial<Omit<ProductTag, 'id' | 'createdAt'>>
  ): Promise<ApiResponse<ProductTag>> {
    try {
      const tagIndex = this.tags.findIndex(tag => tag.id === id);

      if (tagIndex === -1) {
        return {
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: 'Tag not found',
          },
        };
      }

      const updatedTag: ProductTag = {
        ...this.tags[tagIndex],
        ...updates,
        id, // Preserve original ID
        updatedAt: new Date(),
      };

      this.tags[tagIndex] = updatedTag;

      this.logger.info(`Updated tag: ${updatedTag.name} (${updatedTag.id})`);

      return {
        success: true,
        data: updatedTag,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TAG_UPDATE_ERROR',
          message: 'Failed to update tag',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async deleteTag(id: string): Promise<ApiResponse<boolean>> {
    try {
      const tagIndex = this.tags.findIndex(tag => tag.id === id);

      if (tagIndex === -1) {
        return {
          success: false,
          error: {
            code: 'TAG_NOT_FOUND',
            message: 'Tag not found',
          },
        };
      }

      const tag = this.tags[tagIndex];

      // Prevent deletion of system tags
      if (tag.isSystem) {
        return {
          success: false,
          error: {
            code: 'SYSTEM_TAG_DELETE',
            message: 'Cannot delete system tags',
          },
        };
      }

      this.tags.splice(tagIndex, 1);

      this.logger.info(`Deleted tag: ${tag.name} (${tag.id})`);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TAG_DELETE_ERROR',
          message: 'Failed to delete tag',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // ============================================================================
  // Tag Usage Management
  // ============================================================================

  async incrementTagUsage(tagId: string): Promise<void> {
    const tag = this.tags.find(t => t.id === tagId);
    if (tag) {
      tag.usageCount = (tag.usageCount || 0) + 1;
      tag.updatedAt = new Date();
    }
  }

  async decrementTagUsage(tagId: string): Promise<void> {
    const tag = this.tags.find(t => t.id === tagId);
    if (tag && tag.usageCount && tag.usageCount > 0) {
      tag.usageCount--;
      tag.updatedAt = new Date();
    }
  }

  async updateTagUsage(tagIds: string[], productCount: number): Promise<void> {
    for (const tagId of tagIds) {
      const tag = this.tags.find(t => t.id === tagId);
      if (tag) {
        tag.usageCount = productCount;
        tag.updatedAt = new Date();
      }
    }
  }

  // ============================================================================
  // Tag Categories
  // ============================================================================

  async getTagCategories(): Promise<TagCategory[]> {
    return this.tagCategories.filter(cat => cat.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getTagsByCategory(categoryId: string): Promise<ProductTag[]> {
    return this.tags.filter(tag => tag.category === categoryId);
  }

  // ============================================================================
  // Tag Statistics
  // ============================================================================

  async getTagStats(): Promise<ApiResponse<TagStats>> {
    try {
      const totalTags = this.tags.length;
      const systemTags = this.tags.filter(tag => tag.isSystem).length;
      const userTags = totalTags - systemTags;

      // Most used tags
      const mostUsedTags = this.tags
        .filter(tag => tag.usageCount && tag.usageCount > 0)
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 10)
        .map(tag => ({ tag, count: tag.usageCount || 0 }));

      // Tags by category
      const tagsByCategory: Record<string, number> = {};
      for (const category of this.tagCategories) {
        tagsByCategory[category.id] = this.tags.filter(tag => tag.category === category.id).length;
      }

      // Unused tags
      const unusedTags = this.tags.filter(tag => !tag.usageCount || tag.usageCount === 0);

      const stats: TagStats = {
        totalTags,
        systemTags,
        userTags,
        mostUsedTags,
        tagsByCategory,
        unusedTags,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to calculate tag statistics',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // ============================================================================
  // Tag Validation and Suggestions
  // ============================================================================

  async validateTags(tagIds: string[]): Promise<{ valid: ProductTag[]; invalid: string[] }> {
    const valid: ProductTag[] = [];
    const invalid: string[] = [];

    for (const tagId of tagIds) {
      const tag = this.tags.find(t => t.id === tagId);
      if (tag) {
        valid.push(tag);
      } else {
        invalid.push(tagId);
      }
    }

    return { valid, invalid };
  }

  async suggestTags(
    productName: string,
    description: string,
    category?: string
  ): Promise<ProductTag[]> {
    const text = `${productName} ${description}`.toLowerCase();
    const suggestions: ProductTag[] = [];

    // Find relevant tags based on content
    for (const tag of this.tags) {
      const tagName = tag.name.toLowerCase();
      const tagDesc = tag.description?.toLowerCase() || '';

      if (
        text.includes(tagName) ||
        (tagDesc && text.includes(tagDesc)) ||
        (category && tag.category === category)
      ) {
        suggestions.push(tag);
      }
    }

    // Sort by usage count and relevance
    return suggestions.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 8); // Return top 8 suggestions
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async bulkCreateTags(
    tagsData: Array<Omit<ProductTag, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<{ created: ProductTag[]; errors: string[] }>> {
    try {
      const created: ProductTag[] = [];
      const errors: string[] = [];

      for (const tagData of tagsData) {
        const result = await this.createTag(tagData);
        if (result.success) {
          created.push(result.data!);
        } else {
          errors.push(`Failed to create tag '${tagData.name}': ${result.error?.message}`);
        }
      }

      return {
        success: true,
        data: { created, errors },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_CREATE_ERROR',
          message: 'Failed to create tags in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async cleanupUnusedTags(): Promise<ApiResponse<{ deleted: number; preserved: string[] }>> {
    try {
      const unusedTags = this.tags.filter(
        tag => !tag.isSystem && (!tag.usageCount || tag.usageCount === 0)
      );

      const preserved: string[] = [];
      let deleted = 0;

      for (const tag of unusedTags) {
        // Keep recently created tags (less than 30 days old)
        const daysSinceCreated = (Date.now() - tag.createdAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceCreated < 30) {
          preserved.push(tag.name);
          continue;
        }

        const deleteResult = await this.deleteTag(tag.id);
        if (deleteResult.success) {
          deleted++;
        }
      }

      this.logger.info(
        `Cleanup completed: deleted ${deleted} unused tags, preserved ${preserved.length} recent tags`
      );

      return {
        success: true,
        data: { deleted, preserved },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Failed to cleanup unused tags',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }
}

// ============================================================================
// Global Tag Service Instance
// ============================================================================

export const tagService = new TagService();
