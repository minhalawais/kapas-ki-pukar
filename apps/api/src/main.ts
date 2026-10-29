import "reflect-metadata";

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { configDiagnostics, loadRuntimeConfigFromProcess } from "@kapas/config";
import { config as loadDotenv } from "dotenv";

const dotenvCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];
const dotenvPath = dotenvCandidates.find((candidate) => existsSync(candidate));
if (dotenvPath) loadDotenv({ path: dotenvPath });

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
