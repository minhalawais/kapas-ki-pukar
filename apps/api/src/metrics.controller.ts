import { timingSafeEqual } from "node:crypto";

import type { RuntimeConfig } from "@kapas/config";
import type { ServiceMetrics } from "@kapas/observability";
import { Controller, Get, Inject, Req, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { FastifyReply, FastifyRequest } from "fastify";

import { RUNTIME_CONFIG, SERVICE_METRICS } from "./tokens";

function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

@ApiExcludeController()
@Controller("internal")
export class MetricsController {
  public constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(SERVICE_METRICS) private readonly metrics: ServiceMetrics,
  ) {}

  @Get("metrics")
  public async metricsText(
    @Req() request: FastifyRequest,
    @Res() response: FastifyReply,
  ): Promise<void> {
    const supplied = request.headers["x-internal-metrics-token"];
    if (typeof supplied !== "string" || !secureEqual(supplied, this.config.internalMetricsToken)) {
      await response.status(401).send({
        code: "unauthorized",
        message: "Internal metrics credentials are required",
        requestId: request.id,
      });
      return;
    }
    await response
      .type("text/plain; version=0.0.4; charset=utf-8")
      .send(await this.metrics.registry.metrics());
  }
}
