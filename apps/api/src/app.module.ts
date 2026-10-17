import type { RuntimeConfig } from "@kapas/config";
import { createServiceMetrics } from "@kapas/observability";
import { DynamicModule, Module } from "@nestjs/common";

import { type DependencyHealth, InfrastructureDependencyHealth } from "./dependency-health";
import { FoundationController } from "./foundation.controller";
import { MetricsController } from "./metrics.controller";
import { DEPENDENCY_HEALTH, RUNTIME_CONFIG, SERVICE_METRICS } from "./tokens";

@Module({})
export class AppModule {
  public static register(
    config: RuntimeConfig,
    dependencyHealth?: DependencyHealth,
  ): DynamicModule {
    const health =
      dependencyHealth ?? new InfrastructureDependencyHealth(config.databaseUrl, config.redisUrl);

    return {
      module: AppModule,
      controllers: [FoundationController, MetricsController],
      providers: [
        { provide: RUNTIME_CONFIG, useValue: config },
        { provide: DEPENDENCY_HEALTH, useValue: health },
        { provide: SERVICE_METRICS, useValue: createServiceMetrics("api") },
      ],
    };
  }
}
