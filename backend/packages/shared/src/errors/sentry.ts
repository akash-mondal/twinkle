/**
 * Sentry Error Tracking Integration
 */

import * as Sentry from "@sentry/node";

export interface SentryConfig {
  /** Sentry DSN (required) */
  dsn?: string;
  /** Environment name */
  environment?: string;
  /** Release version */
  release?: string;
  /** Service name */
  serviceName?: string;
  /** Sample rate for traces (0-1) */
  tracesSampleRate?: number;
  /** Debug mode */
  debug?: boolean;
}

/**
 * Initialize Sentry error tracking
 */
export function initSentry(config: SentryConfig = {}): void {
  const dsn = config.dsn || process.env.SENTRY_DSN;

  if (!dsn) {
    console.warn("Sentry DSN not configured, error tracking disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: config.environment || process.env.NODE_ENV || "development",
    release: config.release || process.env.npm_package_version,
    serverName: config.serviceName || process.env.SERVICE_NAME,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    debug: config.debug ?? false,
    integrations: [
      Sentry.httpIntegration(),
    ],
    beforeSend(event) {
      // Scrub sensitive data
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["x-api-key"];
        delete event.request.headers["cookie"];
      }
      return event;
    },
  });
}

/**
 * Capture an exception with optional context
 */
export function captureError(
  error: Error,
  context?: Record<string, unknown>
): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
): string {
  return Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
} | null): void {
  Sentry.setUser(user);
}

/**
 * Set additional context tags
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: unknown): void {
  Sentry.setExtra(key, value);
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Span | undefined {
  return Sentry.startInactiveSpan({ name, op });
}

/**
 * Flush pending events before shutdown
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}

// Re-export Sentry for advanced usage
export { Sentry };
