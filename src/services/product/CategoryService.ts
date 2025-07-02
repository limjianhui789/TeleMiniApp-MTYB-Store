import type { ApiResponse } from '../../types';
import { ProductCategory } from '../../types';
import { pluginManager } from '../../core/plugin/PluginManager';
import { Logger } from '../../core/utils/Logger';

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  productCount?: number;
  supportedPlugins?: string[]; // 支持该分类的插件ID列表
  metadata?: Record<string, any>; // 分类元数据
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CategoryStats {
  totalCategories: number;
  activeCategories: number;
  inactiveCategories: number;
  categoriesWithProducts: number;
  averageProductsPerCategory: number;
  mostPopularCategory: { category: ProductCategory; productCount: number } | null;
}

export interface CategoryHierarchy {
  category: CategoryInfo;
  subcategories: CategoryInfo[];
  parentCategory?: CategoryInfo;
}

export class CategoryService {
  private logger: Logger;
  private categories: CategoryInfo[] = [
    {
      id: ProductCategory.VPN,
      name: 'VPN Services',
      description: 'Virtual Private Network services for privacy and security',
      icon: '🔒',
      color: '#4CAF50',
      isActive: true,
      sortOrder: 1,
      supportedPlugins: ['vpn-plugin', 'demo-plugin'],
      metadata: { requiresCredentials: true, instantDelivery: true },
    },
    {
      id: ProductCategory.STREAMING,
      name: 'Streaming Services',
      description: 'Premium streaming platform accounts',
      icon: '📺',
      color: '#FF5722',
      isActive: true,
      sortOrder: 2,
      supportedPlugins: ['netflix-plugin', 'demo-plugin'],
      metadata: { requiresCredentials: true, instantDelivery: true },
    },
    {
      id: ProductCategory.GAMING,
      name: 'Gaming',
      description: 'Game keys, accounts, and gaming services',
      icon: '🎮',
      color: '#9C27B0',
      isActive: true,
      sortOrder: 3,
      supportedPlugins: ['steam-plugin', 'keyauth-plugin', 'demo-plugin'],
      metadata: { requiresCredentials: true, instantDelivery: false },
    },
    {
      id: ProductCategory.SOFTWARE,
      name: 'Software',
      description: 'Software licenses and applications',
      icon: '💻',
      color: '#2196F3',
      isActive: true,
      sortOrder: 4,
      supportedPlugins: ['license-plugin', 'demo-plugin'],
      metadata: { requiresCredentials: false, instantDelivery: true },
    },
    {
      id: ProductCategory.DIGITAL_GOODS,
      name: 'Digital Goods',
      description: 'Various digital products and services',
      icon: '📱',
      color: '#FF9800',
      isActive: true,
      sortOrder: 5,
      supportedPlugins: ['demo-plugin'],
      metadata: { requiresCredentials: false, instantDelivery: true },
    },
    {
      id: ProductCategory.OTHER,
      name: 'Other',
      description: 'Miscellaneous products and services',
      icon: '📦',
      color: '#607D8B',
      isActive: true,
      sortOrder: 6,
      supportedPlugins: ['demo-plugin'],
      metadata: { requiresCredentials: false, instantDelivery: false },
    },
  ];

  constructor() {
    this.logger = new Logger('CategoryService');
  }

  // ============================================================================
  // Plugin Integration Methods
  // ============================================================================

  /**
   * 获取支持特定分类的插件列表
   */
  async getSupportedPlugins(categoryId: ProductCategory): Promise<string[]> {
    const category = await this.getCategoryById(categoryId);
    return category?.supportedPlugins || [];
  }

  /**
   * 获取插件支持的分类列表
   */
  async getCategoriesByPlugin(pluginId: string): Promise<CategoryInfo[]> {
    return this.categories.filter(category => category.supportedPlugins?.includes(pluginId));
  }

  /**
   * 验证插件是否支持指定分类
   */
  async validatePluginCategory(pluginId: string, categoryId: ProductCategory): Promise<boolean> {
    const supportedPlugins = await this.getSupportedPlugins(categoryId);
    return supportedPlugins.includes(pluginId);
  }

  /**
   * 从插件管理器同步可用插件并更新分类
   */
  async syncWithPluginManager(): Promise<ApiResponse<{ updated: number; errors: string[] }>> {
    try {
      const availablePlugins = pluginManager.getAllPlugins().map(plugin => plugin.config.id);
      let updated = 0;
      const errors: string[] = [];

      for (const category of this.categories) {
        if (category.supportedPlugins) {
          const validPlugins = category.supportedPlugins.filter(pluginId =>
            availablePlugins.includes(pluginId)
          );

          if (validPlugins.length !== category.supportedPlugins.length) {
            const removedPlugins = category.supportedPlugins.filter(
              pluginId => !availablePlugins.includes(pluginId)
            );

            category.supportedPlugins = validPlugins;
            category.updatedAt = new Date();
            updated++;

            this.logger.warn(
              `Removed unavailable plugins from category ${category.name}:`,
              removedPlugins
            );
          }
        }
      }

      return {
        success: true,
        data: { updated, errors },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLUGIN_SYNC_ERROR',
          message: 'Failed to sync with plugin manager',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * 为分类添加插件支持
   */
  async addPluginToCategory(
    categoryId: ProductCategory,
    pluginId: string
  ): Promise<ApiResponse<CategoryInfo>> {
    try {
      const category = this.categories.find(cat => cat.id === categoryId);
      if (!category) {
        return {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        };
      }

      // 验证插件是否存在
      const plugin = pluginManager.getPlugin(pluginId);
      if (!plugin) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: 'Plugin not found',
          },
        };
      }

      if (!category.supportedPlugins) {
        category.supportedPlugins = [];
      }

      if (!category.supportedPlugins.includes(pluginId)) {
        category.supportedPlugins.push(pluginId);
        category.updatedAt = new Date();
      }

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_PLUGIN_ERROR',
          message: 'Failed to add plugin to category',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * 从分类移除插件支持
   */
  async removePluginFromCategory(
    categoryId: ProductCategory,
    pluginId: string
  ): Promise<ApiResponse<CategoryInfo>> {
    try {
      const category = this.categories.find(cat => cat.id === categoryId);
      if (!category) {
        return {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        };
      }

      if (category.supportedPlugins) {
        category.supportedPlugins = category.supportedPlugins.filter(id => id !== pluginId);
        category.updatedAt = new Date();
      }

      return {
        success: true,
        data: category,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REMOVE_PLUGIN_ERROR',
          message: 'Failed to remove plugin from category',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // ============================================================================
  // Existing Methods
  // ============================================================================

  async getAllCategories(): Promise<CategoryInfo[]> {
    return this.categories.filter(cat => cat.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getCategoryById(id: ProductCategory): Promise<CategoryInfo | null> {
    return this.categories.find(cat => cat.id === id) || null;
  }

  async getCategoryName(id: ProductCategory): Promise<string> {
    const category = await this.getCategoryById(id);
    return category?.name || id.toString();
  }

  async getCategoryIcon(id: ProductCategory): Promise<string> {
    const category = await this.getCategoryById(id);
    return category?.icon || '📦';
  }

  async getCategoryColor(id: ProductCategory): Promise<string> {
    const category = await this.getCategoryById(id);
    return category?.color || '#607D8B';
  }

  async getActiveCategories(): Promise<CategoryInfo[]> {
    return this.categories.filter(cat => cat.isActive);
  }

  async updateCategory(id: ProductCategory, updates: Partial<CategoryInfo>): Promise<boolean> {
    const categoryIndex = this.categories.findIndex(cat => cat.id === id);

    if (categoryIndex === -1) {
      return false;
    }

    const updatedCategory: CategoryInfo = {
      ...this.categories[categoryIndex],
      ...updates,
      id, // Ensure ID doesn't change
    };
    this.categories[categoryIndex] = updatedCategory;

    return true;
  }

  async toggleCategoryStatus(id: ProductCategory): Promise<boolean> {
    const category = this.categories.find(cat => cat.id === id);

    if (!category) {
      return false;
    }

    category.isActive = !category.isActive;
    return true;
  }

  async reorderCategories(newOrder: ProductCategory[]): Promise<boolean> {
    try {
      newOrder.forEach((categoryId, index) => {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
          category.sortOrder = index + 1;
        }
      });

      return true;
    } catch {
      return false;
    }
  }

  getCategoryBadgeProps(category: ProductCategory): { text: string; color: string; icon: string } {
    const categoryInfo = this.categories.find(cat => cat.id === category);

    return {
      text: categoryInfo?.name || category.toString(),
      color: categoryInfo?.color || '#607D8B',
      icon: categoryInfo?.icon || '📦',
    };
  }

  // 高级分类管理方法
  async createCategory(
    categoryData: Omit<CategoryInfo, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<CategoryInfo>> {
    try {
      // Generate a unique ID based on name
      const id = categoryData.name.toUpperCase().replace(/\s+/g, '_') as ProductCategory;

      // Check if category with this ID already exists
      if (this.categories.find(cat => cat.id === id)) {
        return {
          success: false,
          error: {
            code: 'CATEGORY_EXISTS',
            message: 'Category with this name already exists',
          },
        };
      }

      const newCategory: CategoryInfo = {
        ...categoryData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.categories.push(newCategory);

      return {
        success: true,
        data: newCategory,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CATEGORY_CREATE_ERROR',
          message: 'Failed to create category',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async updateCategoryAdvanced(
    id: ProductCategory,
    updates: Partial<CategoryInfo>
  ): Promise<ApiResponse<CategoryInfo>> {
    try {
      const categoryIndex = this.categories.findIndex(cat => cat.id === id);

      if (categoryIndex === -1) {
        return {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        };
      }

      const updatedCategory: CategoryInfo = {
        ...this.categories[categoryIndex],
        ...updates,
        id, // Preserve original ID
        updatedAt: new Date(),
      };

      this.categories[categoryIndex] = updatedCategory;

      return {
        success: true,
        data: updatedCategory,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CATEGORY_UPDATE_ERROR',
          message: 'Failed to update category',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async deleteCategory(id: ProductCategory): Promise<ApiResponse<boolean>> {
    try {
      const categoryIndex = this.categories.findIndex(cat => cat.id === id);

      if (categoryIndex === -1) {
        return {
          success: false,
          error: {
            code: 'CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        };
      }

      // Check if category has associated products (this would need to be implemented with product service integration)
      // For now, we'll assume it's safe to delete

      this.categories.splice(categoryIndex, 1);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CATEGORY_DELETE_ERROR',
          message: 'Failed to delete category',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async bulkUpdateCategories(
    updates: Array<{ id: ProductCategory; data: Partial<CategoryInfo> }>
  ): Promise<ApiResponse<CategoryInfo[]>> {
    try {
      const updatedCategories: CategoryInfo[] = [];
      const errors: Array<{ id: ProductCategory; message: string }> = [];

      for (const update of updates) {
        const result = await this.updateCategoryAdvanced(update.id, update.data);

        if (result.success) {
          updatedCategories.push(result.data!);
        } else {
          errors.push({ id: update.id, message: result.error?.message || 'Update failed' });
        }
      }

      if (errors.length > 0 && updatedCategories.length === 0) {
        return {
          success: false,
          error: {
            code: 'BULK_UPDATE_ERROR',
            message: 'Failed to update any categories',
            details: { errors },
          },
        };
      }

      return {
        success: true,
        data: updatedCategories,
        warnings: errors.length > 0 ? { partialFailures: errors } : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_UPDATE_ERROR',
          message: 'Failed to update categories in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async getCategoryStats(
    productCounts?: Record<ProductCategory, number>
  ): Promise<ApiResponse<CategoryStats>> {
    try {
      const totalCategories = this.categories.length;
      const activeCategories = this.categories.filter(cat => cat.isActive).length;
      const inactiveCategories = totalCategories - activeCategories;

      let categoriesWithProducts = 0;
      let totalProducts = 0;
      let mostPopularCategory: { category: ProductCategory; productCount: number } | null = null;
      let maxProductCount = 0;

      if (productCounts) {
        for (const [category, count] of Object.entries(productCounts)) {
          if (count > 0) {
            categoriesWithProducts++;
            totalProducts += count;

            if (count > maxProductCount) {
              maxProductCount = count;
              mostPopularCategory = { category: category as ProductCategory, productCount: count };
            }
          }
        }
      }

      const averageProductsPerCategory =
        categoriesWithProducts > 0 ? totalProducts / categoriesWithProducts : 0;

      const stats: CategoryStats = {
        totalCategories,
        activeCategories,
        inactiveCategories,
        categoriesWithProducts,
        averageProductsPerCategory,
        mostPopularCategory,
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
          message: 'Failed to calculate category statistics',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async searchCategories(query: string): Promise<CategoryInfo[]> {
    const searchTerm = query.toLowerCase();
    return this.categories.filter(
      cat =>
        cat.name.toLowerCase().includes(searchTerm) ||
        cat.description.toLowerCase().includes(searchTerm)
    );
  }

  async getCategoriesWithFilters(filters: {
    isActive?: boolean;
    hasProducts?: boolean; // Requires integration with product service
    sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'productCount';
    sortOrder?: 'asc' | 'desc';
  }): Promise<CategoryInfo[]> {
    let filteredCategories = [...this.categories];

    if (filters.isActive !== undefined) {
      filteredCategories = filteredCategories.filter(cat => cat.isActive === filters.isActive);
    }

    // Sort categories
    if (filters.sortBy) {
      filteredCategories.sort((a, b) => {
        let comparison = 0;

        switch (filters.sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'sortOrder':
            comparison = a.sortOrder - b.sortOrder;
            break;
          case 'createdAt':
            const aDate = a.createdAt?.getTime() || 0;
            const bDate = b.createdAt?.getTime() || 0;
            comparison = aDate - bDate;
            break;
          case 'productCount':
            const aCount = a.productCount || 0;
            const bCount = b.productCount || 0;
            comparison = aCount - bCount;
            break;
        }

        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return filteredCategories;
  }

  async exportCategories(): Promise<ApiResponse<string>> {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        categories: this.categories,
        metadata: {
          totalCategories: this.categories.length,
          activeCategories: this.categories.filter(cat => cat.isActive).length,
        },
      };

      return {
        success: true,
        data: JSON.stringify(exportData, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export categories',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async importCategories(
    jsonData: string
  ): Promise<ApiResponse<{ imported: number; skipped: number; errors: string[] }>> {
    try {
      const importData = JSON.parse(jsonData);

      if (!importData.categories || !Array.isArray(importData.categories)) {
        return {
          success: false,
          error: {
            code: 'INVALID_IMPORT_DATA',
            message: 'Invalid import data format',
          },
        };
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const categoryData of importData.categories) {
        try {
          // Check if category already exists
          if (this.categories.find(cat => cat.id === categoryData.id)) {
            skipped++;
            continue;
          }

          // Validate required fields
          if (!categoryData.name || !categoryData.id) {
            errors.push(
              `Invalid category data: missing required fields for ${categoryData.name || 'unknown'}`
            );
            continue;
          }

          const newCategory: CategoryInfo = {
            ...categoryData,
            createdAt: new Date(categoryData.createdAt) || new Date(),
            updatedAt: new Date(),
          };

          this.categories.push(newCategory);
          imported++;
        } catch (error) {
          errors.push(
            `Failed to import category ${categoryData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      return {
        success: true,
        data: { imported, skipped, errors },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'IMPORT_ERROR',
          message: 'Failed to import categories',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }
}

export const categoryService = new CategoryService();
