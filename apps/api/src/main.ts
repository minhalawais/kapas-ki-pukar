import "reflect-metadata";

import { configDiagnostics, loadRuntimeConfigFromProcess } from "@kapas/config";

import { createApplication } from "./application";

async function bootstrap(): Promise<void> {
  const config = loadRuntimeConfigFromProcess();
  const app = await createApplication(config);
  app
    .getHttpAdapter()
    .getInstance()
    .log.info({ config: configDiagnostics(config) }, "configuration valid");
  await app.listen(config.apiPort, config.apiHost);
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup failure";
  process.stderr.write(`API startup failed: ${message}\n`);
  process.exitCode = 1;
});
