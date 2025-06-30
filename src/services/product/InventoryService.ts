import type { Product, ApiResponse } from '../../types';
import { EventEmitter } from '../../core/utils/EventEmitter';
import { Logger } from '../../core/utils/Logger';
import { pluginManager } from '../../core/plugin/PluginManager';

export interface StockAlert {
  id: string;
  productId: string;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCKED';
  message: string;
  threshold?: number;
  currentStock: number;
  recommendedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  acknowledged: boolean;
}

export interface InventoryRule {
  id: string;
  productId: string;
  ruleType: 'AUTO_RESTOCK' | 'STOCK_LIMIT' | 'PRICE_ADJUSTMENT';
  conditions: {
    lowStockThreshold?: number;
    outOfStockAction?: 'disable' | 'notify' | 'restock';
    maxStockLevel?: number;
    autoRestockAmount?: number;
    priceMultiplier?: number;
  };
  isActive: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'SALE' | 'RESTOCK' | 'RESERVE' | 'RELEASE' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  triggeredBy: 'user' | 'system' | 'rule';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  overStockedProducts: number;
  totalValue: number;
  averageStockLevel: number;
  stockTurnoverRate: number;
  alertsByType: Record<string, number>;
}

export class InventoryService extends EventEmitter {
  private alerts: StockAlert[] = [];
  private rules: InventoryRule[] = [];
  private transactions: InventoryTransaction[] = [];
  private logger = new Logger('InventoryService');

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Initialize with some default inventory rules
    this.rules = [
      {
        id: 'default-low-stock-alert',
        productId: '*', // Apply to all products
        ruleType: 'AUTO_RESTOCK',
        conditions: {
          lowStockThreshold: 10,
          outOfStockAction: 'notify',
          autoRestockAmount: 50,
        },
        isActive: true,
        createdAt: new Date(),
      },
    ];
  }

  // 库存监控和预警
  async checkStockLevels(products: Product[]): Promise<StockAlert[]> {
    const newAlerts: StockAlert[] = [];

    for (const product of products) {
      if (!product.stock) continue;

      const currentStock = product.stock.available;
      const threshold = product.stock.lowStockThreshold;

      // Check for out of stock
      if (currentStock <= 0) {
        const alert: StockAlert = {
          id: `out-of-stock-${product.id}-${Date.now()}`,
          productId: product.id,
          alertType: 'OUT_OF_STOCK',
          message: `Product "${product.name}" is out of stock`,
          currentStock,
          recommendedAction: 'Restock immediately or disable product',
          severity: 'critical',
          createdAt: new Date(),
          acknowledged: false,
        };
        newAlerts.push(alert);
      }
      // Check for low stock
      else if (currentStock <= threshold) {
        const alert: StockAlert = {
          id: `low-stock-${product.id}-${Date.now()}`,
          productId: product.id,
          alertType: 'LOW_STOCK',
          message: `Product "${product.name}" is running low on stock`,
          threshold,
          currentStock,
          recommendedAction: `Restock to maintain at least ${threshold * 2} units`,
          severity: currentStock <= threshold / 2 ? 'high' : 'medium',
          createdAt: new Date(),
          acknowledged: false,
        };
        newAlerts.push(alert);
      }
      // Check for overstock (if max level is defined)
      else if (product.stock.total && currentStock > product.stock.total * 1.5) {
        const alert: StockAlert = {
          id: `overstock-${product.id}-${Date.now()}`,
          productId: product.id,
          alertType: 'OVERSTOCKED',
          message: `Product "${product.name}" has excess stock`,
          currentStock,
          recommendedAction: 'Consider promotional pricing to move inventory',
          severity: 'low',
          createdAt: new Date(),
          acknowledged: false,
        };
        newAlerts.push(alert);
      }
    }

    // Add new alerts and emit events
    this.alerts.push(...newAlerts);

    for (const alert of newAlerts) {
      this.emit('stockAlert', alert);
      this.logger.warn(`Stock Alert: ${alert.message}`, { alert });
    }

    return newAlerts;
  }

  async getActiveAlerts(): Promise<StockAlert[]> {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  async acknowledgeAlert(alertId: string): Promise<ApiResponse<boolean>> {
    try {
      const alert = this.alerts.find(a => a.id === alertId);

      if (!alert) {
        return {
          success: false,
          error: {
            code: 'ALERT_NOT_FOUND',
            message: 'Alert not found',
          },
        };
      }

      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);

      return {
        success: true,
        data: true,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ACKNOWLEDGE_ERROR',
          message: 'Failed to acknowledge alert',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // 库存规则管理
  async createInventoryRule(
    ruleData: Omit<InventoryRule, 'id' | 'createdAt'>
  ): Promise<ApiResponse<InventoryRule>> {
    try {
      const newRule: InventoryRule = {
        ...ruleData,
        id: `rule-${Date.now()}`,
        createdAt: new Date(),
      };

      this.rules.push(newRule);
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
          message: 'Failed to create inventory rule',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async updateInventoryRule(
    ruleId: string,
    updates: Partial<InventoryRule>
  ): Promise<ApiResponse<InventoryRule>> {
    try {
      const ruleIndex = this.rules.findIndex(r => r.id === ruleId);

      if (ruleIndex === -1) {
        return {
          success: false,
          error: {
            code: 'RULE_NOT_FOUND',
            message: 'Inventory rule not found',
          },
        };
      }

      const updatedRule = {
        ...this.rules[ruleIndex],
        ...updates,
        id: ruleId, // Preserve ID
      };

      this.rules[ruleIndex] = updatedRule;
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
          message: 'Failed to update inventory rule',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async deleteInventoryRule(ruleId: string): Promise<ApiResponse<boolean>> {
    try {
      const ruleIndex = this.rules.findIndex(r => r.id === ruleId);

      if (ruleIndex === -1) {
        return {
          success: false,
          error: {
            code: 'RULE_NOT_FOUND',
            message: 'Inventory rule not found',
          },
        };
      }

      const deletedRule = this.rules.splice(ruleIndex, 1)[0];
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
          message: 'Failed to delete inventory rule',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async getInventoryRules(productId?: string): Promise<InventoryRule[]> {
    if (productId) {
      return this.rules.filter(rule => rule.productId === productId || rule.productId === '*');
    }
    return this.rules;
  }

  // 自动补货功能
  async processAutoRestock(
    product: Product
  ): Promise<ApiResponse<{ restocked: boolean; newStock: number }>> {
    try {
      const applicableRules = this.rules.filter(
        rule =>
          rule.isActive &&
          rule.ruleType === 'AUTO_RESTOCK' &&
          (rule.productId === product.id || rule.productId === '*')
      );

      if (applicableRules.length === 0 || !product.stock) {
        return {
          success: true,
          data: { restocked: false, newStock: product.stock?.available || 0 },
        };
      }

      const rule = applicableRules[0]; // Use first applicable rule
      const currentStock = product.stock.available;
      const threshold = rule.conditions.lowStockThreshold || product.stock.lowStockThreshold;

      if (currentStock <= threshold && rule.conditions.autoRestockAmount) {
        const restockAmount = rule.conditions.autoRestockAmount;
        const newStock = currentStock + restockAmount;

        // Record transaction
        const transaction: InventoryTransaction = {
          id: `transaction-${Date.now()}`,
          productId: product.id,
          type: 'RESTOCK',
          quantity: restockAmount,
          previousStock: currentStock,
          newStock,
          reason: 'Auto-restock triggered by rule',
          triggeredBy: 'system',
          metadata: { ruleId: rule.id },
          createdAt: new Date(),
        };

        this.transactions.push(transaction);

        // Update rule last triggered
        rule.lastTriggered = new Date();

        this.emit('autoRestock', { product, transaction, rule });
        this.logger.info(`Auto-restocked product ${product.name}`, { transaction });

        return {
          success: true,
          data: { restocked: true, newStock },
        };
      }

      return {
        success: true,
        data: { restocked: false, newStock: currentStock },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTO_RESTOCK_ERROR',
          message: 'Failed to process auto-restock',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // 库存交易记录
  async recordTransaction(
    transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>
  ): Promise<InventoryTransaction> {
    const newTransaction: InventoryTransaction = {
      ...transaction,
      id: `transaction-${Date.now()}`,
      createdAt: new Date(),
    };

    this.transactions.push(newTransaction);
    this.emit('transactionRecorded', newTransaction);

    return newTransaction;
  }

  async getTransactionHistory(productId?: string, limit?: number): Promise<InventoryTransaction[]> {
    let transactions = productId
      ? this.transactions.filter(t => t.productId === productId)
      : this.transactions;

    // Sort by creation date (newest first)
    transactions = transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (limit) {
      transactions = transactions.slice(0, limit);
    }

    return transactions;
  }

  // 库存统计和报告
  async getInventoryStats(products: Product[]): Promise<ApiResponse<InventoryStats>> {
    try {
      const totalProducts = products.length;
      let totalStock = 0;
      let lowStockProducts = 0;
      let outOfStockProducts = 0;
      let overStockedProducts = 0;
      let totalValue = 0;

      for (const product of products) {
        if (product.stock) {
          const stock = product.stock.available;
          totalStock += stock;
          totalValue += stock * product.price;

          if (stock <= 0) {
            outOfStockProducts++;
          } else if (stock <= product.stock.lowStockThreshold) {
            lowStockProducts++;
          } else if (product.stock.total && stock > product.stock.total * 1.5) {
            overStockedProducts++;
          }
        }
      }

      const averageStockLevel = totalProducts > 0 ? totalStock / totalProducts : 0;

      // Calculate stock turnover rate (simplified - would need sales data for accurate calculation)
      const stockTurnoverRate = this.calculateStockTurnoverRate();

      // Count alerts by type
      const alertsByType: Record<string, number> = {};
      for (const alert of this.alerts) {
        alertsByType[alert.alertType] = (alertsByType[alert.alertType] || 0) + 1;
      }

      const stats: InventoryStats = {
        totalProducts,
        totalStock,
        lowStockProducts,
        outOfStockProducts,
        overStockedProducts,
        totalValue,
        averageStockLevel,
        stockTurnoverRate,
        alertsByType,
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
          message: 'Failed to calculate inventory statistics',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  private calculateStockTurnoverRate(): number {
    // Simplified calculation based on transaction history
    // In a real system, this would use actual sales data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = this.transactions.filter(
      t => t.type === 'SALE' && t.createdAt >= thirtyDaysAgo
    );

    const totalSalesQuantity = recentSales.reduce((sum, t) => sum + t.quantity, 0);
    return totalSalesQuantity; // Simplified - would normally be sales/average inventory
  }

  // 批量操作
  async bulkAcknowledgeAlerts(
    alertIds: string[]
  ): Promise<ApiResponse<{ acknowledged: number; failed: number }>> {
    try {
      let acknowledged = 0;
      let failed = 0;

      for (const alertId of alertIds) {
        const result = await this.acknowledgeAlert(alertId);
        if (result.success) {
          acknowledged++;
        } else {
          failed++;
        }
      }

      return {
        success: true,
        data: { acknowledged, failed },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_ACKNOWLEDGE_ERROR',
          message: 'Failed to acknowledge alerts in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  async exportInventoryReport(): Promise<ApiResponse<string>> {
    try {
      const reportData = {
        exportDate: new Date().toISOString(),
        alerts: this.alerts,
        rules: this.rules,
        recentTransactions: this.transactions.slice(-100), // Last 100 transactions
        summary: {
          totalAlerts: this.alerts.length,
          activeAlerts: this.alerts.filter(a => !a.acknowledged).length,
          totalRules: this.rules.length,
          activeRules: this.rules.filter(r => r.isActive).length,
          totalTransactions: this.transactions.length,
        },
      };

      return {
        success: true,
        data: JSON.stringify(reportData, null, 2),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export inventory report',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  // ============================================================================
  // Plugin Integration Methods
  // ============================================================================

  /**
   * 通知插件库存变化
   */
  async notifyPluginStockChange(
    product: Product,
    previousStock: number,
    newStock: number,
    reason: string
  ): Promise<void> {
    try {
      const plugin = pluginManager.getPlugin(product.pluginId);
      if (plugin && plugin.updateProductStock) {
        await plugin.updateProductStock(product.id, newStock - previousStock);
        this.logger.debug(
          `Notified plugin ${product.pluginId} of stock change for product ${product.id}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to notify plugin ${product.pluginId} of stock change:`,
        error as Error
      );
    }
  }

  /**
   * 通过插件检查产品可用性
   */
  async checkPluginProductAvailability(
    product: Product
  ): Promise<{ available: boolean; reason?: string }> {
    try {
      const plugin = pluginManager.getPlugin(product.pluginId);
      if (plugin && plugin.checkProductAvailability) {
        const isAvailable = await plugin.checkProductAvailability(product.id);
        return { available: isAvailable };
      }

      // 如果插件没有实现可用性检查，基于库存判断
      return {
        available: (product.stock?.available || 0) > 0,
        reason: 'Stock-based availability check',
      };
    } catch (error) {
      this.logger.error(
        `Failed to check plugin availability for product ${product.id}:`,
        error as Error
      );
      return {
        available: false,
        reason: `Plugin availability check failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * 同步插件库存信息
   */
  async syncPluginStock(
    product: Product
  ): Promise<ApiResponse<{ synchronized: boolean; newStock?: number }>> {
    try {
      const plugin = pluginManager.getPlugin(product.pluginId);
      if (!plugin) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${product.pluginId} not found`,
          },
        };
      }

      // 检查插件是否支持库存查询
      if (plugin.getAvailableProducts) {
        const pluginProducts = await plugin.getAvailableProducts();
        const pluginProduct = pluginProducts.find(p => p.id === product.id);

        if (pluginProduct && pluginProduct.stock && product.stock) {
          const pluginStock = pluginProduct.stock.available;
          const currentStock = product.stock.available;

          if (pluginStock !== currentStock) {
            // 记录库存差异交易
            await this.recordTransaction({
              productId: product.id,
              type: 'ADJUSTMENT',
              quantity: pluginStock - currentStock,
              previousStock: currentStock,
              newStock: pluginStock,
              reason: 'Plugin sync adjustment',
              triggeredBy: 'system',
              metadata: {
                pluginId: product.pluginId,
                syncSource: 'plugin',
              },
            });

            return {
              success: true,
              data: { synchronized: true, newStock: pluginStock },
            };
          }
        }
      }

      return {
        success: true,
        data: { synchronized: false },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLUGIN_SYNC_ERROR',
          message: 'Failed to sync stock with plugin',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * 批量同步所有产品的插件库存
   */
  async syncAllPluginStock(
    products: Product[]
  ): Promise<ApiResponse<{ synchronized: number; errors: string[] }>> {
    try {
      let synchronized = 0;
      const errors: string[] = [];

      for (const product of products) {
        if (product.pluginId) {
          const result = await this.syncPluginStock(product);
          if (result.success && result.data?.synchronized) {
            synchronized++;
          } else if (!result.success) {
            errors.push(`${product.id}: ${result.error?.message || 'Unknown error'}`);
          }
        }
      }

      this.logger.info(
        `Plugin stock sync completed: ${synchronized} products synchronized, ${errors.length} errors`
      );

      return {
        success: true,
        data: { synchronized, errors },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BULK_PLUGIN_SYNC_ERROR',
          message: 'Failed to sync plugin stock in bulk',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * 为插件产品创建自动补货规则
   */
  async createPluginAutoRestockRule(
    productId: string,
    pluginId: string,
    threshold: number = 10,
    restockAmount: number = 50
  ): Promise<ApiResponse<InventoryRule>> {
    try {
      // 验证插件是否存在并支持自动补货
      const plugin = pluginManager.getPlugin(pluginId);
      if (!plugin) {
        return {
          success: false,
          error: {
            code: 'PLUGIN_NOT_FOUND',
            message: `Plugin ${pluginId} not found`,
          },
        };
      }

      const newRule: InventoryRule = {
        id: `plugin-restock-${productId}-${Date.now()}`,
        productId,
        ruleType: 'AUTO_RESTOCK',
        conditions: {
          lowStockThreshold: threshold,
          outOfStockAction: 'restock',
          autoRestockAmount: restockAmount,
        },
        isActive: true,
        createdAt: new Date(),
      };

      this.rules.push(newRule);

      this.logger.info(`Created auto-restock rule for plugin product ${productId}`);

      return {
        success: true,
        data: newRule,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CREATE_RULE_ERROR',
          message: 'Failed to create plugin auto-restock rule',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * 获取插件库存健康状态
   */
  async getPluginInventoryHealth(pluginId: string): Promise<
    ApiResponse<{
      totalProducts: number;
      healthyProducts: number;
      lowStockProducts: number;
      outOfStockProducts: number;
      syncErrors: number;
      lastSyncTime?: Date;
    }>
  > {
    try {
      // 获取该插件的所有产品（需要从外部传入）
      // 这里简化处理，实际应该从 ProductService 获取
      const pluginTransactions = this.transactions.filter(t => t.metadata?.pluginId === pluginId);

      const pluginAlerts = this.alerts.filter(alert => {
        // 通过交易记录关联找到插件相关的警报
        const relatedTransactions = this.transactions.filter(
          t => t.productId === alert.productId && t.metadata?.pluginId === pluginId
        );
        return relatedTransactions.length > 0;
      });

      // 计算同步错误
      const syncErrors = pluginTransactions.filter(
        t => t.reason?.includes('error') || t.reason?.includes('failed')
      ).length;

      // 获取最后同步时间
      const lastSyncTransaction = pluginTransactions
        .filter(t => t.reason?.includes('sync'))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      const healthData = {
        totalProducts: new Set(pluginTransactions.map(t => t.productId)).size,
        healthyProducts: 0, // 需要实际产品数据计算
        lowStockProducts: pluginAlerts.filter(a => a.alertType === 'LOW_STOCK').length,
        outOfStockProducts: pluginAlerts.filter(a => a.alertType === 'OUT_OF_STOCK').length,
        syncErrors,
        lastSyncTime: lastSyncTransaction?.createdAt,
      };

      return {
        success: true,
        data: healthData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PLUGIN_HEALTH_ERROR',
          message: 'Failed to get plugin inventory health',
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }
}

export const inventoryService = new InventoryService();
