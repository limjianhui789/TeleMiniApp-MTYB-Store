import type { Order, OrderItem, Product } from '../../types';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../types';
import { paymentService } from '../payment/PaymentService';
import { globalEventEmitter } from '../../core/utils/EventEmitter';
import { PAYMENT_EVENTS } from '../../core/constants';
import { productService } from '../product/ProductService';

export interface CreateOrderRequest {
  userId: string;
  items: CreateOrderItemRequest[];
  paymentMethod: PaymentMethod;
  currency?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
  customData?: Record<string, any>;
}

export interface OrderStats {
  total: number;
  byStatus: Record<OrderStatus, number>;
  totalRevenue: number;
  averageOrderValue: number;
}

export class OrderService {
  private orders: Map<string, Order> = new Map();
  private ordersByUser: Map<string, string[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      this.validateOrderRequest(request);

      const orderItems = await this.buildOrderItems(request.items);
      const totalAmount = this.calculateTotalAmount(orderItems);

      const order: Order = {
        id: this.generateOrderId(),
        userId: request.userId,
        items: orderItems,
        totalAmount,
        currency: request.currency || 'MYR',
        status: OrderStatus.PENDING,
        paymentMethod: request.paymentMethod,
        ...(request.notes && { notes: request.notes }),
        metadata: request.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.orders.set(order.id, order);
      this.addToUserOrders(request.userId, order.id);

      console.log(`Order created: ${order.id} for user ${request.userId}`);

      return order;
    } catch (error) {
      console.error('Order creation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create order');
    }
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const orderIds = this.ordersByUser.get(userId) || [];
    return orderIds
      .map(id => this.orders.get(id))
      .filter((order): order is Order => order !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, metadata?: any): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return false;
    }

    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();

    if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    if (metadata) {
      order.metadata = { ...order.metadata, ...metadata };
    }

    this.orders.set(orderId, order);

    if (oldStatus !== status) {
      await this.handleOrderStatusChange(order, oldStatus);
    }

    return true;
  }

  async initiatePayment(
    orderId: string
  ): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== OrderStatus.PENDING) {
      return { success: false, error: 'Order is not in pending status' };
    }

    try {
      const paymentResponse = await paymentService.createPayment({
        orderId: order.id,
        amount: order.totalAmount,
        currency: order.currency,
        method: order.paymentMethod! as PaymentMethod,
        returnUrl: `${window.location.origin}/orders/${order.id}/success`,
        cancelUrl: `${window.location.origin}/orders/${order.id}/cancel`,
        metadata: {
          userId: order.userId,
          itemCount: order.items.length,
        },
      });

      if (paymentResponse.success && paymentResponse.paymentId) {
        order.paymentId = paymentResponse.paymentId;
        order.status = OrderStatus.PROCESSING;
        order.updatedAt = new Date();
        this.orders.set(orderId, order);

        return {
          success: true,
          ...(paymentResponse.redirectUrl && { redirectUrl: paymentResponse.redirectUrl }),
        };
      } else {
        return {
          success: false,
          error: paymentResponse.error || 'Payment creation failed',
        };
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment initiation failed',
      };
    }
  }

  async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order) {
      return false;
    }

    if (order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
      return false;
    }

    if (order.paymentId) {
      const payment = await paymentService.getPayment(order.paymentId);
      if (payment && payment.status === PaymentStatus.COMPLETED) {
        const refunded = await paymentService.refundPayment(order.paymentId);
        if (!refunded) {
          console.error(`Failed to refund payment for order ${orderId}`);
          return false;
        }
      }
    }

    const metadata = reason ? { ...order.metadata, cancellationReason: reason } : order.metadata;
    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED, metadata);
  }

  async getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getOrderStats(): Promise<OrderStats> {
    const orders = Array.from(this.orders.values());

    const stats: OrderStats = {
      total: orders.length,
      byStatus: {
        [OrderStatus.PENDING]: 0,
        [OrderStatus.PROCESSING]: 0,
        [OrderStatus.COMPLETED]: 0,
        [OrderStatus.FAILED]: 0,
        [OrderStatus.CANCELLED]: 0,
        [OrderStatus.REFUNDED]: 0,
      },
      totalRevenue: 0,
      averageOrderValue: 0,
    };

    for (const order of orders) {
      stats.byStatus[order.status]++;

      if (order.status === OrderStatus.COMPLETED) {
        stats.totalRevenue += order.totalAmount;
      }
    }

    const completedOrders = stats.byStatus[OrderStatus.COMPLETED];
    stats.averageOrderValue = completedOrders > 0 ? stats.totalRevenue / completedOrders : 0;

    return stats;
  }

  private async buildOrderItems(itemRequests: CreateOrderItemRequest[]): Promise<OrderItem[]> {
    const orderItems: OrderItem[] = [];

    for (const itemRequest of itemRequests) {
      const product = await this.getProduct(itemRequest.productId);
      if (!product) {
        throw new Error(`Product not found: ${itemRequest.productId}`);
      }

      if (!product.isActive) {
        throw new Error(`Product is not active: ${product.name}`);
      }

      if (product.stock !== undefined && product.stock.available < itemRequest.quantity) {
        throw new Error(`Insufficient stock for product: ${product.name}`);
      }

      const unitPrice = product.price;
      const totalPrice = unitPrice * itemRequest.quantity;

      const orderItem: OrderItem = {
        id: this.generateOrderItemId(),
        productId: product.id,
        product,
        quantity: itemRequest.quantity,
        unitPrice,
        totalPrice,
        ...(itemRequest.customData && { deliveryData: itemRequest.customData }),
        status: OrderStatus.PENDING,
      };

      orderItems.push(orderItem);
    }

    return orderItems;
  }

  private calculateTotalAmount(items: OrderItem[]): number {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  }

  private validateOrderRequest(request: CreateOrderRequest): void {
    if (!request.userId) {
      throw new Error('User ID is required');
    }

    if (!request.items || request.items.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    for (const item of request.items) {
      if (!item.productId) {
        throw new Error('Product ID is required for all items');
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error('Valid quantity is required for all items');
      }
    }
  }

  private addToUserOrders(userId: string, orderId: string): void {
    const userOrders = this.ordersByUser.get(userId) || [];
    userOrders.push(orderId);
    this.ordersByUser.set(userId, userOrders);
  }

  private async getProduct(productId: string): Promise<Product | null> {
    try {
      const result = await productService.getProduct(productId);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get product ${productId}:`, error);
      return null;
    }
  }

  private generateOrderId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ord_${timestamp}_${random}`;
  }

  private generateOrderItemId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 3);
    return `itm_${timestamp}_${random}`;
  }

  private setupEventListeners(): void {
    globalEventEmitter.on(PAYMENT_EVENTS.PAYMENT_COMPLETED, async data => {
      const { payment } = data;
      if (payment.orderId) {
        await this.updateOrderStatus(payment.orderId, OrderStatus.COMPLETED);
      }
    });

    globalEventEmitter.on(PAYMENT_EVENTS.PAYMENT_FAILED, async data => {
      const { payment } = data;
      if (payment.orderId) {
        await this.updateOrderStatus(payment.orderId, OrderStatus.FAILED);
      }
    });

    globalEventEmitter.on(PAYMENT_EVENTS.PAYMENT_CANCELLED, async data => {
      const { payment } = data;
      if (payment.orderId) {
        await this.updateOrderStatus(payment.orderId, OrderStatus.CANCELLED);
      }
    });

    globalEventEmitter.on(PAYMENT_EVENTS.PAYMENT_REFUNDED, async data => {
      const { payment } = data;
      if (payment.orderId) {
        await this.updateOrderStatus(payment.orderId, OrderStatus.REFUNDED);
      }
    });
  }

  private async handleOrderStatusChange(order: Order, oldStatus: OrderStatus): Promise<void> {
    console.log(`Order ${order.id} status changed from ${oldStatus} to ${order.status}`);

    switch (order.status) {
      case OrderStatus.COMPLETED:
        await this.processCompletedOrder(order);
        break;
      case OrderStatus.FAILED:
        await this.processFailedOrder(order);
        break;
      case OrderStatus.CANCELLED:
        await this.processCancelledOrder(order);
        break;
    }
  }

  private async processCompletedOrder(order: Order): Promise<void> {
    console.log(`Processing completed order: ${order.id}`);
  }

  private async processFailedOrder(order: Order): Promise<void> {
    console.log(`Processing failed order: ${order.id}`);
  }

  private async processCancelledOrder(order: Order): Promise<void> {
    console.log(`Processing cancelled order: ${order.id}`);
  }
}

export const orderService = new OrderService();
