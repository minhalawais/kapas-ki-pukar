import {
  contractJsonSchemas,
  type LivenessResponse,
  type MetaResponse,
  type ReadinessResponse,
} from "@kapas/api-contracts";
import type { RuntimeConfig } from "@kapas/config";
import type { ServiceMetrics } from "@kapas/observability";
import { Inject, Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import type { DependencyHealth } from "./dependency-health";
import { DEPENDENCY_HEALTH, RUNTIME_CONFIG, SERVICE_METRICS } from "./tokens";

@ApiTags("foundation")
@Controller("api/v1")
export class FoundationController {
  public constructor(
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
    @Inject(DEPENDENCY_HEALTH) private readonly dependencyHealth: DependencyHealth,
    @Inject(SERVICE_METRICS) private readonly metrics: ServiceMetrics,
  ) {}

  @Get("health/live")
  @ApiOperation({ summary: "Process liveness" })
  @ApiOkResponse({ schema: contractJsonSchemas.LivenessResponse as never })
  public live(): LivenessResponse {
    return {
      status: "ok",
      service: "api",
      version: this.config.appVersion,
      time: new Date().toISOString(),
    };
  }

  @Get("health/ready")
  @ApiOperation({ summary: "PostgreSQL and Redis readiness" })
  @ApiOkResponse({ schema: contractJsonSchemas.ReadinessResponse as never })
  @ApiResponse({ status: 503, description: "One or more dependencies are unavailable" })
  public async ready(): Promise<ReadinessResponse> {
    const dependencies = await this.dependencyHealth.check();
    const response: ReadinessResponse = {
      status:
        dependencies.postgres.status === "up" && dependencies.redis.status === "up"
          ? "ready"
          : "not_ready",
      service: "api",
      version: this.config.appVersion,
      time: new Date().toISOString(),
      dependencies,
    };

    if (dependencies.postgres.status === "down") {
      this.metrics.dependencyFailures.inc({ dependency: "postgres" });
    }
    if (dependencies.redis.status === "down") {
      this.metrics.dependencyFailures.inc({ dependency: "redis" });
    }
    if (response.status === "not_ready") {
      throw new ServiceUnavailableException({
        code: "dependencies_unavailable",
        readiness: response,
      });
    }
    return response;
  }

  @Get("meta")
  @ApiOperation({ summary: "Safe build metadata" })
  @ApiOkResponse({ schema: contractJsonSchemas.MetaResponse as never })
  public meta(): MetaResponse {
    return {
      service: "api",
      version: this.config.appVersion,
      environment: this.config.nodeEnv,
      apiVersion: "v1",
    };
  }
}
