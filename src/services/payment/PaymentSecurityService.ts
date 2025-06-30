import type { Payment, PaymentRequest } from '../../types';

export interface SecurityConfig {
  maxPaymentAmount: number;
  maxDailyAmount: number;
  maxPaymentsPerHour: number;
  blacklistedIPs: string[];
  enableRateLimit: boolean;
  enableAmountValidation: boolean;
  enableDuplicateProtection: boolean;
  duplicateWindowMs: number;
}

export interface RateLimitInfo {
  count: number;
  windowStart: number;
  blocked: boolean;
}

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskScore: number;
}

export interface DuplicatePayment {
  orderId: string;
  amount: number;
  timestamp: number;
}

export interface AuditLogEntry {
  id: string;
  type: 'payment_created' | 'payment_updated' | 'security_violation' | 'webhook_received';
  paymentId?: string;
  orderId?: string;
  userId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class PaymentSecurityService {
  private config: SecurityConfig;
  private rateLimits: Map<string, RateLimitInfo> = new Map();
  private dailyAmounts: Map<string, { amount: number; date: string }> = new Map();
  private recentPayments: Map<string, DuplicatePayment> = new Map();
  private auditLog: AuditLogEntry[] = [];
  // private _encryptionKey: string; // Reserved for future use

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      maxPaymentAmount: 10000,
      maxDailyAmount: 50000,
      maxPaymentsPerHour: 10,
      blacklistedIPs: [],
      enableRateLimit: true,
      enableAmountValidation: true,
      enableDuplicateProtection: true,
      duplicateWindowMs: 5 * 60 * 1000,
      ...config,
    };

    // Initialize encryption if needed in the future
    this.generateEncryptionKey();
    this.setupCleanupIntervals();
  }

  validatePaymentRequest(
    request: PaymentRequest,
    userContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): SecurityValidationResult {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      riskScore: 0,
    };

    if (this.config.enableAmountValidation) {
      this.validateAmount(request, result);
    }

    if (this.config.enableRateLimit && userContext?.userId) {
      this.validateRateLimit(userContext.userId, result);
    }

    if (this.config.enableDuplicateProtection) {
      this.validateDuplicatePayment(request, result);
    }

    if (userContext?.ipAddress) {
      this.validateIPAddress(userContext.ipAddress, result);
    }

    this.validateDailyLimit(userContext?.userId, request.amount, result);

    result.isValid = result.errors.length === 0;
    result.riskScore = this.calculateRiskScore(request, userContext, result);

    if (result.riskScore > 7 || result.errors.length > 0) {
      this.logSecurityEvent(
        'security_violation',
        {
          request,
          userContext,
          validationResult: result,
        },
        'high'
      );
    }

    return result;
  }

  async verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      if (!signature || !payload || !secret) {
        this.logSecurityEvent(
          'security_violation',
          {
            type: 'webhook_verification_failed',
            reason: 'missing_parameters',
          },
          'high'
        );
        return false;
      }

      // Use Web Crypto API for browser compatibility
      const encoder = new TextEncoder();
      const keyData = encoder.encode(secret);
      const messageData = encoder.encode(payload);

      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const providedSignature = signature.replace('sha256=', '');
      const isValid = expectedSignature === providedSignature;

      if (!isValid) {
        this.logSecurityEvent(
          'security_violation',
          {
            type: 'webhook_signature_mismatch',
            payloadLength: payload.length,
          },
          'critical'
        );
      }

      return isValid;
    } catch (error) {
      this.logSecurityEvent(
        'security_violation',
        {
          type: 'webhook_verification_error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'high'
      );
      return false;
    }
  }

  async encryptSensitiveData(data: Record<string, any>): Promise<string> {
    try {
      // For browser compatibility, use a simple base64 encoding
      // In production, use proper encryption with Web Crypto API
      const jsonString = JSON.stringify(data);
      return btoa(jsonString);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  async decryptSensitiveData(encryptedData: string): Promise<Record<string, any>> {
    try {
      // For browser compatibility, use base64 decoding
      // In production, use proper decryption with Web Crypto API
      const jsonString = atob(encryptedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  logPaymentEvent(
    type: 'payment_created' | 'payment_updated',
    payment: Payment,
    userContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): void {
    this.logSecurityEvent(
      type,
      {
        paymentId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
      },
      'low',
      userContext
    );
  }

  logWebhookEvent(paymentId: string, orderId: string, eventType: string, success: boolean): void {
    this.logSecurityEvent(
      'webhook_received',
      {
        paymentId,
        orderId,
        eventType,
        success,
      },
      success ? 'low' : 'medium'
    );
  }

  getAuditLog(limit?: number): AuditLogEntry[] {
    const sortedLog = this.auditLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? sortedLog.slice(0, limit) : sortedLog;
  }

  getSecurityStats(): {
    totalAuditEntries: number;
    securityViolations: number;
    blockedPayments: number;
    riskDistribution: Record<string, number>;
  } {
    const violations = this.auditLog.filter(entry => entry.type === 'security_violation').length;

    const blockedPayments = this.auditLog.filter(
      entry =>
        entry.type === 'security_violation' && entry.details.validationResult?.errors?.length > 0
    ).length;

    const riskDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const entry of this.auditLog) {
      riskDistribution[entry.severity]++;
    }

    return {
      totalAuditEntries: this.auditLog.length,
      securityViolations: violations,
      blockedPayments,
      riskDistribution,
    };
  }

  private validateAmount(request: PaymentRequest, result: SecurityValidationResult): void {
    if (request.amount <= 0) {
      result.errors.push('Payment amount must be positive');
      result.riskScore += 5;
    }

    if (request.amount > this.config.maxPaymentAmount) {
      result.errors.push(
        `Payment amount exceeds maximum allowed (${this.config.maxPaymentAmount})`
      );
      result.riskScore += 8;
    }

    if (request.amount > 5000) {
      result.warnings.push('Large payment amount detected');
      result.riskScore += 2;
    }
  }

  private validateRateLimit(userId: string, result: SecurityValidationResult): void {
    const now = Date.now();
    const windowStart = now - 60 * 60 * 1000;

    let rateLimitInfo = this.rateLimits.get(userId);

    if (!rateLimitInfo || rateLimitInfo.windowStart < windowStart) {
      rateLimitInfo = {
        count: 1,
        windowStart: now,
        blocked: false,
      };
    } else {
      rateLimitInfo.count++;
    }

    if (rateLimitInfo.count > this.config.maxPaymentsPerHour) {
      result.errors.push('Payment rate limit exceeded');
      result.riskScore += 10;
      rateLimitInfo.blocked = true;
    } else if (rateLimitInfo.count > this.config.maxPaymentsPerHour * 0.8) {
      result.warnings.push('Approaching payment rate limit');
      result.riskScore += 3;
    }

    this.rateLimits.set(userId, rateLimitInfo);
  }

  private validateDuplicatePayment(
    request: PaymentRequest,
    result: SecurityValidationResult
  ): void {
    const key = `${request.orderId}_${request.amount}`;
    const existing = this.recentPayments.get(key);
    const now = Date.now();

    if (existing && now - existing.timestamp < this.config.duplicateWindowMs) {
      result.errors.push('Duplicate payment detected');
      result.riskScore += 10;
    } else {
      this.recentPayments.set(key, {
        orderId: request.orderId,
        amount: request.amount,
        timestamp: now,
      });
    }
  }

  private validateIPAddress(ipAddress: string, result: SecurityValidationResult): void {
    if (this.config.blacklistedIPs.includes(ipAddress)) {
      result.errors.push('Payment from blacklisted IP address');
      result.riskScore += 10;
    }
  }

  private validateDailyLimit(
    userId: string | undefined,
    amount: number,
    result: SecurityValidationResult
  ): void {
    if (!userId) return;

    const validUserId: string = userId; // Type narrowing
    const today: string = new Date().toISOString().split('T')[0]!;
    const dailyData = this.dailyAmounts.get(validUserId);

    let totalAmount = amount;
    if (dailyData && dailyData.date === today) {
      totalAmount += dailyData.amount;
    }

    if (totalAmount > this.config.maxDailyAmount) {
      result.errors.push(`Daily payment limit exceeded (${this.config.maxDailyAmount})`);
      result.riskScore += 8;
    } else if (totalAmount > this.config.maxDailyAmount * 0.8) {
      result.warnings.push('Approaching daily payment limit');
      result.riskScore += 2;
    }

    this.dailyAmounts.set(validUserId, { amount: totalAmount, date: today });
  }

  private calculateRiskScore(
    request: PaymentRequest,
    userContext?: { userId?: string; ipAddress?: string; userAgent?: string },
    result?: SecurityValidationResult
  ): number {
    let score = result?.riskScore || 0;

    if (request.amount > 1000) score += 1;
    if (request.amount > 5000) score += 2;
    if (!userContext?.userId) score += 3;
    if (!userContext?.userAgent) score += 1;

    return Math.min(score, 10);
  }

  private logSecurityEvent(
    type: AuditLogEntry['type'],
    details: Record<string, any>,
    severity: AuditLogEntry['severity'],
    userContext?: { userId?: string; ipAddress?: string; userAgent?: string }
  ): void {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      type,
      ...(details.paymentId && { paymentId: details.paymentId }),
      ...(details.orderId && { orderId: details.orderId }),
      ...((userContext?.userId || details.userId) && {
        userId: userContext?.userId || details.userId,
      }),
      details,
      ...(userContext?.ipAddress && { ipAddress: userContext.ipAddress }),
      ...(userContext?.userAgent && { userAgent: userContext.userAgent }),
      timestamp: new Date(),
      severity,
    };

    this.auditLog.push(entry);

    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
  }

  private generateEncryptionKey(): string {
    // In a real application, this should come from environment variables
    return 'default-key-change-in-production';
  }

  private generateAuditId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `audit_${timestamp}_${random}`;
  }

  private setupCleanupIntervals(): void {
    setInterval(
      () => {
        this.cleanupExpiredData();
      },
      60 * 60 * 1000
    );
  }

  private cleanupExpiredData(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    for (const [key, rateLimitInfo] of this.rateLimits.entries()) {
      if (rateLimitInfo.windowStart < oneHourAgo) {
        this.rateLimits.delete(key);
      }
    }

    for (const [key, payment] of this.recentPayments.entries()) {
      if (payment.timestamp < now - this.config.duplicateWindowMs) {
        this.recentPayments.delete(key);
      }
    }

    this.auditLog = this.auditLog.filter(entry => entry.timestamp.getTime() > oneDayAgo);
  }
}

export const paymentSecurityService = new PaymentSecurityService();
