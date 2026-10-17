import { configDiagnostics, loadRuntimeConfigFromProcess } from "@kapas/config";
import { createServiceLogger } from "@kapas/observability";
import { Module } from "@nestjs/common";

import { LogFinalFailureRecorder, WorkerRuntime } from "./worker-runtime";
import { RUNTIME_CONFIG, WORKER_LOGGER } from "./worker.tokens";

const config = loadRuntimeConfigFromProcess();
const logger = createServiceLogger({
  service: "worker",
  version: config.appVersion,
  environment: config.nodeEnv,
  level: config.logLevel,
});
logger.info({ config: configDiagnostics(config) }, "configuration valid");

@Module({
  providers: [
    { provide: RUNTIME_CONFIG, useValue: config },
    { provide: WORKER_LOGGER, useValue: logger },
    LogFinalFailureRecorder,
    WorkerRuntime,
  ],
})
export class WorkerModule {}
