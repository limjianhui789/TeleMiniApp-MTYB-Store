// ============================================================================
// Cart Service Unit Tests
// ============================================================================

import { cartService } from '../product/CartService';
import type { EnhancedCartItem, CartDiscount } from '../product/CartService';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock product service
jest.mock('../product/ProductService', () => ({
  productService: {
    getProduct: jest.fn(),
    getAllProducts: jest.fn(),
  },
}));

import { productService } from '../product/ProductService';

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('addToCart', () => {
    it('should add new item to empty cart', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      (productService.getProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'product_1',
          name: 'Test Product',
          price: 50.0,
          description: 'Test description',
          category: 'test',
          image: 'test.jpg',
          inStock: true,
          stockQuantity: 10,
        },
      });

      const result = await cartService.addToCart('product_1', 2);

      expect(result.success).toBe(true);
      expect(result.item).toBeDefined();
      expect(result.item?.quantity).toBe(2);
      expect(result.item?.product.name).toBe('Test Product');
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should increase quantity for existing item', async () => {
      const existingCart = [
        {
          id: 'product_1',
          quantity: 1,
          addedAt: new Date().toISOString(),
          product: {
            id: 'product_1',
            name: 'Test Product',
            price: 50.0,
            description: 'Test description',
            category: 'test',
            image: 'test.jpg',
            inStock: true,
            stockQuantity: 10,
          },
          subtotal: 50.0,
          isSelected: true,
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingCart));

      (productService.getProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: existingCart[0].product,
      });

      const result = await cartService.addToCart('product_1', 2);

      expect(result.success).toBe(true);
      expect(result.item?.quantity).toBe(3); // 1 + 2
    });

    it('should handle out of stock products', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      (productService.getProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'product_1',
          name: 'Out of Stock Product',
          price: 50.0,
          description: 'Test description',
          category: 'test',
          image: 'test.jpg',
          inStock: false,
          stockQuantity: 0,
        },
      });

      const result = await cartService.addToCart('product_1', 1);

      expect(result.success).toBe(false);
      expect(result.error).toContain('out of stock');
    });

    it('should handle quantity exceeding stock', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      (productService.getProduct as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          id: 'product_1',
          name: 'Limited Stock Product',
          price: 50.0,
          description: 'Test description',
          category: 'test',
          image: 'test.jpg',
          inStock: true,
          stockQuantity: 5,
        },
      });

      const result = await cartService.addToCart('product_1', 10);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only 5 items available');
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const existingCart = [
        {
          id: 'product_1',
          quantity: 2,
          addedAt: new Date().toISOString(),
          product: {
            id: 'product_1',
            name: 'Test Product',
            price: 50.0,
            description: 'Test description',
            category: 'test',
            image: 'test.jpg',
            inStock: true,
            stockQuantity: 10,
          },
          subtotal: 100.0,
          isSelected: true,
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingCart));

      const result = await cartService.removeFromCart('product_1');

      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cart_items', JSON.stringify([]));
    });

    it('should handle removing non-existent item', async () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));

      const result = await cartService.removeFromCart('non_existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found in cart');
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const existingCart = [
        {
          id: 'product_1',
          quantity: 2,
          addedAt: new Date().toISOString(),
          product: {
            id: 'product_1',
            name: 'Test Product',
            price: 50.0,
            description: 'Test description',
            category: 'test',
            image: 'test.jpg',
            inStock: true,
            stockQuantity: 10,
          },
          subtotal: 100.0,
          isSelected: true,
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingCart));

      const result = await cartService.updateQuantity('product_1', 5);

      expect(result.success).toBe(true);
      expect(result.item?.quantity).toBe(5);
      expect(result.item?.subtotal).toBe(250.0); // 50 * 5
    });

    it('should remove item when quantity is 0', async () => {
      const existingCart = [
        {
          id: 'product_1',
          quantity: 2,
          addedAt: new Date().toISOString(),
          product: {
            id: 'product_1',
            name: 'Test Product',
            price: 50.0,
            description: 'Test description',
            category: 'test',
            image: 'test.jpg',
            inStock: true,
            stockQuantity: 10,
          },
          subtotal: 100.0,
          isSelected: true,
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingCart));

      const result = await cartService.updateQuantity('product_1', 0);

      expect(result.success).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('cart_items', JSON.stringify([]));
    });
  });

  describe('getCartSummary', () => {
    it('should calculate cart summary correctly', async () => {
      const mockCart = [
        {
          id: 'product_1',
          quantity: 2,
          addedAt: new Date().toISOString(),
          product: {
            id: 'product_1',
            name: 'Product 1',
            price: 50.0,
            description: 'Test description',
            category: 'test',
            image: 'test.jpg',
            inStock: true,
            stockQuantity: 10,
          },
          subtotal: 100.0,
          isSelected: true,
        },
        {
          id: 'product_2',
          quantity: 1,
          addedAt: new Date().toISOString(),
          product: {
            id: 'product_2',
            name: 'Product 2',
            price: 30.0,
            description: 'Test description',
            category: 'test',
            image: 'test.jpg',
            inStock: true,
            stockQuantity: 5,
          },
          subtotal: 30.0,
          isSelected: true,
        },
      ];

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCart));

      const summary = await cartService.getCartSummary();

      expect(summary.totalItems).toBe(3); // 2 + 1
      expect(summary.uniqueItems).toBe(2);
      expect(summary.subtotal).toBe(130.0); // 100 + 30
      expect(summary.estimatedTax).toBe(7.8); // 6% of 130
      expect(summary.total).toBe(137.8); // 130 + 7.80
    });

    it('should handle empty cart', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const summary = await cartService.getCartSummary();

      expect(summary.totalItems).toBe(0);
      expect(summary.uniqueItems).toBe(0);
      expect(summary.subtotal).toBe(0);
      expect(summary.total).toBe(0);
    });

    it('should apply discounts correctly', async () => {
      const mockCart = [
        {
          id: 'product_1',
          quantity: 2,
          addedAt: new Date().toISOString(),
          product: {
            id: 'product_1',
            name: 'Product 1',
            price: 100.0,
            description: 'Test description',
            category: 'test',
            image: 'test.jpg',
            inStock: true,
            stockQuantity: 10,
          },
          subtotal: 200.0,
          isSelected: true,
        },
      ];

      const mockDiscount: CartDiscount = {
        id: 'discount_1',
        code: 'SAVE10',
        type: 'percentage',
        value: 10,
        description: '10% off',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockCart));

      const summary = await cartService.getCartSummary([mockDiscount]);

      expect(summary.subtotal).toBe(200.0);
      expect(summary.discount).toBe(20.0); // 10% of 200
      expect(summary.discountedSubtotal).toBe(180.0); // 200 - 20
      expect(summary.total).toBe(190.8); // 180 + 6% tax
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const result = await cartService.clearCart();

      expect(result.success).toBe(true);
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('cart_items');
    });
  });
});
