import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { WorkerModule } from "./worker.module";

async function bootstrap(): Promise<void> {
  const application = await NestFactory.createApplicationContext(WorkerModule, {
    abortOnError: true,
    logger: false,
  });
  application.enableShutdownHooks();
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup failure";
  process.stderr.write(`Worker startup failed: ${message}\n`);
  process.exitCode = 1;
});
