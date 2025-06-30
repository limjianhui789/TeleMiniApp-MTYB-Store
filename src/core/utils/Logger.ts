// ============================================================================
// MTYB Virtual Goods Platform - Logger Utility
// ============================================================================

import { FEATURE_FLAGS } from '../constants';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  source?: string;
  error?: Error | undefined;
}

export interface ILogger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error): void;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

export class Logger implements ILogger {
  private level: LogLevel = FEATURE_FLAGS.ENABLE_DEBUG_MODE ? LogLevel.DEBUG : LogLevel.INFO;
  private source: string;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor(source: string = 'App') {
    this.source = source;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error): void {
    this.log(LogLevel.ERROR, message, undefined, error);
  }

  private log(level: LogLevel, message: string, data?: any, error?: Error): void {
    if (level < this.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      source: this.source,
      error: error || undefined,
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    this.outputToConsole(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.source}] [${LogLevel[entry.level]}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.data);
        break;
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  createChildLogger(childSource: string): Logger {
    return new Logger(`${this.source}:${childSource}`);
  }
}

// Global logger instance
export const logger = new Logger('MTYB');

// Plugin logger factory
export const createPluginLogger = (pluginId: string): ILogger => {
  return logger.createChildLogger(`Plugin:${pluginId}`);
};

// Utility functions
export const formatError = (error: Error): string => {
  return `${error.name}: ${error.message}\n${error.stack}`;
};

export const sanitizeLogData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};
