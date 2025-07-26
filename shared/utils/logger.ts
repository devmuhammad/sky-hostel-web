import { isProduction } from "@/shared/config/env";

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  resource?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;

  constructor() {
    // Set log level based on environment
    this.logLevel = isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  private log(
    level: LogLevel,
    levelName: string,
    message: string,
    context?: LogContext,
    error?: Error
  ) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(levelName, message, context);

    if (isProduction) {
      // In production, you'd send to logging service (e.g., Sentry, LogRocket, DataDog)
      // For now, we'll use structured console logging
      const logData = {
        timestamp: new Date().toISOString(),
        level: levelName,
        message,
        context,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      };

      if (level === LogLevel.ERROR) {
        console.error(JSON.stringify(logData));
      } else {
        console.log(JSON.stringify(logData));
      }
    } else {
      // In development, use regular console with colors
      if (level === LogLevel.ERROR) {
        console.error(`🔴 ${formattedMessage}`);
        if (error) console.error(error);
      } else if (level === LogLevel.WARN) {
        console.warn(`🟡 ${formattedMessage}`);
      } else if (level === LogLevel.INFO) {
        console.info(`🔵 ${formattedMessage}`);
      } else {
        console.log(`⚪ ${formattedMessage}`);
      }
    }
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.log(LogLevel.ERROR, "ERROR", message, context, error);
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, "WARN", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, "INFO", message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, "DEBUG", message, context);
  }

  // Helper methods for common use cases
  apiRequest(method: string, path: string, context?: LogContext) {
    this.info(`API ${method} ${path}`, context);
  }

  apiError(method: string, path: string, error: Error, context?: LogContext) {
    this.error(`API ${method} ${path} failed`, context, error);
  }

  payment(action: string, paymentId: string, context?: LogContext) {
    this.info(`Payment ${action}`, {
      ...context,
      resource: "payment",
      metadata: { ...context?.metadata, paymentId },
    });
  }

  student(action: string, studentId: string, context?: LogContext) {
    this.info(`Student ${action}`, {
      ...context,
      resource: "student",
      metadata: { ...context?.metadata, studentId },
    });
  }

  registration(action: string, context?: LogContext) {
    this.info(`Registration ${action}`, {
      ...context,
      resource: "registration",
    });
  }
}

// Export singleton logger instance
export const logger = new Logger();

// Export helper functions for common patterns
export const logApiRequest = (
  method: string,
  path: string,
  context?: LogContext
) => {
  logger.apiRequest(method, path, context);
};

export const logApiError = (
  method: string,
  path: string,
  error: Error,
  context?: LogContext
) => {
  logger.apiError(method, path, error, context);
};

export const logPayment = (
  action: string,
  paymentId: string,
  context?: LogContext
) => {
  logger.payment(action, paymentId, context);
};

export const logStudent = (
  action: string,
  studentId: string,
  context?: LogContext
) => {
  logger.student(action, studentId, context);
};

export const logRegistration = (action: string, context?: LogContext) => {
  logger.registration(action, context);
};

// Export for backward compatibility and direct use
export default logger;
