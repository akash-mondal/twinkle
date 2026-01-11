/**
 * Pino Logger Configuration
 * Structured JSON logging for production
 */

import pino, { type Logger, type LoggerOptions } from "pino";

export interface LoggerConfig {
  /** Service name for log identification */
  serviceName?: string;
  /** Log level (default: 'info') */
  level?: string;
  /** Enable pretty printing in development */
  pretty?: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: "info",
  pretty: process.env.NODE_ENV === "development",
};

/**
 * Create a configured Pino logger instance
 */
export function createLogger(config: LoggerConfig = {}): Logger {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const options: LoggerOptions = {
    level: mergedConfig.level || process.env.LOG_LEVEL || "info",
    formatters: {
      level: (label) => ({ level: label }),
    },
    base: {
      service: mergedConfig.serviceName || process.env.SERVICE_NAME,
      env: process.env.NODE_ENV || "development",
      pid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  // Use pino-pretty in development
  if (mergedConfig.pretty) {
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    };
  }

  return pino(options);
}

/**
 * Create a child logger with additional bindings
 */
export function createChildLogger(
  parent: Logger,
  bindings: Record<string, unknown>
): Logger {
  return parent.child(bindings);
}

// Default logger instance
let _logger: Logger | null = null;

/**
 * Get or create the default logger instance
 */
export function getLogger(): Logger {
  if (!_logger) {
    _logger = createLogger();
  }
  return _logger;
}

/**
 * Set the default logger instance
 */
export function setLogger(logger: Logger): void {
  _logger = logger;
}

// Re-export pino types
export type { Logger, LoggerOptions };
