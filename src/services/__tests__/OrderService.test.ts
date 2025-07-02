// ============================================================================
// Order Service Unit Tests
// ============================================================================

import { orderService } from '../order/OrderService';
import { OrderStatus, PaymentMethod } from '../../types';
import type { CreateOrderRequest, Order } from '../../types';

// Mock dependencies
jest.mock('../product/ProductService', () => ({
  productService: {
    getProduct: jest.fn(),
  },
}));

import { productService } from '../product/ProductService';

describe('OrderService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully with valid request', async () => {
      // Mock product service responses
      (productService.getProduct as jest.Mock)
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'product_1',
            name: 'Test Product 1',
            price: 50.0,
            category: 'test',
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 'product_2',
            name: 'Test Product 2',
            price: 30.0,
            category: 'test',
          },
        });

      const orderRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [
          { productId: 'product_1', quantity: 2, price: 50.0 },
          { productId: 'product_2', quantity: 1, price: 30.0 },
        ],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      const result = await orderService.createOrder(orderRequest);

      expect(result.id).toBeDefined();
      expect(result.userId).toBe('user_123');
      expect(result.items).toHaveLength(2);
      expect(result.totalAmount).toBe(130.0); // (50*2) + (30*1)
      expect(result.status).toBe(OrderStatus.PENDING);
      expect(result.currency).toBe('MYR');
      expect(result.paymentMethod).toBe('CURLEC');
    });

    it('should handle missing products gracefully', async () => {
      (productService.getProduct as jest.Mock).mockResolvedValueOnce({
        success: false,
        error: 'Product not found',
      });

      const orderRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [{ productId: 'invalid_product', quantity: 1, price: 50.0 }],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      await expect(orderService.createOrder(orderRequest)).rejects.toThrow(
        'Product invalid_product not found'
      );
    });

    it('should validate order request', async () => {
      const invalidRequest: CreateOrderRequest = {
        userId: '',
        items: [],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      await expect(orderService.createOrder(invalidRequest)).rejects.toThrow('User ID is required');
    });

    it('should calculate total amount correctly', async () => {
      (productService.getProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'product_1',
          name: 'Test Product',
          price: 25.99,
          category: 'test',
        },
      });

      const orderRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [{ productId: 'product_1', quantity: 3, price: 25.99 }],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      const result = await orderService.createOrder(orderRequest);

      expect(result.totalAmount).toBe(77.97); // 25.99 * 3
    });
  });

  describe('getOrder', () => {
    it('should retrieve existing order', async () => {
      // First create an order
      (productService.getProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'product_1',
          name: 'Test Product',
          price: 50.0,
          category: 'test',
        },
      });

      const orderRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [{ productId: 'product_1', quantity: 1, price: 50.0 }],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      const createdOrder = await orderService.createOrder(orderRequest);

      // Then retrieve it
      const retrievedOrder = await orderService.getOrder(createdOrder.id);

      expect(retrievedOrder).toEqual(createdOrder);
    });

    it('should throw error for non-existent order', async () => {
      await expect(orderService.getOrder('invalid_order_id')).rejects.toThrow('Order not found');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      // First create an order
      (productService.getProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'product_1',
          name: 'Test Product',
          price: 50.0,
          category: 'test',
        },
      });

      const orderRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [{ productId: 'product_1', quantity: 1, price: 50.0 }],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      const order = await orderService.createOrder(orderRequest);

      // Update status
      const updatedOrder = await orderService.updateOrderStatus(order.id, OrderStatus.CONFIRMED);

      expect(updatedOrder.status).toBe(OrderStatus.CONFIRMED);
      expect(updatedOrder.updatedAt).toBeDefined();
    });

    it('should throw error for invalid order ID', async () => {
      await expect(
        orderService.updateOrderStatus('invalid_id', OrderStatus.CONFIRMED)
      ).rejects.toThrow('Order not found');
    });
  });

  describe('validateOrderRequest', () => {
    it('should validate correct order request', () => {
      const validRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [{ productId: 'product_1', quantity: 1, price: 50.0 }],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      expect(() => {
        (orderService as any).validateOrderRequest(validRequest);
      }).not.toThrow();
    });

    it('should reject empty user ID', () => {
      const invalidRequest: CreateOrderRequest = {
        userId: '',
        items: [{ productId: 'product_1', quantity: 1, price: 50.0 }],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      expect(() => {
        (orderService as any).validateOrderRequest(invalidRequest);
      }).toThrow('User ID is required');
    });

    it('should reject empty items array', () => {
      const invalidRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      expect(() => {
        (orderService as any).validateOrderRequest(invalidRequest);
      }).toThrow('Order must contain at least one item');
    });

    it('should reject invalid quantities', () => {
      const invalidRequest: CreateOrderRequest = {
        userId: 'user_123',
        items: [{ productId: 'product_1', quantity: 0, price: 50.0 }],
        paymentMethod: PaymentMethod.CURLEC,
        currency: 'MYR',
      };

      expect(() => {
        (orderService as any).validateOrderRequest(invalidRequest);
      }).toThrow('Item quantity must be greater than 0');
    });
  });
});
