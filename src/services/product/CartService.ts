import type { CartItem, CartState, ApiResponse, Product } from '../../types';
import { productService } from './ProductService';
import { priceService, type PriceCalculationResult } from './PriceService';
import { inventoryService } from './InventoryService';
import { EventEmitter } from '../../core/utils/EventEmitter';
import { Logger } from '../../core/utils/Logger';

export interface CartDiscount {
  id: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  value: number;
  code?: string;
  description: string;
  conditions?: {
    minAmount?: number;
    maxUses?: number;
    validUntil?: Date;
    applicableProducts?: string[];
    applicableCategories?: string[];
  };
  applied: boolean;
}

// Enhanced Cart Item with price calculation
export interface EnhancedCartItem extends CartItem {
  priceCalculation?: PriceCalculationResult;
  originalSubtotal: number;
  calculatedSubtotal: number;
  savings: number;
  isAvailable: boolean;
  stockAlert?: string;
  lastUpdated: Date;
}

export interface CartSummary {
  subtotal: number;
  discounts: CartDiscount[];
  totalDiscount: number;
  total: number;
  currency: string;
  itemCount: number;
  savings: number;
  priceCalculations: Record<string, PriceCalculationResult>;
  estimatedTax?: number;
  finalTotal: number;
}

export interface CartValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  updatedItems: CartItem[];
  removedItems: CartItem[];
}

export class CartService extends EventEmitter {
  private cartItems: CartItem[] = [];
  private listeners: Array<(cart: CartState) => void> = [];
  private discounts: CartDiscount[] = [];
  private logger = new Logger('CartService');
  private savedForLater: CartItem[] = [];
  private priceCalculations: Record<string, PriceCalculationResult> = {};
  private autoRecalculateEnabled = true;
  private recalculateTimer?: number;

  async addToCart(productId: string, quantity: number = 1): Promise<ApiResponse<CartItem>> {
    try {
      const product = await productService.getProductById(productId);

      if (!product) {
        return {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        };
      }

      // Enhanced availability check with inventory service
      const availability = await inventoryService.checkPluginProductAvailability(product);
      if (!availability.available) {
        return {
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: availability.reason || 'Product is out of stock',
          },
        };
      }

      // Check stock level
      if (!(await productService.checkStock(productId))) {
        return {
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: 'Product is out of stock',
          },
        };
      }

      const existingItem = this.cartItems.find(item => item.productId === productId);
      const newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

      // Calculate price for the new total quantity
      const priceCalcResult = await priceService.calculatePrice({
        product,
        quantity: newQuantity,
      });

      if (existingItem) {
        existingItem.quantity = newQuantity;
      } else {
        const newItem: CartItem = {
          productId,
          product,
          quantity,
          addedAt: new Date(),
        };
        this.cartItems.push(newItem);
      }

      // Store price calculation
      if (priceCalcResult.success) {
        this.priceCalculations[productId] = priceCalcResult.data!;
      }

      // Schedule auto-recalculation
      this.scheduleRecalculation();
      this.notifyListeners();

      this.emit('itemAdded', { productId, quantity, newTotal: newQuantity });
      this.logger.info(`Added ${quantity} x ${product.name} to cart`, {
        productId,
        quantity,
        newTotal: newQuantity,
        priceCalculation: priceCalcResult.data,
      });

      return {
        success: true,
        data: this.cartItems.find(item => item.productId === productId)!,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CART_ADD_ERROR',
          message: 'Failed to add item to cart',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async removeFromCart(productId: string): Promise<ApiResponse<boolean>> {
    try {
      const itemIndex = this.cartItems.findIndex(item => item.productId === productId);

      if (itemIndex === -1) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found in cart',
          },
        };
      }

      this.cartItems.splice(itemIndex, 1);
      this.notifyListeners();

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CART_REMOVE_ERROR',
          message: 'Failed to remove item from cart',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async updateQuantity(productId: string, quantity: number): Promise<ApiResponse<CartItem>> {
    try {
      const item = this.cartItems.find(item => item.productId === productId);

      if (quantity <= 0) {
        const removeResult = await this.removeFromCart(productId);
        if (removeResult.success && item) {
          return { success: true, data: item };
        }
        return removeResult as any;
      }

      if (!item) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found in cart',
          },
        };
      }

      // Check stock availability for the new quantity
      if (item.product.stock && quantity > item.product.stock.available) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Only ${item.product.stock.available} items available`,
          },
        };
      }

      const previousQuantity = item.quantity;
      item.quantity = quantity;

      // Recalculate price for the new quantity
      const priceCalcResult = await priceService.calculatePrice({
        product: item.product,
        quantity,
      });

      if (priceCalcResult.success) {
        this.priceCalculations[productId] = priceCalcResult.data!;
      }

      this.scheduleRecalculation();
      this.notifyListeners();

      this.emit('quantityUpdated', { productId, previousQuantity, newQuantity: quantity });
      this.logger.info(
        `Updated quantity for ${item.product.name}: ${previousQuantity} → ${quantity}`,
        {
          productId,
          previousQuantity,
          newQuantity: quantity,
          priceCalculation: priceCalcResult.data,
        }
      );

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CART_UPDATE_ERROR',
          message: 'Failed to update item quantity',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async clearCart(): Promise<ApiResponse<boolean>> {
    try {
      this.cartItems = [];
      this.notifyListeners();

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CART_CLEAR_ERROR',
          message: 'Failed to clear cart',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  getCartState(): CartState {
    const total = this.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return {
      items: this.cartItems,
      total,
      currency: this.cartItems[0]?.product.currency || 'USD',
      isLoading: false,
      error: null,
    };
  }

  getItemCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalValue(): number {
    return this.cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  isInCart(productId: string): boolean {
    return this.cartItems.some(item => item.productId === productId);
  }

  getItemQuantity(productId: string): number {
    const item = this.cartItems.find(item => item.productId === productId);
    return item?.quantity || 0;
  }

  validateCart(): Promise<{ isValid: boolean; errors: string[] }> {
    return new Promise(async resolve => {
      const errors: string[] = [];

      for (const item of this.cartItems) {
        const product = await productService.getProductById(item.productId);

        if (!product) {
          errors.push(`Product ${item.product.name} is no longer available`);
          continue;
        }

        if (!product.isActive) {
          errors.push(`Product ${item.product.name} is no longer active`);
          continue;
        }

        if (!(await productService.checkStock(item.productId))) {
          errors.push(`Product ${item.product.name} is out of stock`);
          continue;
        }

        if (product.price !== item.product.price) {
          errors.push(`Price for ${item.product.name} has changed`);
        }
      }

      resolve({
        isValid: errors.length === 0,
        errors,
      });
    });
  }

  onCartChange(listener: (cart: CartState) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const cartState = this.getCartState();
    this.listeners.forEach(listener => listener(cartState));
  }

  saveToStorage(): void {
    try {
      const cartData = {
        items: this.cartItems,
        discounts: this.discounts,
        savedForLater: this.savedForLater,
        timestamp: Date.now(),
      };
      localStorage.setItem('mtyb-cart', JSON.stringify(cartData));
    } catch (error) {
      console.warn('Failed to save cart to storage:', error);
    }
  }

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('mtyb-cart');
      if (!stored) return;

      const cartData = JSON.parse(stored);
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (Date.now() - cartData.timestamp > maxAge) {
        localStorage.removeItem('mtyb-cart');
        return;
      }

      this.cartItems = cartData.items || [];
      this.discounts = cartData.discounts || [];
      this.savedForLater = cartData.savedForLater || [];
      this.notifyListeners();
    } catch (error) {
      console.warn('Failed to load cart from storage:', error);
    }
  }

  constructor() {
    super();
    this.loadFromStorage();
  }

  // 批量操作方法
  async bulkAddToCart(
    items: Array<{ productId: string; quantity: number }>
  ): Promise<ApiResponse<CartItem[]>> {
    try {
      const addedItems: CartItem[] = [];
      const errors: Array<{ productId: string; error: string }> = [];

      for (const { productId, quantity } of items) {
        const result = await this.addToCart(productId, quantity);
        if (result.success) {
          addedItems.push(result.data!);
        } else {
          errors.push({ productId, error: result.error?.message || 'Failed to add item' });
        }
      }

      if (errors.length > 0 && addedItems.length === 0) {
        return {
          success: false,
          error: {
            code: 'BULK_ADD_ERROR',
            message: 'Failed to add any items to cart',
            details: { errors },
          },
        };
      }

      this.emit('bulkItemsAdded', { addedItems, errors });
      this.logger.info(`Bulk added ${addedItems.length} items to cart`, { addedItems, errors });

      return {
        success: true,
        data: addedItems,
        warnings: errors.length > 0 ? { partialFailures: errors } : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_ADD_ERROR',
          message: 'Failed to add items to cart in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async bulkRemoveFromCart(
    productIds: string[]
  ): Promise<ApiResponse<{ removedCount: number; failedIds: string[] }>> {
    try {
      const failedIds: string[] = [];
      let removedCount = 0;

      for (const productId of productIds) {
        const result = await this.removeFromCart(productId);
        if (result.success) {
          removedCount++;
        } else {
          failedIds.push(productId);
        }
      }

      this.emit('bulkItemsRemoved', { removedCount, failedIds });
      this.logger.info(`Bulk removed ${removedCount} items from cart`, { removedCount, failedIds });

      return {
        success: true,
        data: { removedCount, failedIds },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_REMOVE_ERROR',
          message: 'Failed to remove items from cart in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async bulkUpdateQuantities(
    updates: Array<{ productId: string; quantity: number }>
  ): Promise<ApiResponse<CartItem[]>> {
    try {
      const updatedItems: CartItem[] = [];
      const errors: Array<{ productId: string; error: string }> = [];

      for (const { productId, quantity } of updates) {
        const result = await this.updateQuantity(productId, quantity);
        if (result.success) {
          updatedItems.push(result.data!);
        } else {
          errors.push({ productId, error: result.error?.message || 'Failed to update quantity' });
        }
      }

      this.emit('bulkQuantitiesUpdated', { updatedItems, errors });
      this.logger.info(`Bulk updated ${updatedItems.length} item quantities`, {
        updatedItems,
        errors,
      });

      return {
        success: true,
        data: updatedItems,
        warnings: errors.length > 0 ? { partialFailures: errors } : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_UPDATE_ERROR',
          message: 'Failed to update quantities in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // 优惠券和折扣管理
  async applyDiscount(discount: Omit<CartDiscount, 'applied'>): Promise<ApiResponse<CartDiscount>> {
    try {
      // Validate discount conditions
      const validation = await this.validateDiscount(discount);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'INVALID_DISCOUNT',
            message: validation.errors[0] || 'Invalid discount',
            details: { errors: validation.errors },
          },
        };
      }

      // Remove existing discount of same type
      this.discounts = this.discounts.filter(d => d.type !== discount.type || d.id !== discount.id);

      const appliedDiscount: CartDiscount = {
        ...discount,
        applied: true,
      };

      this.discounts.push(appliedDiscount);
      this.notifyListeners();
      this.emit('discountApplied', appliedDiscount);
      this.logger.info(`Applied discount: ${discount.description}`, { discount: appliedDiscount });

      return {
        success: true,
        data: appliedDiscount,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISCOUNT_APPLY_ERROR',
          message: 'Failed to apply discount',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async removeDiscount(discountId: string): Promise<ApiResponse<boolean>> {
    try {
      const discountIndex = this.discounts.findIndex(d => d.id === discountId);

      if (discountIndex === -1) {
        return {
          success: false,
          error: {
            code: 'DISCOUNT_NOT_FOUND',
            message: 'Discount not found',
          },
        };
      }

      const removedDiscount = this.discounts.splice(discountIndex, 1)[0];
      this.notifyListeners();
      this.emit('discountRemoved', removedDiscount);
      this.logger.info(`Removed discount: ${removedDiscount.description}`, {
        discount: removedDiscount,
      });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DISCOUNT_REMOVE_ERROR',
          message: 'Failed to remove discount',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  private async validateDiscount(
    discount: Omit<CartDiscount, 'applied'>
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const cartSummary = this.getCartSummary();

    if (discount.conditions) {
      // Check minimum amount
      if (discount.conditions.minAmount && cartSummary.subtotal < discount.conditions.minAmount) {
        errors.push(`Minimum order amount of ${discount.conditions.minAmount} required`);
      }

      // Check validity date
      if (discount.conditions.validUntil && new Date() > discount.conditions.validUntil) {
        errors.push('Discount has expired');
      }

      // Check applicable products
      if (discount.conditions.applicableProducts) {
        const hasApplicableProduct = this.cartItems.some(item =>
          discount.conditions!.applicableProducts!.includes(item.productId)
        );
        if (!hasApplicableProduct) {
          errors.push('No applicable products in cart');
        }
      }

      // Check applicable categories
      if (discount.conditions.applicableCategories) {
        const hasApplicableCategory = this.cartItems.some(item =>
          discount.conditions!.applicableCategories!.includes(item.product.category)
        );
        if (!hasApplicableCategory) {
          errors.push('No products from applicable categories in cart');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Enhanced cart summary with real-time price calculations
  getCartSummary(): CartSummary {
    let subtotal = 0;
    let calculatedSubtotal = 0;
    let totalSavings = 0;
    let totalDiscount = 0;

    // Calculate subtotals using price calculations
    for (const item of this.cartItems) {
      const originalItemTotal = item.product.price * item.quantity;
      subtotal += originalItemTotal;

      const priceCalc = this.priceCalculations[item.productId];
      if (priceCalc) {
        calculatedSubtotal += priceCalc.finalPrice;
        totalSavings += priceCalc.totalDiscount;
      } else {
        calculatedSubtotal += originalItemTotal;
      }

      // Calculate savings from original prices
      if (item.product.originalPrice && item.product.originalPrice > item.product.price) {
        totalSavings += (item.product.originalPrice - item.product.price) * item.quantity;
      }
    }

    // Apply cart-level discounts
    for (const discount of this.discounts.filter(d => d.applied)) {
      switch (discount.type) {
        case 'percentage':
          const percentageDiscount = (calculatedSubtotal * discount.value) / 100;
          totalDiscount += percentageDiscount;
          break;
        case 'fixed_amount':
          totalDiscount += Math.min(discount.value, calculatedSubtotal);
          break;
        case 'buy_x_get_y':
          // Simplified buy X get Y logic
          // In reality, this would be more complex based on specific products
          totalDiscount += this.calculateBuyXGetYDiscount(discount);
          break;
      }
    }

    const total = Math.max(0, calculatedSubtotal - totalDiscount);
    const itemCount = this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const currency = this.cartItems[0]?.product.currency || 'USD';

    // Estimate tax (simplified - would be based on location and tax rules)
    const estimatedTax = total * 0.08; // 8% tax rate
    const finalTotal = total + estimatedTax;

    return {
      subtotal,
      discounts: this.discounts.filter(d => d.applied),
      totalDiscount,
      total,
      currency,
      itemCount,
      savings: totalSavings + totalDiscount,
      priceCalculations: { ...this.priceCalculations },
      estimatedTax,
      finalTotal,
    };
  }

  private calculateBuyXGetYDiscount(discount: CartDiscount): number {
    // Simplified buy X get Y calculation
    // This would be more sophisticated in a real implementation
    let discountAmount = 0;

    if (discount.conditions?.applicableProducts) {
      const applicableItems = this.cartItems.filter(item =>
        discount.conditions!.applicableProducts!.includes(item.productId)
      );

      for (const item of applicableItems) {
        const freeItems = Math.floor(item.quantity / (discount.value + 1));
        discountAmount += freeItems * item.product.price;
      }
    }

    return discountAmount;
  }

  // 高级验证
  async validateCartAdvanced(): Promise<CartValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const updatedItems: CartItem[] = [];
    const removedItems: CartItem[] = [];

          for (let i = this.cartItems.length - 1; i >= 0; i--) {
      const item = this.cartItems[i];
      if (!item) continue;
      const product = await productService.getProductById(item.productId);

      if (!product) {
        errors.push(`Product ${item.product.name} is no longer available`);
        removedItems.push(item);
        this.cartItems.splice(i, 1);
        continue;
      }

      if (!product.isActive) {
        errors.push(`Product ${item.product.name} is no longer active`);
        removedItems.push(item);
        this.cartItems.splice(i, 1);
        continue;
      }

      // Check stock availability
      const stockAvailable = await productService.checkStock(item.productId);
      if (!stockAvailable) {
        errors.push(`Product ${item.product.name} is out of stock`);
        removedItems.push(item);
        this.cartItems.splice(i, 1);
        continue;
      }

      // Check if price has changed
      if (item && product.price !== item.product.price) {
        warnings.push(
          `Price for ${item.product.name} has changed from ${item.product.currency} ${item.product.price} to ${product.currency} ${product.price}`
        );
        item.product = product;
        updatedItems.push(item);
      }

      // Check quantity against available stock
      if (item && product.stock && item.quantity > product.stock.available) {
        warnings.push(
          `Reduced quantity for ${item.product.name} from ${item.quantity} to ${product.stock.available} (limited stock)`
        );
        item.quantity = product.stock.available;
        updatedItems.push(item);
      }
    }

    if (updatedItems.length > 0 || removedItems.length > 0) {
      this.notifyListeners();
      this.emit('cartValidated', { updatedItems, removedItems, warnings, errors });
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      updatedItems,
      removedItems,
    };
  }

  // 保存以供稍后购买
  async saveForLater(productId: string): Promise<ApiResponse<boolean>> {
    try {
      const itemIndex = this.cartItems.findIndex(item => item.productId === productId);

      if (itemIndex === -1) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found in cart',
          },
        };
      }

      const item = this.cartItems.splice(itemIndex, 1)[0];
      if (!item) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Failed to remove item from cart',
          },
        };
      }

      this.savedForLater.push(item);

      this.notifyListeners();
      this.emit('itemSavedForLater', item);
      this.logger.info(`Saved item for later: ${item.product.name}`, { item });

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAVE_FOR_LATER_ERROR',
          message: 'Failed to save item for later',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async moveFromSavedToCart(productId: string): Promise<ApiResponse<CartItem>> {
    try {
      const itemIndex = this.savedForLater.findIndex(item => item.productId === productId);

      if (itemIndex === -1) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found in saved for later',
          },
        };
      }

      const item = this.savedForLater.splice(itemIndex, 1)[0];
      if (!item) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Failed to remove item from saved list',
          },
        };
      }

      // Validate item is still available
      const stockAvailable = await productService.checkStock(item.productId);
      if (!stockAvailable) {
        return {
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: 'Product is no longer in stock',
          },
        };
      }

      // Update product info
      const currentProduct = await productService.getProductById(item.productId);
      if (currentProduct) {
        item.product = currentProduct;
      }

      this.cartItems.push(item);
      this.notifyListeners();
      this.emit('itemMovedFromSavedToCart', item);
      this.logger.info(`Moved item from saved to cart: ${item.product.name}`, { item });

      return {
        success: true,
        data: item,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOVE_FROM_SAVED_ERROR',
          message: 'Failed to move item from saved to cart',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  getSavedForLater(): CartItem[] {
    return [...this.savedForLater];
  }

  // 快速添加功能
  async quickAddMultiple(productIds: string[]): Promise<ApiResponse<CartItem[]>> {
    const items = productIds.map(id => ({ productId: id, quantity: 1 }));
    return this.bulkAddToCart(items);
  }

  // 购物车建议
  async getCartSuggestions(): Promise<Product[]> {
    try {
      if (this.cartItems.length === 0) return [];

      // Get products from same categories as cart items
      const categories = [...new Set(this.cartItems.map(item => item.product.category))];
      const suggestions: Product[] = [];

      for (const category of categories) {
        const categoryProducts = await productService.getProductsByCategory(category);
        const filtered = categoryProducts.filter(p => !this.isInCart(p.id)).slice(0, 2);
        suggestions.push(...filtered);
      }

      return suggestions.slice(0, 6);
    } catch (error) {
      this.logger.error('Failed to get cart suggestions', { error });
      return [];
    }
  }

  // 导出购物车
  exportCart(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      items: this.cartItems,
      savedForLater: this.savedForLater,
      discounts: this.discounts,
      summary: this.getCartSummary(),
    };
    return JSON.stringify(exportData, null, 2);
  }

  // ============================================================================
  // Enhanced Cart Management Methods
  // ============================================================================

  /**
   * Schedule automatic recalculation to avoid excessive API calls
   */
  private scheduleRecalculation(): void {
    if (!this.autoRecalculateEnabled) return;

    if (this.recalculateTimer) {
      window.clearTimeout(this.recalculateTimer);
    }

    this.recalculateTimer = window.setTimeout(() => {
      this.recalculateAllPrices();
    }, 1000); // Debounce for 1 second
  }

  /**
   * Recalculate prices for all items in cart
   */
  async recalculateAllPrices(): Promise<void> {
    try {
      const calculations: Record<string, PriceCalculationResult> = {};

      for (const item of this.cartItems) {
        const priceCalcResult = await priceService.calculatePrice({
          product: item.product,
          quantity: item.quantity,
        });

        if (priceCalcResult.success) {
          calculations[item.productId] = priceCalcResult.data!;
        }
      }

      this.priceCalculations = calculations;
      this.emit('pricesRecalculated', calculations);
      this.logger.debug('Recalculated all cart prices', { calculations });
    } catch (error) {
      this.logger.error('Failed to recalculate cart prices', { error });
    }
  }

  /**
   * Get enhanced cart items with calculated prices and availability
   */
  async getEnhancedCartItems(): Promise<EnhancedCartItem[]> {
    const enhancedItems: EnhancedCartItem[] = [];

    for (const item of this.cartItems) {
      const priceCalc = this.priceCalculations[item.productId];
      const originalSubtotal = item.product.price * item.quantity;
      const calculatedSubtotal = priceCalc ? priceCalc.finalPrice : originalSubtotal;
      const savings = priceCalc ? priceCalc.totalDiscount : 0;

      // Check current availability
      const availability = await inventoryService.checkPluginProductAvailability(item.product);

      // Check for stock alerts
      const stockAlerts = await inventoryService.checkStockLevels([item.product]);
      const stockAlert = stockAlerts.find(alert => alert.productId === item.productId);

      const enhancedItem: EnhancedCartItem = {
        ...item,
        priceCalculation: priceCalc,
        originalSubtotal,
        calculatedSubtotal,
        savings,
        isAvailable: availability.available,
        stockAlert: stockAlert?.message,
        lastUpdated: new Date(),
      };

      enhancedItems.push(enhancedItem);
    }

    return enhancedItems;
  }

  /**
   * Apply smart bundle discount detection
   */
  async detectAndApplySmartDiscounts(): Promise<CartDiscount[]> {
    const appliedDiscounts: CartDiscount[] = [];

    // Bundle discount detection (example: VPN + Security bundle)
    const hasVpn = this.cartItems.some(item => item.product.category === 'vpn');
    const hasSecurity = this.cartItems.some(item => item.product.category === ProductCategory.SECURITY);

    if (hasVpn && hasSecurity && !this.discounts.some(d => d.id === 'vpn-security-bundle')) {
      const bundleDiscount: CartDiscount = {
        id: 'vpn-security-bundle',
        type: 'percentage',
        value: 15,
        description: 'VPN + Security Bundle Discount (15% off)',
        applied: false,
      };

      const applyResult = await this.applyDiscount(bundleDiscount);
      if (applyResult.success) {
        appliedDiscounts.push(applyResult.data!);
      }
    }

    // Quantity discount detection
    const totalQuantity = this.getItemCount();
    if (totalQuantity >= 5 && !this.discounts.some(d => d.id === 'bulk-quantity-discount')) {
      const quantityDiscount: CartDiscount = {
        id: 'bulk-quantity-discount',
        type: 'percentage',
        value: 10,
        description: 'Bulk Order Discount (10% off for 5+ items)',
        applied: false,
      };

      const applyResult = await this.applyDiscount(quantityDiscount);
      if (applyResult.success) {
        appliedDiscounts.push(applyResult.data!);
      }
    }

    return appliedDiscounts;
  }

  /**
   * Get cart analytics
   */
  getCartAnalytics(): {
    averageItemPrice: number;
    mostExpensiveItem: CartItem | null;
    leastExpensiveItem: CartItem | null;
    categoryBreakdown: Record<string, { count: number; value: number }>;
    potentialSavings: number;
    priceEfficiency: number;
  } {
    if (this.cartItems.length === 0) {
      return {
        averageItemPrice: 0,
        mostExpensiveItem: null,
        leastExpensiveItem: null,
        categoryBreakdown: {},
        potentialSavings: 0,
        priceEfficiency: 1,
      };
    }

    const totalValue = this.getTotalValue();
    const averageItemPrice = totalValue / this.getItemCount();

    const sortedByPrice = [...this.cartItems].sort((a, b) => a.product.price - b.product.price);
    const mostExpensiveItem = sortedByPrice[sortedByPrice.length - 1] || null;
    const leastExpensiveItem = sortedByPrice[0] || null;

    const categoryBreakdown: Record<string, { count: number; value: number }> = {};
    for (const item of this.cartItems) {
      const category = item.product.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, value: 0 };
      }
      categoryBreakdown[category].count += item.quantity;
      categoryBreakdown[category].value += item.product.price * item.quantity;
    }

    const summary = this.getCartSummary();
    const potentialSavings = summary.savings;
    const priceEfficiency = summary.total / summary.subtotal;

    return {
      averageItemPrice,
      mostExpensiveItem,
      leastExpensiveItem,
      categoryBreakdown,
      potentialSavings,
      priceEfficiency,
    };
  }

  /**
   * Enable/disable auto-recalculation
   */
  setAutoRecalculate(enabled: boolean): void {
    this.autoRecalculateEnabled = enabled;
    if (enabled) {
      this.scheduleRecalculation();
    } else if (this.recalculateTimer) {
      window.clearTimeout(this.recalculateTimer);
    }
  }

  /**
   * Get price calculation for a specific item
   */
  getItemPriceCalculation(productId: string): PriceCalculationResult | null {
    return this.priceCalculations[productId] || null;
  }

  /**
   * Manual price recalculation for specific item
   */
  async recalculateItemPrice(productId: string): Promise<ApiResponse<PriceCalculationResult>> {
    try {
      const item = this.cartItems.find(i => i.productId === productId);
      if (!item) {
        return {
          success: false,
          error: {
            code: 'ITEM_NOT_FOUND',
            message: 'Item not found in cart',
          },
        };
      }

      const priceCalcResult = await priceService.calculatePrice({
        product: item.product,
        quantity: item.quantity,
      });

      if (priceCalcResult.success) {
        this.priceCalculations[productId] = priceCalcResult.data!;
        this.notifyListeners();
        this.emit('itemPriceRecalculated', { productId, calculation: priceCalcResult.data });
      }

      return priceCalcResult;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RECALCULATE_ERROR',
          message: 'Failed to recalculate item price',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // 重新计算购物车
  async recalculateCart(): Promise<void> {
    await this.validateCartAdvanced();
    await this.recalculateAllPrices();
    this.notifyListeners();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.recalculateTimer) {
      window.clearTimeout(this.recalculateTimer);
    }
    this.removeAllListeners();
    this.listeners = [];
  }
}

export const cartService = new CartService();
