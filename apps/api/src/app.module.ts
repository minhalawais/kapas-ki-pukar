import type { RuntimeConfig } from "@kapas/config";
import { createDatabaseClient, PostgresIdentityAccessRepository } from "@kapas/database";
import { createServiceMetrics } from "@kapas/observability";
import { DynamicModule, Module } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AdminController } from "./admin.controller";
import { AnalyticsController, ExportController } from "./analytics.controller";
import { AuditController } from "./audit.controller";
import { AuthController } from "./auth";
import { StaffAuthorizationGuard } from "./authorization";
import { CaseController } from "./case.controller";
import { CaseWorkflowController } from "./case-workflow.controller";
import { ComplaintIntakeV3Controller } from "./complaint-intake-v3.controller";
import { ComplaintIntakeV3Service } from "./complaint-intake-v3.service";
import { type DependencyHealth, InfrastructureDependencyHealth } from "./dependency-health";
import { EvidenceDeliveryV3Controller } from "./evidence-delivery-v3.controller";
import { EvidenceDeliveryV3Service } from "./evidence-delivery-v3.service";
import { FoundationController } from "./foundation.controller";
import { GovernanceController } from "./governance.controller";
import { IntakeController } from "./intake.controller";
import { MetricsController } from "./metrics.controller";
import { ProviderWebhookController } from "./provider-webhook.controller";
import { ReferenceDataController } from "./reference-data.controller";
import {
  DATABASE_CLIENT,
  DEPENDENCY_HEALTH,
  IDENTITY_REPOSITORY,
  RUNTIME_CONFIG,
  SERVICE_METRICS,
} from "./tokens";
import { StaffCaseEvidenceService } from "./staff-case-evidence.service";
import { TusHookController } from "./tus-hook.controller";
import { WorkerController } from "./worker.controller";

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
      controllers: [
        FoundationController,
        MetricsController,
        AuthController,
        CaseController,
        CaseWorkflowController,
        AdminController,
        AuditController,
        ReferenceDataController,
        IntakeController,
        ComplaintIntakeV3Controller,
        EvidenceDeliveryV3Controller,
        WorkerController,
        ProviderWebhookController,
        AnalyticsController,
        ExportController,
        GovernanceController,
        TusHookController,
      ],
      providers: [
        { provide: RUNTIME_CONFIG, useValue: config },
        { provide: DEPENDENCY_HEALTH, useValue: health },
        { provide: SERVICE_METRICS, useValue: createServiceMetrics("api") },
        StaffAuthorizationGuard,
        Reflector,
        ComplaintIntakeV3Service,
        EvidenceDeliveryV3Service,
        StaffCaseEvidenceService,
        {
          provide: DATABASE_CLIENT,
          useFactory: () => createDatabaseClient({ connectionString: config.databaseUrl }),
        },
        {
          provide: IDENTITY_REPOSITORY,
          useFactory: (client) =>
            new PostgresIdentityAccessRepository(client, config.sessionSecret),
          inject: [DATABASE_CLIENT],
        },
      ],
    };
  }
}
