import { pinoRedactionPaths } from "@kapas/security";
import { trace } from "@opentelemetry/api";
import { Counter, Histogram, Registry, collectDefaultMetrics } from "@prometheus-io/client";
import pino, { type Logger, type LoggerOptions } from "pino";

export interface LoggerContext {
  readonly service: string;
  readonly version: string;
  readonly environment: string;
  readonly level: string;
}

export function buildLoggerOptions(context: LoggerContext): LoggerOptions {
  return {
    level: context.level,
    base: {
      service: context.service,
      version: context.version,
      environment: context.environment,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [...pinoRedactionPaths],
      censor: "[REDACTED]",
    },
    serializers: {
      err: pino.stdSerializers.err,
      req(request: { id?: string; method?: string; routeOptions?: { url?: string } }) {
        return {
          id: request.id,
          method: request.method,
          route: request.routeOptions?.url,
        };
      },
    },
  };
}

export function createServiceLogger(context: LoggerContext): Logger {
  return pino(buildLoggerOptions(context));
}

export interface ServiceMetrics {
  readonly registry: Registry;
  readonly httpDuration: Histogram<"method" | "route" | "status">;
  readonly httpRequests: Counter<"method" | "route" | "status">;
  readonly dependencyFailures: Counter<"dependency">;
}

export function createServiceMetrics(service: string): ServiceMetrics {
  const registry = new Registry();
  registry.setDefaultLabels({ service });
  collectDefaultMetrics({ register: registry, prefix: "kapas_" });

  const httpDuration = new Histogram({
    name: "kapas_http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"],
    registers: [registry],
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });
  const httpRequests = new Counter({
    name: "kapas_http_requests_total",
    help: "HTTP requests completed",
    labelNames: ["method", "route", "status"],
    registers: [registry],
  });
  const dependencyFailures = new Counter({
    name: "kapas_dependency_failures_total",
    help: "Dependency health check failures",
    labelNames: ["dependency"],
    registers: [registry],
  });

  return { registry, httpDuration, httpRequests, dependencyFailures };
}

export const applicationTracer = trace.getTracer("kapas-ki-pukaar");
