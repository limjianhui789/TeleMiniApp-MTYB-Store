import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { requireAuth, checkPermission } from '../middleware/authMiddleware';
import { apiCacheMiddleware } from '../middleware/performanceMiddleware';
import { paymentService, PaymentMethod, PaymentStatus } from '../services/payment/PaymentService';

const router = express.Router();

// Create payment intent
router.post('/intent',
  requireAuth(),
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('paymentMethod').isIn(Object.values(PaymentMethod)).withMessage('Invalid payment method'),
    body('orderId').isUUID().withMessage('Valid order ID required'),
    body('metadata').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid payment data',
          details: errors.array()
        });
      }

      const { amount, currency, paymentMethod, orderId, metadata = {} } = req.body;
      
      // Add user context to metadata
      const enrichedMetadata = {
        ...metadata,
        userId: req.user!.id,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      };

      const paymentIntent = await paymentService.createPaymentIntent(
        amount,
        currency,
        paymentMethod,
        enrichedMetadata
      );

      res.json({
        success: true,
        data: {
          paymentId: paymentIntent.id,
          clientSecret: paymentIntent.clientSecret,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          expiresAt: paymentIntent.expiresAt
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'PAYMENT_INTENT_FAILED',
        message: error instanceof Error ? error.message : 'Failed to create payment intent'
      });
    }
  }
);

// Process payment
router.post('/process',
  requireAuth(),
  [
    body('paymentId').isUUID().withMessage('Valid payment ID required'),
    body('paymentDetails').isObject().withMessage('Payment details required'),
    body('paymentDetails.method').isIn(Object.values(PaymentMethod)),
    body('paymentDetails.cardNumber').optional().isString(),
    body('paymentDetails.expiryDate').optional().isString(),
    body('paymentDetails.cvv').optional().isString(),
    body('paymentDetails.paypalEmail').optional().isEmail(),
    body('paymentDetails.cryptoWallet').optional().isString()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid payment details',
          details: errors.array()
        });
      }

      const { paymentId, paymentDetails } = req.body;

      // Verify payment belongs to user
      const payment = paymentService.getPayment(paymentId);
      if (!payment || payment.metadata.userId !== req.user!.id) {
        return res.status(404).json({
          error: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found or access denied'
        });
      }

      const result = await paymentService.processPayment(paymentId, paymentDetails);

      if (result.success) {
        res.json({
          success: true,
          data: {
            paymentId: result.paymentId,
            transactionId: result.transactionId,
            status: result.status,
            amount: result.amount,
            currency: result.currency,
            receipt: result.receipt
          }
        });
      } else {
        res.status(400).json({
          error: 'PAYMENT_FAILED',
          message: result.error || 'Payment processing failed'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'PAYMENT_PROCESSING_ERROR',
        message: error instanceof Error ? error.message : 'Payment processing error'
      });
    }
  }
);

// Get payment status
router.get('/:paymentId/status',
  requireAuth(),
  [
    param('paymentId').isUUID().withMessage('Valid payment ID required')
  ],
  apiCacheMiddleware(60000), // Cache for 1 minute
  async (req, res) => {
    try {
      const { paymentId } = req.params;
      
      const payment = paymentService.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({
          error: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        });
      }

      // Check if user has access to this payment
      if (payment.metadata.userId !== req.user!.id && 
          !req.permissions?.hasPermission('payment', 'read')) {
        return res.status(403).json({
          error: 'ACCESS_DENIED',
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
          completedAt: payment.metadata.completedAt,
          failureReason: payment.metadata.failureReason
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'STATUS_CHECK_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check payment status'
      });
    }
  }
);

// Capture authorized payment
router.post('/:paymentId/capture',
  requireAuth(),
  checkPermission('payment', 'capture'),
  [
    param('paymentId').isUUID().withMessage('Valid payment ID required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be positive')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { paymentId } = req.params;
      const { amount } = req.body;

      const result = await paymentService.capturePayment(paymentId, amount);

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          error: 'CAPTURE_FAILED',
          message: result.error || 'Payment capture failed'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'CAPTURE_ERROR',
        message: error instanceof Error ? error.message : 'Payment capture error'
      });
    }
  }
);

// Refund payment
router.post('/:paymentId/refund',
  requireAuth(),
  checkPermission('payment', 'refund'),
  [
    param('paymentId').isUUID().withMessage('Valid payment ID required'),
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('reason').isLength({ min: 1, max: 500 }).withMessage('Reason is required'),
    body('metadata').optional().isObject()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { paymentId } = req.params;
      const { amount, reason, metadata } = req.body;

      const refundRequest = {
        paymentId,
        amount,
        reason,
        metadata: {
          ...metadata,
          refundedBy: req.user!.id,
          refundedAt: new Date()
        }
      };

      const result = await paymentService.refundPayment(refundRequest);

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          error: 'REFUND_FAILED',
          message: result.error || 'Payment refund failed'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'REFUND_ERROR',
        message: error instanceof Error ? error.message : 'Payment refund error'
      });
    }
  }
);

// Get payment history for user
router.get('/history',
  requireAuth(),
  apiCacheMiddleware(300000), // Cache for 5 minutes
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const { page = 1, limit = 20, status } = req.query;
      
      // Get all payments for user (in a real implementation, use database pagination)
      const allPayments = Array.from((paymentService as any).payments.values())
        .filter((payment: any) => payment.metadata.userId === userId);
      
      let filteredPayments = allPayments;
      
      if (status) {
        filteredPayments = allPayments.filter((payment: any) => payment.status === status);
      }
      
      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      const paginatedPayments = filteredPayments
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(startIndex, endIndex);

      res.json({
        success: true,
        data: {
          payments: paginatedPayments.map((payment: any) => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            paymentMethod: payment.paymentMethod,
            createdAt: payment.createdAt,
            completedAt: payment.metadata.completedAt
          })),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: filteredPayments.length,
            totalPages: Math.ceil(filteredPayments.length / Number(limit))
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'HISTORY_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get payment history'
      });
    }
  }
);

// Calculate developer earnings
router.post('/calculate-earnings',
  requireAuth(),
  checkPermission('payment', 'calculate_earnings'),
  [
    body('saleAmount').isFloat({ min: 0.01 }).withMessage('Sale amount must be positive'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('platformFeePercentage').optional().isFloat({ min: 0, max: 100 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { saleAmount, currency, platformFeePercentage = 30 } = req.body;

      const earnings = paymentService.calculateDeveloperEarnings(
        saleAmount,
        currency,
        platformFeePercentage
      );

      res.json({
        success: true,
        data: earnings
      });
    } catch (error) {
      res.status(500).json({
        error: 'CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to calculate earnings'
      });
    }
  }
);

// Process developer payout
router.post('/payout',
  requireAuth(),
  checkPermission('payment', 'payout'),
  [
    body('recipientId').isUUID().withMessage('Valid recipient ID required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
    body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('method').isIn(['bank_transfer', 'paypal', 'crypto']).withMessage('Invalid payout method'),
    body('destination').isObject().withMessage('Destination details required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const payoutRequest = {
        ...req.body,
        metadata: {
          initiatedBy: req.user!.id,
          initiatedAt: new Date()
        }
      };

      const result = await paymentService.processPayout(payoutRequest);

      if (result.success) {
        res.json({
          success: true,
          data: result
        });
      } else {
        res.status(400).json({
          error: 'PAYOUT_FAILED',
          message: result.error || 'Payout processing failed'
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'PAYOUT_ERROR',
        message: error instanceof Error ? error.message : 'Payout processing error'
      });
    }
  }
);

// Get payment analytics (admin/moderator only)
router.get('/analytics',
  requireAuth(),
  checkPermission('analytics', 'read'),
  [
    param('startDate').optional().isISO8601().withMessage('Invalid start date'),
    param('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  apiCacheMiddleware(600000), // Cache for 10 minutes
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const period = {
        start: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate ? new Date(endDate as string) : new Date()
      };

      const analytics = paymentService.getPaymentAnalytics(period);

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      res.status(500).json({
        error: 'ANALYTICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get payment analytics'
      });
    }
  }
);

// Get supported payment methods
router.get('/methods',
  apiCacheMiddleware(3600000), // Cache for 1 hour
  async (req, res) => {
    try {
      const methods = Object.values(PaymentMethod).map(method => ({
        id: method,
        name: method.replace('_', ' ').toUpperCase(),
        enabled: true, // In real implementation, check configuration
        currencies: ['USD', 'EUR', 'GBP'] // In real implementation, get from provider
      }));

      res.json({
        success: true,
        data: { methods }
      });
    } catch (error) {
      res.status(500).json({
        error: 'METHODS_ERROR',
        message: 'Failed to get payment methods'
      });
    }
  }
);

// Webhook endpoint for payment providers
router.post('/webhook/:provider',
  [
    param('provider').isIn(['stripe', 'paypal', 'crypto']).withMessage('Invalid provider')
  ],
  async (req, res) => {
    try {
      const { provider } = req.params;
      const payload = req.body;
      
      // Verify webhook signature (implementation depends on provider)
      // In a real implementation, each provider has different signature verification
      
      console.log(`Received webhook from ${provider}:`, payload);
      
      // Process webhook based on provider
      // This would update payment status based on provider notifications
      
      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        error: 'WEBHOOK_ERROR',
        message: 'Failed to process webhook'
      });
    }
  }
);

export default router;