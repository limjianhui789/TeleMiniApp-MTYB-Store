// ============================================================================
// MTYB Virtual Goods Platform - Price Management Service
// ============================================================================

import type { ApiResponse, Product } from '../../types';
import { ProductCategory } from '../../types';
import { Logger } from '../../core/utils/Logger';
import { EventEmitter } from '../../core/utils/EventEmitter';

// ============================================================================
// Price Interface Definitions
// ============================================================================

export interface PriceRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'DISCOUNT' | 'MARKUP' | 'FIXED_PRICE' | 'TIER_PRICING' | 'DYNAMIC_PRICING';
  priority: number; // 优先级，数字越小优先级越高
  isActive: boolean;
  conditions: PriceCondition[];
  actions: PriceAction[];
  validFrom?: Date;
  validTo?: Date;
  usageLimit?: number;
  usageCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceCondition {
  type: 'CATEGORY' | 'PRODUCT' | 'QUANTITY' | 'USER_TYPE' | 'TIME' | 'PLUGIN';
  operator: 'EQUALS' | 'IN' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN';
  values: any[];
  metadata?: Record<string, any>;
}

export interface PriceAction {
  type: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT' | 'SET_PRICE' | 'PERCENTAGE_MARKUP';
  value: number;
  maxDiscount?: number; // 最大折扣金额
  metadata?: Record<string, any>;
}

export interface PriceTier {
  id: string;
  productId: string;
  minQuantity: number;
  maxQuantity?: number;
  pricePerUnit: number;
  discountPercentage?: number;
  isActive: boolean;
}

export interface PriceHistory {
  id: string;
  productId: string;
  previousPrice: number;
  newPrice: number;
  changeReason: string;
  changedBy: 'user' | 'system' | 'rule';
  ruleId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PriceCalculationContext {
  product: Product;
  quantity: number;
  userId?: string;
  userType?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface PriceCalculationResult {
  basePrice: number;
  finalPrice: number;
  appliedRules: string[];
  discounts: Array<{
    ruleId: string;
    ruleName: string;
    type: string;
    amount: number;
    percentage?: number;
  }>;
  totalDiscount: number;
  totalTax?: number;
  metadata?: Record<string, any>;
}

export interface PriceStats {
  totalProducts: number;
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  totalDiscountGiven: number;
  mostDiscountedProducts: Array<{ productId: string; discountPercentage: number }>;
  pricesByCategory: Record<ProductCategory, { average: number; count: number }>;
  ruleUsageStats: Record<string, number>;
}

// ============================================================================
// Price Service Implementation
// ============================================================================

export class PriceService extends EventEmitter {
  private logger: Logger;
  private priceRules: PriceRule[] = [];
  private priceTiers: PriceTier[] = [];
  private priceHistory: PriceHistory[] = [];

  constructor() {
    super();
    this.logger = new Logger('PriceService');
    this.initializeDefaultRules();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeDefaultRules(): void {
    this.priceRules = [
      {
        id: 'bulk-discount-10',
        name: 'Bulk Discount 10+',
        description: '10% discount for orders of 10 or more items',
        ruleType: 'DISCOUNT',
        priority: 10,
        isActive: true,
        conditions: [
          {
            type: 'QUANTITY',
            operator: 'GREATER_THAN',
            values: [9], // 10 or more
          },
        ],
        actions: [
          {
            type: 'PERCENTAGE_DISCOUNT',
            value: 10,
          },
        ],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'premium-category-markup',
        name: 'Premium Category Markup',
        description: '20% markup for premium VPN services',
        ruleType: 'MARKUP',
        priority: 5,
        isActive: true,
        conditions: [
          {
            type: 'CATEGORY',
            operator: 'EQUALS',
            values: [ProductCategory.VPN],
          },
        ],
        actions: [
          {
            type: 'PERCENTAGE_MARKUP',
            value: 20,
          },
        ],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  // ============================================================================
  // Price Rule Management
  // ============================================================================

  async createPriceRule(
    ruleData: Omit<PriceRule, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<PriceRule>> {
    try {
      const newRule: PriceRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.priceRules.push(newRule);
      this.priceRules.sort((a, b) => a.priority - b.priority);

      this.logger.info(`Created price rule: ${newRule.name} (${newRule.id})`);
      this.emit('ruleCreated', newRule);

      return {
        success: true,
        data: newRule,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RULE_CREATE_ERROR',
          message: 'Failed to create price rule',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async updatePriceRule(
    id: string,
    updates: Partial<Omit<PriceRule, 'id' | 'createdAt'>>
  ): Promise<ApiResponse<PriceRule>> {
    try {
      const ruleIndex = this.priceRules.findIndex(rule => rule.id === id);

      if (ruleIndex === -1) {
        return {
          success: false,
          error: {
            code: 'RULE_NOT_FOUND',
            message: 'Price rule not found',
          },
        };
      }

      const existingRule = this.priceRules[ruleIndex];
      if (!existingRule) {
        return {
          success: false,
          error: {
            code: 'RULE_NOT_FOUND',
            message: 'Price rule not found',
          },
        };
      }

      const updatedRule: PriceRule = {
        ...existingRule,
        ...updates,
        id, // Preserve original ID
        name: updates.name || existingRule.name, // Ensure name is always defined
        ruleType: updates.ruleType || existingRule.ruleType, // Ensure ruleType is always defined
        updatedAt: new Date(),
      };

      this.priceRules[ruleIndex] = updatedRule;
      this.priceRules.sort((a, b) => a.priority - b.priority);

      this.logger.info(`Updated price rule: ${updatedRule.name} (${updatedRule.id})`);
      this.emit('ruleUpdated', updatedRule);

      return {
        success: true,
        data: updatedRule,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RULE_UPDATE_ERROR',
          message: 'Failed to update price rule',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async deletePriceRule(id: string): Promise<ApiResponse<boolean>> {
    try {
      const ruleIndex = this.priceRules.findIndex(rule => rule.id === id);

      if (ruleIndex === -1) {
        return {
          success: false,
          error: {
            code: 'RULE_NOT_FOUND',
            message: 'Price rule not found',
          },
        };
      }

      const deletedRule = this.priceRules[ruleIndex];
      this.priceRules.splice(ruleIndex, 1);

      this.logger.info(`Deleted price rule: ${deletedRule.name} (${deletedRule.id})`);
      this.emit('ruleDeleted', deletedRule);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RULE_DELETE_ERROR',
          message: 'Failed to delete price rule',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async getAllPriceRules(): Promise<PriceRule[]> {
    return [...this.priceRules];
  }

  async getActivePriceRules(): Promise<PriceRule[]> {
    const now = new Date();
    return this.priceRules.filter(
      rule =>
        rule.isActive &&
        (!rule.validFrom || rule.validFrom <= now) &&
        (!rule.validTo || rule.validTo >= now) &&
        (!rule.usageLimit || rule.usageCount < rule.usageLimit)
    );
  }

  // ============================================================================
  // Price Calculation
  // ============================================================================

  async calculatePrice(
    context: PriceCalculationContext
  ): Promise<ApiResponse<PriceCalculationResult>> {
    try {
      const { product, quantity } = context;
      const basePrice = product.price * quantity;

      let finalPrice = basePrice;
      const appliedRules: string[] = [];
      const discounts: PriceCalculationResult['discounts'] = [];
      let totalDiscount = 0;

      // Get applicable rules
      const applicableRules = await this.getApplicableRules(context);

      // Apply rules in priority order
      for (const rule of applicableRules) {
        if (this.evaluateConditions(rule.conditions, context)) {
          const ruleResult = this.applyPriceActions(rule.actions, finalPrice, basePrice);

          if (ruleResult.changed) {
            appliedRules.push(rule.id);
            finalPrice = ruleResult.newPrice;

            const discountAmount = basePrice - finalPrice;
            if (discountAmount > 0) {
              discounts.push({
                ruleId: rule.id,
                ruleName: rule.name,
                type: rule.ruleType,
                amount: discountAmount,
                percentage: (discountAmount / basePrice) * 100,
              });
              totalDiscount += discountAmount;
            }

            // Update rule usage
            rule.usageCount++;
            rule.updatedAt = new Date();
          }
        }
      }

      // Check for tier pricing
      const tierResult = await this.applyTierPricing(product.id, quantity, finalPrice);
      if (tierResult.applied) {
        finalPrice = tierResult.newPrice;
        appliedRules.push('tier-pricing');
      }

      const result: PriceCalculationResult = {
        basePrice,
        finalPrice: Math.max(0, finalPrice), // Ensure price doesn't go negative
        appliedRules,
        discounts,
        totalDiscount,
        metadata: {
          calculatedAt: new Date(),
          quantity,
          productId: product.id,
        },
      };

      this.logger.debug(
        `Price calculated for product ${product.id}: ${basePrice} -> ${finalPrice}`
      );
      this.emit('priceCalculated', result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRICE_CALCULATION_ERROR',
          message: 'Failed to calculate price',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  private async getApplicableRules(context: PriceCalculationContext): Promise<PriceRule[]> {
    const activeRules = await this.getActivePriceRules();
    return activeRules.filter(rule => this.isRuleApplicable(rule, context));
  }

  private isRuleApplicable(rule: PriceRule, context: PriceCalculationContext): boolean {
    // Check if any condition matches the context
    return rule.conditions.some(condition => this.evaluateCondition(condition, context));
  }

  private evaluateConditions(
    conditions: PriceCondition[],
    context: PriceCalculationContext
  ): boolean {
    // All conditions must be true (AND logic)
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  private evaluateCondition(condition: PriceCondition, context: PriceCalculationContext): boolean {
    const { type, operator, values } = condition;
    const { product, quantity, userType } = context;

    switch (type) {
      case 'CATEGORY':
        return this.evaluateOperator(operator, product.category, values);

      case 'PRODUCT':
        return this.evaluateOperator(operator, product.id, values);

      case 'QUANTITY':
        return this.evaluateOperator(operator, quantity, values);

      case 'USER_TYPE':
        return userType ? this.evaluateOperator(operator, userType, values) : false;

      case 'PLUGIN':
        return this.evaluateOperator(operator, product.pluginId, values);

      case 'TIME':
        const now = context.timestamp || new Date();
        const hour = now.getHours();
        return this.evaluateOperator(operator, hour, values);

      default:
        return false;
    }
  }

  private evaluateOperator(operator: string, value: any, targetValues: any[]): boolean {
    switch (operator) {
      case 'EQUALS':
        return targetValues.includes(value);

      case 'IN':
        return targetValues.includes(value);

      case 'GREATER_THAN':
        return targetValues.length > 0 && value > targetValues[0];

      case 'LESS_THAN':
        return targetValues.length > 0 && value < targetValues[0];

      case 'BETWEEN':
        return targetValues.length >= 2 && value >= targetValues[0] && value <= targetValues[1];

      default:
        return false;
    }
  }

  private applyPriceActions(
    actions: PriceAction[],
    currentPrice: number,
    basePrice: number
  ): { changed: boolean; newPrice: number } {
    let newPrice = currentPrice;
    let changed = false;

    for (const action of actions) {
      switch (action.type) {
        case 'PERCENTAGE_DISCOUNT':
          const discountAmount = basePrice * (action.value / 100);
          const maxDiscount = action.maxDiscount || discountAmount;
          newPrice -= Math.min(discountAmount, maxDiscount);
          changed = true;
          break;

        case 'FIXED_DISCOUNT':
          newPrice -= action.value;
          changed = true;
          break;

        case 'SET_PRICE':
          newPrice = action.value;
          changed = true;
          break;

        case 'PERCENTAGE_MARKUP':
          newPrice += basePrice * (action.value / 100);
          changed = true;
          break;
      }
    }

    return { changed, newPrice };
  }

  // ============================================================================
  // Tier Pricing
  // ============================================================================

  async createPriceTier(tierData: Omit<PriceTier, 'id'>): Promise<ApiResponse<PriceTier>> {
    try {
      const newTier: PriceTier = {
        ...tierData,
        id: `tier-${Date.now()}`,
      };

      this.priceTiers.push(newTier);

      this.logger.info(`Created price tier for product ${newTier.productId}`);

      return {
        success: true,
        data: newTier,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TIER_CREATE_ERROR',
          message: 'Failed to create price tier',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async getPriceTiers(productId: string): Promise<PriceTier[]> {
    return this.priceTiers
      .filter(tier => tier.productId === productId && tier.isActive)
      .sort((a, b) => a.minQuantity - b.minQuantity);
  }

  private async applyTierPricing(
    productId: string,
    quantity: number,
    currentPrice: number
  ): Promise<{ applied: boolean; newPrice: number }> {
    const tiers = await this.getPriceTiers(productId);

    for (const tier of tiers.reverse()) {
      // Start from highest quantity
      if (quantity >= tier.minQuantity && (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
        const tierPrice = tier.pricePerUnit * quantity;
        return { applied: true, newPrice: tierPrice };
      }
    }

    return { applied: false, newPrice: currentPrice };
  }

  // ============================================================================
  // Price History
  // ============================================================================

  async recordPriceChange(
    productId: string,
    previousPrice: number,
    newPrice: number,
    reason: string,
    changedBy: 'user' | 'system' | 'rule' = 'system',
    ruleId?: string
  ): Promise<PriceHistory> {
    const historyEntry: PriceHistory = {
      id: `history-${Date.now()}`,
      productId,
      previousPrice,
      newPrice,
      changeReason: reason,
      changedBy,
      ruleId,
      createdAt: new Date(),
    };

    this.priceHistory.push(historyEntry);
    this.emit('priceChanged', historyEntry);

    return historyEntry;
  }

  async getPriceHistory(productId?: string, limit?: number): Promise<PriceHistory[]> {
    let history = productId
      ? this.priceHistory.filter(h => h.productId === productId)
      : this.priceHistory;

    // Sort by creation date (newest first)
    history = history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (limit) {
      history = history.slice(0, limit);
    }

    return history;
  }

  // ============================================================================
  // Price Analytics
  // ============================================================================

  async getPriceStats(products: Product[]): Promise<ApiResponse<PriceStats>> {
    try {
      if (products.length === 0) {
        return {
          success: true,
          data: {
            totalProducts: 0,
            averagePrice: 0,
            lowestPrice: 0,
            highestPrice: 0,
            totalDiscountGiven: 0,
            mostDiscountedProducts: [],
            pricesByCategory: {} as Record<ProductCategory, { average: number; count: number }>,
            ruleUsageStats: {},
          },
        };
      }

      const prices = products.map(p => p.price);
      const totalProducts = products.length;
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / totalProducts;
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);

      // Calculate total discount given (from price history)
      const discountHistory = this.priceHistory.filter(h => h.newPrice < h.previousPrice);
      const totalDiscountGiven = discountHistory.reduce(
        (sum, h) => sum + (h.previousPrice - h.newPrice),
        0
      );

      // Most discounted products
      const mostDiscountedProducts = products
        .map(product => {
          const originalPrice = product.originalPrice || product.price;
          const discountPercentage = ((originalPrice - product.price) / originalPrice) * 100;
          return { productId: product.id, discountPercentage };
        })
        .filter(item => item.discountPercentage > 0)
        .sort((a, b) => b.discountPercentage - a.discountPercentage)
        .slice(0, 10);

      // Prices by category
      const pricesByCategory: Record<ProductCategory, { average: number; count: number }> =
        {} as any;
      for (const category of Object.values(ProductCategory)) {
        const categoryProducts = products.filter(p => p.category === category);
        if (categoryProducts.length > 0) {
          const categoryPrices = categoryProducts.map(p => p.price);
          const average =
            categoryPrices.reduce((sum, price) => sum + price, 0) / categoryPrices.length;
          pricesByCategory[category] = { average, count: categoryProducts.length };
        }
      }

      // Rule usage stats
      const ruleUsageStats: Record<string, number> = {};
      this.priceRules.forEach(rule => {
        ruleUsageStats[rule.id] = rule.usageCount;
      });

      const stats: PriceStats = {
        totalProducts,
        averagePrice,
        lowestPrice,
        highestPrice,
        totalDiscountGiven,
        mostDiscountedProducts,
        pricesByCategory,
        ruleUsageStats,
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
          message: 'Failed to calculate price statistics',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  async bulkPriceUpdate(
    updates: Array<{ productId: string; newPrice: number; reason?: string }>
  ): Promise<ApiResponse<{ updated: number; errors: string[] }>> {
    try {
      let updated = 0;
      const errors: string[] = [];

      for (const update of updates) {
        try {
          await this.recordPriceChange(
            update.productId,
            0, // Previous price would need to be fetched from product
            update.newPrice,
            update.reason || 'Bulk price update',
            'user'
          );
          updated++;
        } catch (error) {
          errors.push(
            `${update.productId}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      this.logger.info(`Bulk price update completed: ${updated} updated, ${errors.length} errors`);

      return {
        success: true,
        data: { updated, errors },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_UPDATE_ERROR',
          message: 'Failed to update prices in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // ============================================================================
  // Export and Import
  // ============================================================================

  async exportPriceData(): Promise<ApiResponse<string>> {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        priceRules: this.priceRules,
        priceTiers: this.priceTiers,
        priceHistory: this.priceHistory.slice(-1000), // Last 1000 entries
        metadata: {
          totalRules: this.priceRules.length,
          activeRules: this.priceRules.filter(r => r.isActive).length,
          totalTiers: this.priceTiers.length,
          totalHistoryEntries: this.priceHistory.length,
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
          message: 'Failed to export price data',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }
}

// ============================================================================
// Global Price Service Instance
// ============================================================================

export const priceService = new PriceService();
