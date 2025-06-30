import { PaymentService, paymentService } from './PaymentService';
import { PaymentStatus } from '../../types';
import { globalEventEmitter } from '../../core/utils/EventEmitter';
import { PAYMENT_EVENTS } from '../../core/constants';

export interface SyncConfig {
  intervalMs: number;
  maxRetries: number;
  retryDelayMs: number;
  staleThresholdMs: number;
}

export interface SyncResult {
  paymentId: string;
  oldStatus: PaymentStatus;
  newStatus: PaymentStatus | null;
  success: boolean;
  error?: string;
}

export interface SyncStats {
  totalSynced: number;
  successful: number;
  failed: number;
  statusChanged: number;
  lastSyncAt: Date | null;
}

export class PaymentSyncService {
  private paymentService: PaymentService;
  private config: SyncConfig;
  private syncInterval: number | null = null;
  private isRunning = false;
  private stats: SyncStats = {
    totalSynced: 0,
    successful: 0,
    failed: 0,
    statusChanged: 0,
    lastSyncAt: null,
  };

  constructor(config?: Partial<SyncConfig>) {
    this.paymentService = paymentService;
    this.config = {
      intervalMs: 30000,
      maxRetries: 3,
      retryDelayMs: 5000,
      staleThresholdMs: 5 * 60 * 1000,
      ...config,
    };
  }

  start(): void {
    if (this.isRunning) {
      console.warn('Payment sync service is already running');
      return;
    }

    this.isRunning = true;
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.config.intervalMs);

    console.log(`Payment sync service started with ${this.config.intervalMs}ms interval`);
    globalEventEmitter.emit(PAYMENT_EVENTS.SYNC_STARTED, { config: this.config });
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('Payment sync service stopped');
    globalEventEmitter.emit(PAYMENT_EVENTS.SYNC_STOPPED, { stats: this.stats });
  }

  async syncPayment(paymentId: string): Promise<SyncResult> {
    const payment = await this.paymentService.getPayment(paymentId);
    if (!payment) {
      return {
        paymentId,
        oldStatus: PaymentStatus.FAILED,
        newStatus: null,
        success: false,
        ...(true && { error: 'Payment not found' }),
      };
    }

    const oldStatus = payment.status;

    try {
      const newStatus = await this.paymentService.syncPaymentStatus(paymentId);

      return {
        paymentId,
        oldStatus,
        newStatus,
        success: newStatus !== null,
        ...(newStatus === null && { error: 'Failed to sync status' }),
      };
    } catch (error) {
      return {
        paymentId,
        oldStatus,
        newStatus: null,
        success: false,
        ...(true && { error: error instanceof Error ? error.message : 'Unknown error' }),
      };
    }
  }

  async performSync(): Promise<SyncResult[]> {
    try {
      const pendingPayments = await this.getPendingPayments();

      if (pendingPayments.length === 0) {
        return [];
      }

      console.log(`Syncing ${pendingPayments.length} payments...`);

      const results: SyncResult[] = [];

      for (const payment of pendingPayments) {
        const result = await this.syncPaymentWithRetry(payment.id);
        results.push(result);

        this.updateStats(result);

        await this.delay(100);
      }

      this.stats.lastSyncAt = new Date();

      globalEventEmitter.emit(PAYMENT_EVENTS.SYNC_COMPLETED, {
        results,
        stats: this.stats,
      });

      return results;
    } catch (error) {
      console.error('Payment sync failed:', error);
      globalEventEmitter.emit(PAYMENT_EVENTS.SYNC_FAILED, { error });
      return [];
    }
  }

  private async getPendingPayments() {
    const allPayments = await this.paymentService.getAllPayments();
    const now = Date.now();

    return allPayments.filter(payment => {
      if (
        payment.status === PaymentStatus.COMPLETED ||
        payment.status === PaymentStatus.FAILED ||
        payment.status === PaymentStatus.CANCELLED ||
        payment.status === PaymentStatus.REFUNDED
      ) {
        return false;
      }

      const timeSinceUpdate = now - payment.updatedAt.getTime();

      if (
        payment.status === PaymentStatus.PENDING &&
        timeSinceUpdate > this.config.staleThresholdMs
      ) {
        return true;
      }

      if (payment.status === PaymentStatus.PROCESSING) {
        return true;
      }

      return false;
    });
  }

  private async syncPaymentWithRetry(paymentId: string): Promise<SyncResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await this.syncPayment(paymentId);

        if (result.success) {
          return result;
        }

        lastError = result.error;

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';

        if (attempt < this.config.maxRetries) {
          await this.delay(this.config.retryDelayMs * attempt);
        }
      }
    }

    const payment = await this.paymentService.getPayment(paymentId);
    return {
      paymentId,
      oldStatus: payment?.status || PaymentStatus.FAILED,
      newStatus: null,
      success: false,
      ...(true && { error: `Failed after ${this.config.maxRetries} attempts: ${lastError}` }),
    };
  }

  private updateStats(result: SyncResult): void {
    this.stats.totalSynced++;

    if (result.success) {
      this.stats.successful++;

      if (result.newStatus && result.newStatus !== result.oldStatus) {
        this.stats.statusChanged++;
      }
    } else {
      this.stats.failed++;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): SyncStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalSynced: 0,
      successful: 0,
      failed: 0,
      statusChanged: 0,
      lastSyncAt: null,
    };
  }

  isActive(): boolean {
    return this.isRunning;
  }

  updateConfig(newConfig: Partial<SyncConfig>): void {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning) {
      this.start();
    }
  }
}

export const paymentSyncService = new PaymentSyncService();
