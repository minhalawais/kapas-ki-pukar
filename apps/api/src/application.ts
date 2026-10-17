import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";

import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { requestIdSchema } from "@kapas/api-contracts";
import type { RuntimeConfig } from "@kapas/config";
import { buildLoggerOptions } from "@kapas/observability";
import type { ServiceMetrics } from "@kapas/observability";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import type { DependencyHealth } from "./dependency-health";
import { ErrorEnvelopeFilter } from "./error-envelope.filter";
import { createOpenApiDocument } from "./openapi";
import { SERVICE_METRICS } from "./tokens";

function requestId(request: IncomingMessage): string {
  const supplied = request.headers["x-request-id"];
  return typeof supplied === "string" && requestIdSchema.safeParse(supplied).success
    ? supplied
    : randomUUID();
}

export async function createApplication(
  config: RuntimeConfig,
  dependencyHealth?: DependencyHealth,
): Promise<NestFastifyApplication> {
  const adapter = new FastifyAdapter({
    bodyLimit: config.jsonBodyLimitBytes,
    trustProxy:
      config.trustProxyCount === 0
        ? false
        : (_address: string, hop: number) => hop < config.trustProxyCount,
    genReqId: requestId,
    logger: buildLoggerOptions({
      service: "api",
      version: config.appVersion,
      environment: config.nodeEnv,
      level: config.logLevel,
    }),
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(config, dependencyHealth),
    adapter,
    { abortOnError: false, logger: false },
  );

  app.enableShutdownHooks();
  app.useGlobalFilters(new ErrorEnvelopeFilter());
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, {
    global: true,
    max: config.rateLimitMax,
    timeWindow: config.rateLimitTtlMs,
    hook: "onRequest",
    errorResponseBuilder(request) {
      return {
        code: "rate_limited",
        message: "Too many requests",
        requestId: request.id,
      };
    },
  });
  app.enableCors({
    origin: [...config.portalOrigins],
    credentials: true,
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["content-type", "x-request-id", "x-internal-metrics-token"],
    maxAge: 600,
  });

  const metrics = app.get<ServiceMetrics>(SERVICE_METRICS);
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    reply.header("cache-control", "no-store");
    return payload;
  });
  fastify.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions.url || "unmatched";
    const labels = { method: request.method, route, status: String(reply.statusCode) };
    metrics.httpRequests.inc(labels);
    metrics.httpDuration.observe(labels, reply.elapsedTime / 1_000);
  });

  if (config.openApiEnabled) {
    SwaggerModule.setup("api/docs", app, () => createOpenApiDocument(app, config), {
      jsonDocumentUrl: "api/docs/openapi.json",
      raw: ["json"],
    });
  }

  return app;
}
