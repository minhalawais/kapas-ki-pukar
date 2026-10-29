import { execFileSync } from "node:child_process";

import { assertSafeDestructiveEnvironment } from "@kapas/security";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required");
}

assertSafeDestructiveEnvironment(process.env.NODE_ENV ?? "development", testDatabaseUrl);

const pnpmScript = process.env.npm_execpath;
if (!pnpmScript) {
  throw new Error("npm_execpath is required to run Prisma through the workspace package manager");
}

execFileSync(process.execPath, [pnpmScript, "exec", "prisma", "migrate", "reset", "--force"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PRISMA_DATABASE_URL: testDatabaseUrl },
  stdio: "inherit",
});
