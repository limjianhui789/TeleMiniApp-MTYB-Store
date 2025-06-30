import type {
  Product,
  ProductFilters,
  PaginatedResponse,
  ApiResponse,
  SearchParams,
} from '../../types';
import { ProductCategory, ProductStatus } from '../../types';

export class ProductService {
  private products: Product[] = [];
  private categories: ProductCategory[] = Object.values(ProductCategory);

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    this.products = [
      {
        id: 'vpn-premium-1',
        name: 'Premium VPN Service',
        description:
          'High-speed VPN with global servers. Unlimited bandwidth and military-grade encryption.',
        shortDescription: 'Premium VPN with global servers',
        price: 9.99,
        originalPrice: 19.99,
        currency: 'USD',
        category: ProductCategory.VPN,
        pluginId: 'vpn-plugin',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: true,
        tags: ['vpn', 'privacy', 'security', 'premium'],
        images: [
          {
            id: 'img-1',
            url: '/images/vpn-premium.jpg',
            alt: 'Premium VPN Service',
            isPrimary: true,
            order: 1,
          },
        ],
        metadata: {
          servers: 50,
          countries: 30,
          simultaneousConnections: 5,
        },
        stock: {
          available: 100,
          reserved: 0,
          total: 100,
          lowStockThreshold: 10,
        },
        deliveryInfo: {
          type: 'instant',
          estimatedTime: '5 minutes',
          instructions: 'Account credentials will be delivered via Telegram',
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: 'netflix-premium-1',
        name: 'Netflix Premium Account',
        description: 'Netflix Premium subscription with 4K streaming and multiple profiles.',
        shortDescription: 'Netflix Premium with 4K streaming',
        price: 15.99,
        currency: 'USD',
        category: ProductCategory.STREAMING,
        pluginId: 'netflix-plugin',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: false,
        tags: ['netflix', 'streaming', 'premium', '4k'],
        images: [
          {
            id: 'img-2',
            url: '/images/netflix-premium.jpg',
            alt: 'Netflix Premium Account',
            isPrimary: true,
            order: 1,
          },
        ],
        metadata: {
          screens: 4,
          quality: '4K',
          duration: '1 month',
        },
        stock: {
          available: 25,
          reserved: 5,
          total: 30,
          lowStockThreshold: 5,
        },
        deliveryInfo: {
          type: 'manual',
          estimatedTime: '1-2 hours',
          instructions: 'Account details will be sent manually after verification',
        },
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
      },
      {
        id: 'game-key-1',
        name: 'Steam Game Key - Cyberpunk 2077',
        description: 'Digital game key for Cyberpunk 2077 on Steam platform.',
        shortDescription: 'Cyberpunk 2077 Steam Key',
        price: 29.99,
        originalPrice: 59.99,
        currency: 'USD',
        category: ProductCategory.GAMING,
        pluginId: 'steam-plugin',
        status: ProductStatus.ACTIVE,
        isActive: true,
        isFeatured: true,
        tags: ['steam', 'game', 'cyberpunk', 'rpg'],
        images: [
          {
            id: 'img-3',
            url: '/images/cyberpunk-2077.jpg',
            alt: 'Cyberpunk 2077 Game',
            isPrimary: true,
            order: 1,
          },
        ],
        metadata: {
          platform: 'Steam',
          genre: 'RPG',
          region: 'Global',
        },
        stock: {
          available: 50,
          reserved: 0,
          total: 50,
          lowStockThreshold: 10,
        },
        deliveryInfo: {
          type: 'instant',
          estimatedTime: 'Immediate',
          instructions: 'Game key will be provided instantly',
        },
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-25'),
      },
    ];
  }

  async getAllProducts(filters?: ProductFilters): Promise<Product[]> {
    let filteredProducts = [...this.products];

    if (filters) {
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        filteredProducts = filteredProducts.filter(p => p.price >= min && p.price <= max);
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredProducts = filteredProducts.filter(p =>
          filters.tags!.some(tag => p.tags.includes(tag))
        );
      }

      if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
          let comparison = 0;

          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'price':
              comparison = a.price - b.price;
              break;
            case 'created':
              comparison = a.createdAt.getTime() - b.createdAt.getTime();
              break;
            case 'popularity':
              comparison = (b.metadata.popularity || 0) - (a.metadata.popularity || 0);
              break;
          }

          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });
      }
    }

    return filteredProducts.filter(p => p.isActive && p.status === ProductStatus.ACTIVE);
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = this.products.find(p => p.id === id);
    return product || null;
  }

  async getProduct(id: string): Promise<ApiResponse<Product>> {
    try {
      const product = await this.getProductById(id);
      
      if (!product) {
        return {
          success: false,
          error: `Product not found: ${id}`,
          data: null,
        };
      }

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get product',
        data: null,
      };
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.products.filter(
      p => p.isFeatured && p.isActive && p.status === ProductStatus.ACTIVE
    );
  }

  async getProductsByCategory(category: ProductCategory): Promise<Product[]> {
    return this.products.filter(
      p => p.category === category && p.isActive && p.status === ProductStatus.ACTIVE
    );
  }

  async searchProducts(params: SearchParams): Promise<PaginatedResponse<Product>> {
    const filters: ProductFilters = {
      sortBy: params.sort?.field as any,
      sortOrder: params.sort?.direction,
      ...params.filters,
    };

    if (params.query) {
      filters.searchQuery = params.query;
    }

    const allProducts = await this.getAllProducts(filters);

    const page = params.pagination?.page || 1;
    const pageSize = params.pagination?.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const items = allProducts.slice(startIndex, endIndex);

    return {
      items,
      total: allProducts.length,
      page,
      pageSize,
      hasNext: endIndex < allProducts.length,
      hasPrevious: page > 1,
    };
  }

  async getCategories(): Promise<ProductCategory[]> {
    return this.categories;
  }

  async getAvailableTags(): Promise<string[]> {
    const allTags = this.products.flatMap(p => p.tags);
    return [...new Set(allTags)].sort();
  }

  async checkStock(productId: string): Promise<boolean> {
    const product = await this.getProductById(productId);
    return product?.stock ? product.stock.available > 0 : false;
  }

  async reserveStock(productId: string, quantity: number = 1): Promise<boolean> {
    const product = this.products.find(p => p.id === productId);

    if (!product?.stock || product.stock.available < quantity) {
      return false;
    }

    product.stock.available -= quantity;
    product.stock.reserved += quantity;
    product.updatedAt = new Date();

    return true;
  }

  async releaseStock(productId: string, quantity: number = 1): Promise<boolean> {
    const product = this.products.find(p => p.id === productId);

    if (!product?.stock || product.stock.reserved < quantity) {
      return false;
    }

    product.stock.available += quantity;
    product.stock.reserved -= quantity;
    product.updatedAt = new Date();

    return true;
  }

  async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Product>> {
    try {
      const newProduct: Product = {
        ...productData,
        id: `product-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.products.push(newProduct);

      return {
        success: true,
        data: newProduct,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRODUCT_CREATE_ERROR',
          message: 'Failed to create product',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const productIndex = this.products.findIndex(p => p.id === id);

      if (productIndex === -1) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        };
      }

      const updatedProduct = {
        ...this.products[productIndex],
        ...updates,
        id,
        updatedAt: new Date(),
      };
      this.products[productIndex] = updatedProduct;

      return {
        success: true,
        data: updatedProduct,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRODUCT_UPDATE_ERROR',
          message: 'Failed to update product',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async deleteProduct(id: string): Promise<ApiResponse<boolean>> {
    try {
      const productIndex = this.products.findIndex(p => p.id === id);

      if (productIndex === -1) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        };
      }

      this.products.splice(productIndex, 1);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRODUCT_DELETE_ERROR',
          message: 'Failed to delete product',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // 批量操作方法
  async bulkCreateProducts(
    productsData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<ApiResponse<Product[]>> {
    try {
      const newProducts: Product[] = productsData.map((productData, index) => ({
        ...productData,
        id: `product-${Date.now()}-${index}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      this.products.push(...newProducts);

      return {
        success: true,
        data: newProducts,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_CREATE_ERROR',
          message: 'Failed to create products in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async bulkUpdateProducts(
    updates: Array<{ id: string; data: Partial<Product> }>
  ): Promise<ApiResponse<Product[]>> {
    try {
      const updatedProducts: Product[] = [];
      const errors: Array<{ id: string; message: string }> = [];

      for (const update of updates) {
        const productIndex = this.products.findIndex(p => p.id === update.id);

        if (productIndex === -1) {
          errors.push({ id: update.id, message: 'Product not found' });
          continue;
        }

        const updatedProduct = {
          ...this.products[productIndex],
          ...update.data,
          id: update.id,
          updatedAt: new Date(),
        };

        this.products[productIndex] = updatedProduct;
        updatedProducts.push(updatedProduct);
      }

      if (errors.length > 0 && updatedProducts.length === 0) {
        return {
          success: false,
          error: {
            code: 'BULK_UPDATE_ERROR',
            message: 'Failed to update any products',
            details: { errors },
          },
        };
      }

      return {
        success: true,
        data: updatedProducts,
        warnings: errors.length > 0 ? { partialFailures: errors } : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_UPDATE_ERROR',
          message: 'Failed to update products in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async bulkDeleteProducts(
    ids: string[]
  ): Promise<ApiResponse<{ deletedCount: number; failedIds: string[] }>> {
    try {
      const failedIds: string[] = [];
      let deletedCount = 0;

      for (const id of ids) {
        const productIndex = this.products.findIndex(p => p.id === id);

        if (productIndex === -1) {
          failedIds.push(id);
          continue;
        }

        this.products.splice(productIndex, 1);
        deletedCount++;
      }

      return {
        success: true,
        data: { deletedCount, failedIds },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_DELETE_ERROR',
          message: 'Failed to delete products in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<ApiResponse<Product[]>> {
    const updates = ids.map(id => ({ id, data: { status, updatedAt: new Date() } }));
    return this.bulkUpdateProducts(updates);
  }

  async bulkUpdatePrices(
    priceUpdates: Array<{ id: string; price: number; originalPrice?: number }>
  ): Promise<ApiResponse<Product[]>> {
    const updates = priceUpdates.map(update => ({
      id: update.id,
      data: {
        price: update.price,
        originalPrice: update.originalPrice,
        updatedAt: new Date(),
      },
    }));
    return this.bulkUpdateProducts(updates);
  }

  // 高级查询方法
  async getProductsWithAdvancedFilters(filters: {
    category?: ProductCategory;
    status?: ProductStatus;
    priceRange?: [number, number];
    tags?: string[];
    searchQuery?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    hasStock?: boolean;
    lowStock?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    sortBy?: 'name' | 'price' | 'created' | 'updated' | 'popularity' | 'stock';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ products: Product[]; total: number }>> {
    try {
      let filteredProducts = [...this.products];

      // Apply filters
      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }

      if (filters.status) {
        filteredProducts = filteredProducts.filter(p => p.status === filters.status);
      }

      if (filters.isActive !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.isActive === filters.isActive);
      }

      if (filters.isFeatured !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.isFeatured === filters.isFeatured);
      }

      if (filters.hasStock !== undefined) {
        if (filters.hasStock) {
          filteredProducts = filteredProducts.filter(p => p.stock && p.stock.available > 0);
        } else {
          filteredProducts = filteredProducts.filter(p => !p.stock || p.stock.available <= 0);
        }
      }

      if (filters.lowStock) {
        filteredProducts = filteredProducts.filter(
          p => p.stock && p.stock.available <= p.stock.lowStockThreshold
        );
      }

      if (filters.priceRange) {
        const [min, max] = filters.priceRange;
        filteredProducts = filteredProducts.filter(p => p.price >= min && p.price <= max);
      }

      if (filters.tags && filters.tags.length > 0) {
        filteredProducts = filteredProducts.filter(p =>
          filters.tags!.some(tag => p.tags.includes(tag))
        );
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            p.description.toLowerCase().includes(query) ||
            p.shortDescription?.toLowerCase().includes(query) ||
            p.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      if (filters.createdAfter) {
        filteredProducts = filteredProducts.filter(p => p.createdAt >= filters.createdAfter!);
      }

      if (filters.createdBefore) {
        filteredProducts = filteredProducts.filter(p => p.createdAt <= filters.createdBefore!);
      }

      // Sort products
      if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
          let comparison = 0;

          switch (filters.sortBy) {
            case 'name':
              comparison = a.name.localeCompare(b.name);
              break;
            case 'price':
              comparison = a.price - b.price;
              break;
            case 'created':
              comparison = a.createdAt.getTime() - b.createdAt.getTime();
              break;
            case 'updated':
              comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
              break;
            case 'popularity':
              comparison = (b.metadata.popularity || 0) - (a.metadata.popularity || 0);
              break;
            case 'stock':
              const aStock = a.stock?.available || 0;
              const bStock = b.stock?.available || 0;
              comparison = aStock - bStock;
              break;
          }

          return filters.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      const total = filteredProducts.length;

      // Apply pagination
      if (filters.offset || filters.limit) {
        const offset = filters.offset || 0;
        const limit = filters.limit || total;
        filteredProducts = filteredProducts.slice(offset, offset + limit);
      }

      return {
        success: true,
        data: {
          products: filteredProducts,
          total,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADVANCED_QUERY_ERROR',
          message: 'Failed to execute advanced query',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async getProductStats(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      featured: number;
      outOfStock: number;
      lowStock: number;
      byCategory: Record<ProductCategory, number>;
      totalValue: number;
    }>
  > {
    try {
      const stats = {
        total: this.products.length,
        active: this.products.filter(p => p.isActive && p.status === ProductStatus.ACTIVE).length,
        inactive: this.products.filter(p => !p.isActive || p.status !== ProductStatus.ACTIVE)
          .length,
        featured: this.products.filter(p => p.isFeatured).length,
        outOfStock: this.products.filter(p => p.stock && p.stock.available <= 0).length,
        lowStock: this.products.filter(
          p => p.stock && p.stock.available <= p.stock.lowStockThreshold
        ).length,
        byCategory: {} as Record<ProductCategory, number>,
        totalValue: this.products.reduce((sum, p) => sum + p.price * (p.stock?.total || 1), 0),
      };

      // Initialize category counts
      Object.values(ProductCategory).forEach(category => {
        stats.byCategory[category] = this.products.filter(p => p.category === category).length;
      });

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Failed to calculate product statistics',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // 库存相关的高级方法
  async getLowStockProducts(): Promise<Product[]> {
    return this.products.filter(p => p.stock && p.stock.available <= p.stock.lowStockThreshold);
  }

  async getOutOfStockProducts(): Promise<Product[]> {
    return this.products.filter(p => p.stock && p.stock.available <= 0);
  }

  async bulkUpdateStock(
    stockUpdates: Array<{
      id: string;
      available?: number;
      total?: number;
      lowStockThreshold?: number;
    }>
  ): Promise<ApiResponse<Product[]>> {
    try {
      const updatedProducts: Product[] = [];
      const errors: Array<{ id: string; message: string }> = [];

      for (const update of stockUpdates) {
        const productIndex = this.products.findIndex(p => p.id === update.id);

        if (productIndex === -1) {
          errors.push({ id: update.id, message: 'Product not found' });
          continue;
        }

        const product = this.products[productIndex];
        if (!product.stock) {
          errors.push({ id: update.id, message: 'Product has no stock configuration' });
          continue;
        }

        const updatedStock = {
          ...product.stock,
          ...update,
          id: undefined, // Remove id from stock update
        };
        delete (updatedStock as any).id;

        const updatedProduct = {
          ...product,
          stock: updatedStock,
          updatedAt: new Date(),
        };

        this.products[productIndex] = updatedProduct;
        updatedProducts.push(updatedProduct);
      }

      if (errors.length > 0 && updatedProducts.length === 0) {
        return {
          success: false,
          error: {
            code: 'BULK_STOCK_UPDATE_ERROR',
            message: 'Failed to update any product stock',
            details: { errors },
          },
        };
      }

      return {
        success: true,
        data: updatedProducts,
        warnings: errors.length > 0 ? { partialFailures: errors } : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_STOCK_UPDATE_ERROR',
          message: 'Failed to update product stock in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }
}

export const productService = new ProductService();
