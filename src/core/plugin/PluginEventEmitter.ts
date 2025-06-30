// ============================================================================
// MTYB Virtual Goods Platform - Plugin Event Emitter
// ============================================================================

import { EventEmitter } from '../utils/EventEmitter';
import { Logger } from '../utils/Logger';
import { type PluginContext, type DeliveryResult } from '../../types';

// ============================================================================
// Plugin Event Types
// ============================================================================

export interface PluginEventMap {
  // Plugin Lifecycle Events
  'plugin:registered': { pluginId: string; timestamp: Date };
  'plugin:unregistered': { pluginId: string; timestamp: Date };
  'plugin:enabled': { pluginId: string; timestamp: Date };
  'plugin:disabled': { pluginId: string; timestamp: Date };
  'plugin:initialized': { pluginId: string; timestamp: Date };
  'plugin:error': { pluginId: string; error: Error; timestamp: Date };

  // Plugin Execution Events
  'plugin:execution:start': { pluginId: string; context: PluginContext; timestamp: Date };
  'plugin:execution:success': { pluginId: string; result: DeliveryResult; timestamp: Date };
  'plugin:execution:error': { pluginId: string; error: Error; timestamp: Date };
  'plugin:execution:timeout': { pluginId: string; timeout: number; timestamp: Date };

  // Plugin Health Events
  'plugin:health:check': { pluginId: string; status: 'healthy' | 'unhealthy'; timestamp: Date };
  'plugin:health:degraded': { pluginId: string; reason: string; timestamp: Date };
  'plugin:health:recovered': { pluginId: string; timestamp: Date };

  // Plugin Communication Events
  'plugin:message': { fromPlugin: string; toPlugin: string; message: any; timestamp: Date };
  'plugin:broadcast': { fromPlugin: string; message: any; timestamp: Date };

  // System Events
  'system:plugin:reload': { pluginId: string; timestamp: Date };
  'system:plugin:cleanup': { pluginId: string; timestamp: Date };
  'system:health:check:all': { timestamp: Date };
}

// ============================================================================
// Plugin Event Emitter Class
// ============================================================================

export class PluginEventEmitter extends EventEmitter {
  private logger: Logger;
  private eventHistory: Array<{
    event: keyof PluginEventMap;
    data: any;
    timestamp: Date;
  }> = [];
  private maxHistorySize = 1000;

  constructor() {
    super();
    this.logger = new Logger('PluginEventEmitter');
    this.setupEventLogging();
  }

  // ============================================================================
  // Event Emission with Logging
  // ============================================================================

  async emitPluginEvent<K extends keyof PluginEventMap>(
    event: K,
    data: PluginEventMap[K]
  ): Promise<void> {
    // Add to history
    this.addToHistory(event, data);

    // Log the event
    this.logger.debug(`Plugin event emitted: ${event}`, data);

    // Emit the event
    await super.emit(event as string, data);
  }

  // ============================================================================
  // Plugin Lifecycle Event Helpers
  // ============================================================================

  emitPluginRegistered(pluginId: string): void {
    this.emitPluginEvent('plugin:registered', { pluginId, timestamp: new Date() });
  }

  emitPluginUnregistered(pluginId: string): void {
    this.emitPluginEvent('plugin:unregistered', { pluginId, timestamp: new Date() });
  }

  emitPluginEnabled(pluginId: string): void {
    this.emitPluginEvent('plugin:enabled', { pluginId, timestamp: new Date() });
  }

  emitPluginDisabled(pluginId: string): void {
    this.emitPluginEvent('plugin:disabled', { pluginId, timestamp: new Date() });
  }

  emitPluginInitialized(pluginId: string): void {
    this.emitPluginEvent('plugin:initialized', { pluginId, timestamp: new Date() });
  }

  emitPluginError(pluginId: string, error: Error): void {
    this.emitPluginEvent('plugin:error', { pluginId, error, timestamp: new Date() });
  }

  // ============================================================================
  // Plugin Execution Event Helpers
  // ============================================================================

  emitExecutionStart(pluginId: string, context: PluginContext): void {
    this.emitPluginEvent('plugin:execution:start', { pluginId, context, timestamp: new Date() });
  }

  emitExecutionSuccess(pluginId: string, result: DeliveryResult): void {
    this.emitPluginEvent('plugin:execution:success', { pluginId, result, timestamp: new Date() });
  }

  emitExecutionError(pluginId: string, error: Error): void {
    this.emitPluginEvent('plugin:execution:error', { pluginId, error, timestamp: new Date() });
  }

  emitExecutionTimeout(pluginId: string, timeout: number): void {
    this.emitPluginEvent('plugin:execution:timeout', { pluginId, timeout, timestamp: new Date() });
  }

  // ============================================================================
  // Plugin Health Event Helpers
  // ============================================================================

  emitHealthCheck(pluginId: string, status: 'healthy' | 'unhealthy'): void {
    this.emitPluginEvent('plugin:health:check', { pluginId, status, timestamp: new Date() });
  }

  emitHealthDegraded(pluginId: string, reason: string): void {
    this.emitPluginEvent('plugin:health:degraded', { pluginId, reason, timestamp: new Date() });
  }

  emitHealthRecovered(pluginId: string): void {
    this.emitPluginEvent('plugin:health:recovered', { pluginId, timestamp: new Date() });
  }

  // ============================================================================
  // Plugin Communication Helpers
  // ============================================================================

  emitPluginMessage(fromPlugin: string, toPlugin: string, message: any): void {
    this.emitPluginEvent('plugin:message', {
      fromPlugin,
      toPlugin,
      message,
      timestamp: new Date(),
    });
  }

  emitPluginBroadcast(fromPlugin: string, message: any): void {
    this.emitPluginEvent('plugin:broadcast', { fromPlugin, message, timestamp: new Date() });
  }

  // ============================================================================
  // System Event Helpers
  // ============================================================================

  emitSystemReload(pluginId: string): void {
    this.emitPluginEvent('system:plugin:reload', { pluginId, timestamp: new Date() });
  }

  emitSystemCleanup(pluginId: string): void {
    this.emitPluginEvent('system:plugin:cleanup', { pluginId, timestamp: new Date() });
  }

  emitSystemHealthCheckAll(): void {
    this.emitPluginEvent('system:health:check:all', { timestamp: new Date() });
  }

  // ============================================================================
  // Event History Management
  // ============================================================================

  private addToHistory(event: keyof PluginEventMap, data: any): void {
    this.eventHistory.push({
      event,
      data,
      timestamp: new Date(),
    });

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  getEventHistory(limit?: number): Array<{
    event: keyof PluginEventMap;
    data: any;
    timestamp: Date;
  }> {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  getEventHistoryForPlugin(
    pluginId: string,
    limit?: number
  ): Array<{
    event: keyof PluginEventMap;
    data: any;
    timestamp: Date;
  }> {
    const pluginEvents = this.eventHistory.filter(entry => {
      const data = entry.data;
      return (
        data.pluginId === pluginId || data.fromPlugin === pluginId || data.toPlugin === pluginId
      );
    });

    if (limit) {
      return pluginEvents.slice(-limit);
    }
    return pluginEvents;
  }

  clearEventHistory(): void {
    this.eventHistory = [];
    this.logger.info('Plugin event history cleared');
  }

  // ============================================================================
  // Event Logging Setup
  // ============================================================================

  private setupEventLogging(): void {
    // Log critical events
    this.on('plugin:error', (data: any) => {
      this.logger.error(`Plugin error in ${data.pluginId}:`, data.error);
    });

    this.on('plugin:execution:error', (data: any) => {
      this.logger.error(`Plugin execution error in ${data.pluginId}:`, data.error);
    });

    this.on('plugin:execution:timeout', (data: any) => {
      this.logger.warn(`Plugin execution timeout in ${data.pluginId} after ${data.timeout}ms`);
    });

    this.on('plugin:health:degraded', (data: any) => {
      this.logger.warn(`Plugin health degraded for ${data.pluginId}: ${data.reason}`);
    });

    // Log lifecycle events
    this.on('plugin:registered', (data: any) => {
      this.logger.info(`Plugin registered: ${data.pluginId}`);
    });

    this.on('plugin:unregistered', (data: any) => {
      this.logger.info(`Plugin unregistered: ${data.pluginId}`);
    });
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getEventStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentEvents: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const eventsByType: Record<string, number> = {};
    let recentEvents = 0;

    this.eventHistory.forEach(entry => {
      eventsByType[entry.event] = (eventsByType[entry.event] || 0) + 1;
      if (entry.timestamp > oneHourAgo) {
        recentEvents++;
      }
    });

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      recentEvents,
    };
  }
}

// ============================================================================
// Global Plugin Event Emitter Instance
// ============================================================================

export const pluginEventEmitter = new PluginEventEmitter();
