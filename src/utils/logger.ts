/**
 * Centralized logging utility
 */

import { AWS_CONFIG } from "../config/aws-config";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = this.parseLogLevel(AWS_CONFIG.logLevel);
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toUpperCase()) {
      case "ERROR":
        return LogLevel.ERROR;
      case "WARN":
        return LogLevel.WARN;
      case "INFO":
        return LogLevel.INFO;
      case "DEBUG":
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: Record<string, any>,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const errorContext = error
        ? { ...context, error: error.message, stack: error.stack }
        : context;
      console.error(this.formatMessage("ERROR", message, errorContext));
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage("WARN", message, context));
    }
  }

  info(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage("INFO", message, context));
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage("DEBUG", message, context));
    }
  }

  // Performance logging
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }

  // Structured logging for AWS CloudWatch
  logStructured(
    level: LogLevel,
    message: string,
    data: Record<string, any>,
  ): void {
    if (this.shouldLog(level)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: LogLevel[level],
        message,
        ...data,
      };
      console.log(JSON.stringify(logEntry));
    }
  }
}

export const logger = new Logger();
