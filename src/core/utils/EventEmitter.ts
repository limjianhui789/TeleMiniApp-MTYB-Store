// ============================================================================
// MTYB Virtual Goods Platform - Event Emitter Utility
// ============================================================================

import { logger } from './Logger';

export type EventListener<T = any> = (data: T) => void | Promise<void>;

export interface EventSubscription {
  unsubscribe(): void;
}

export interface IEventEmitter {
  on<T = any>(event: string, listener: EventListener<T>): EventSubscription;
  off<T = any>(event: string, listener: EventListener<T>): void;
  emit<T = any>(event: string, data?: T): Promise<void>;
  once<T = any>(event: string, listener: EventListener<T>): EventSubscription;
  removeAllListeners(event?: string): void;
  listenerCount(event: string): number;
  eventNames(): string[];
}

export class EventEmitter implements IEventEmitter {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private onceListeners: Map<string, Set<EventListener>> = new Map();
  private maxListeners: number = 100;

  setMaxListeners(max: number): void {
    this.maxListeners = max;
  }

  getMaxListeners(): number {
    return this.maxListeners;
  }

  on<T = any>(event: string, listener: EventListener<T>): EventSubscription {
    this.addListener(event, listener, false);

    return {
      unsubscribe: () => this.off(event, listener),
    };
  }

  once<T = any>(event: string, listener: EventListener<T>): EventSubscription {
    this.addListener(event, listener, true);

    return {
      unsubscribe: () => this.off(event, listener),
    };
  }

  off<T = any>(event: string, listener: EventListener<T>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }

    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      onceListeners.delete(listener);
      if (onceListeners.size === 0) {
        this.onceListeners.delete(event);
      }
    }
  }

  async emit<T = any>(event: string, data?: T): Promise<void> {
    const listeners = this.listeners.get(event);
    const onceListeners = this.onceListeners.get(event);

    const allListeners: EventListener[] = [];

    if (listeners) {
      allListeners.push(...Array.from(listeners));
    }

    if (onceListeners) {
      allListeners.push(...Array.from(onceListeners));
      // Clear once listeners after getting them
      this.onceListeners.delete(event);
    }

    if (allListeners.length === 0) {
      return;
    }

    logger.debug(`Emitting event: ${event}`, {
      listenerCount: allListeners.length,
      data: data,
    });

    // Execute all listeners
    const promises = allListeners.map(async listener => {
      try {
        await listener(data);
      } catch (error) {
        logger.error(`Error in event listener for ${event}`, error as Error);
      }
    });

    await Promise.all(promises);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  listenerCount(event: string): number {
    const listeners = this.listeners.get(event)?.size || 0;
    const onceListeners = this.onceListeners.get(event)?.size || 0;
    return listeners + onceListeners;
  }

  eventNames(): string[] {
    const events = new Set<string>();

    for (const event of this.listeners.keys()) {
      events.add(event);
    }

    for (const event of this.onceListeners.keys()) {
      events.add(event);
    }

    return Array.from(events);
  }

  private addListener(event: string, listener: EventListener, once: boolean): void {
    const map = once ? this.onceListeners : this.listeners;

    if (!map.has(event)) {
      map.set(event, new Set());
    }

    const listeners = map.get(event)!;

    if (listeners.size >= this.maxListeners) {
      logger.warn(`Max listeners (${this.maxListeners}) exceeded for event: ${event}`);
    }

    listeners.add(listener);
  }
}

// Global event emitter instance
export const globalEventEmitter = new EventEmitter();

// Utility functions for common event patterns
export const createEventNamespace = (namespace: string) => {
  return {
    on: <T = any>(event: string, listener: EventListener<T>) =>
      globalEventEmitter.on(`${namespace}:${event}`, listener),

    off: <T = any>(event: string, listener: EventListener<T>) =>
      globalEventEmitter.off(`${namespace}:${event}`, listener),

    emit: <T = any>(event: string, data?: T) =>
      globalEventEmitter.emit(`${namespace}:${event}`, data),

    once: <T = any>(event: string, listener: EventListener<T>) =>
      globalEventEmitter.once(`${namespace}:${event}`, listener),
  };
};

// Pre-defined namespaces for different parts of the application
export const userEvents = createEventNamespace('user');
export const productEvents = createEventNamespace('product');
export const orderEvents = createEventNamespace('order');
export const paymentEvents = createEventNamespace('payment');
export const pluginEvents = createEventNamespace('plugin');
export const cartEvents = createEventNamespace('cart');
export const uiEvents = createEventNamespace('ui');
