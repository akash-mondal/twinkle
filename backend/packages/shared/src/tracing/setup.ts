/**
 * OpenTelemetry Tracing Setup
 * Distributed tracing for observability
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export interface TracingConfig {
  /** Service name for traces */
  serviceName: string;
  /** Service version */
  serviceVersion?: string;
  /** OTLP endpoint URL */
  endpoint?: string;
  /** Enable/disable tracing */
  enabled?: boolean;
}

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry tracing
 */
export function initTracing(config: TracingConfig): void {
  if (config.enabled === false) {
    console.log("OpenTelemetry tracing disabled");
    return;
  }

  const endpoint =
    config.endpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  if (!endpoint) {
    console.warn(
      "OTEL_EXPORTER_OTLP_ENDPOINT not configured, tracing disabled"
    );
    return;
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: config.serviceName,
    [ATTR_SERVICE_VERSION]:
      config.serviceVersion || process.env.npm_package_version || "unknown",
  });

  sdk = new NodeSDK({
    resource,
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable noisy instrumentations
        "@opentelemetry/instrumentation-fs": {
          enabled: false,
        },
      }),
    ],
  });

  sdk.start();

  console.log(`OpenTelemetry tracing initialized for ${config.serviceName}`);

  // Graceful shutdown
  process.on("SIGTERM", () => {
    shutdownTracing()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error("Error shutting down tracing:", error);
        process.exit(1);
      });
  });
}

/**
 * Shutdown tracing gracefully
 */
export async function shutdownTracing(): Promise<void> {
  if (sdk) {
    await sdk.shutdown();
    sdk = null;
  }
}

/**
 * Check if tracing is initialized
 */
export function isTracingEnabled(): boolean {
  return sdk !== null;
}
