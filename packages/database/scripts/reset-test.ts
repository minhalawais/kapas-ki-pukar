import { execFileSync } from "node:child_process";

import { assertSafeDestructiveEnvironment } from "@kapas/security";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is required");
}

assertSafeDestructiveEnvironment(process.env.NODE_ENV ?? "development", testDatabaseUrl);

const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
execFileSync(pnpmCommand, ["exec", "prisma", "migrate", "reset", "--force"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PRISMA_DATABASE_URL: testDatabaseUrl },
  stdio: "inherit",
});
