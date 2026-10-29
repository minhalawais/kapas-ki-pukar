import "reflect-metadata";

import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";

import { loadRuntimeConfigFromProcess } from "@kapas/config";
import { NestFactory } from "@nestjs/core";
import { config as loadDotenv } from "dotenv";

import { WorkerRuntime } from "./worker-runtime";

const dotenvCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];
const dotenvPath = dotenvCandidates.find((candidate) => existsSync(candidate));
if (dotenvPath) loadDotenv({ path: dotenvPath });

async function bootstrap(): Promise<void> {
  const { WorkerModule } = await import("./worker.module");
  const application = await NestFactory.createApplicationContext(WorkerModule, {
    abortOnError: true,
    logger: false,
  });
  application.enableShutdownHooks();
  const config = loadRuntimeConfigFromProcess();
  const runtime = application.get(WorkerRuntime);
  const health = createServer((request, response) => {
    if (request.url === "/health/live") {
      response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ status: "ok", service: "worker", version: config.appVersion }));
      return;
    }
    if (request.url === "/health/ready") {
      void runtime
        .ping()
        .then((ready) => {
          response.writeHead(ready ? 200 : 503, {
            "content-type": "application/json",
            "cache-control": "no-store",
          });
          response.end(
            JSON.stringify({ status: ready ? "ready" : "not_ready", service: "worker" }),
          );
        })
        .catch(() => {
          response.writeHead(503);
          response.end(JSON.stringify({ status: "not_ready", service: "worker" }));
        });
      return;
    }
    response.writeHead(404);
    response.end();
  });
  await new Promise<void>((resolve, reject) => {
    health.once("error", reject);
    health.listen(config.workerHealthPort, "0.0.0.0", () => resolve());
  });
  const closeHealth = () => health.close();
  process.once("SIGTERM", closeHealth);
  process.once("SIGINT", closeHealth);
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup failure";
  process.stderr.write(`Worker startup failed: ${message}\n`);
  process.exitCode = 1;
});
