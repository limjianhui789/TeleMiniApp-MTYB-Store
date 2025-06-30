// ============================================================================
// Payment Service Unit Tests
// ============================================================================

import { paymentService } from '../payment/PaymentService';
import { PaymentMethod, PaymentStatus } from '../../types';
import type { PaymentRequest } from '../../types';

// Mock fetch for testing
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('PaymentService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('createPayment', () => {
    it('should create payment successfully with valid request', async () => {
      const mockResponse = {
        success: true,
        paymentId: 'pay_test_123',
        redirectUrl: 'https://payment.gateway.com/redirect',
        status: PaymentStatus.PENDING
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const paymentRequest: PaymentRequest = {
        orderId: 'order_123',
        amount: 100.00,
        currency: 'MYR',
        method: PaymentMethod.CURLEC
      };

      const result = await paymentService.createPayment(paymentRequest);

      expect(result.success).toBe(true);
      expect(result.paymentId).toBe('pay_test_123');
      expect(result.redirectUrl).toBe('https://payment.gateway.com/redirect');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/payments'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"orderId":"order_123"')
        })
      );
    });

    it('should handle payment creation failure', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Invalid payment details'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockErrorResponse
      });

      const paymentRequest: PaymentRequest = {
        orderId: 'order_123',
        amount: -10.00, // Invalid amount
        currency: 'MYR',
        paymentMethod: PaymentMethod.CURLEC,
        customerEmail: 'invalid-email',
        customerPhone: '123',
        description: 'Test payment'
      };

      const result = await paymentService.createPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid payment details');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const paymentRequest: PaymentRequest = {
        orderId: 'order_123',
        amount: 100.00,
        currency: 'MYR',
        method: PaymentMethod.CURLEC
      };

      const result = await paymentService.createPayment(paymentRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('syncPaymentStatus', () => {
    it('should sync payment status successfully', async () => {
      // First create a payment to sync
      const mockCreateResponse = {
        success: true,
        paymentId: 'pay_test_123'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreateResponse
      });

      const paymentRequest: PaymentRequest = {
        orderId: 'order_123',
        amount: 100.00,
        currency: 'MYR',
        method: PaymentMethod.CURLEC
      };

      await paymentService.createPayment(paymentRequest);

      // Mock the gateway status response
      const mockStatusResponse = {
        id: 'pay_test_123',
        status: 'completed'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatusResponse
      });

      const result = await paymentService.syncPaymentStatus('pay_test_123');

      expect(result).toBe(PaymentStatus.COMPLETED);
    });

    it('should return null for non-existent payment', async () => {
      const result = await paymentService.syncPaymentStatus('invalid_id');
      expect(result).toBeNull();
    });
  });

  describe('payment validation (through createPayment)', () => {
    it('should reject missing order ID', async () => {
      const invalidRequest: PaymentRequest = {
        orderId: '',
        amount: 100.00,
        currency: 'MYR',
        method: PaymentMethod.CURLEC
      };

      const result = await paymentService.createPayment(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order ID is required');
    });

    it('should reject invalid amount', async () => {
      const invalidRequest: PaymentRequest = {
        orderId: 'order_123',
        amount: 0,
        currency: 'MYR',
        method: PaymentMethod.CURLEC
      };

      const result = await paymentService.createPayment(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Valid amount is required');
    });

    it('should reject missing currency', async () => {
      const invalidRequest: PaymentRequest = {
        orderId: 'order_123',
        amount: 100.00,
        currency: '',
        method: PaymentMethod.CURLEC
      };

      const result = await paymentService.createPayment(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Currency is required');
    });
  });
});