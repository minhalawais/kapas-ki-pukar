import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, devices } from "@playwright/test";

const repoEnv = resolve(__dirname, "../../.env");
if (existsSync(repoEnv)) {
  for (const line of readFileSync(repoEnv, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";
const port = new URL(baseURL).port || "3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      process.env.E2E_PRODUCTION === "true" ? "pnpm start" : `pnpm exec next dev --port ${port}`,
    env: {
      ...process.env,
      APP_MODE: "production",
      ENABLE_DEMO_CONTROLS: "false",
      NEXT_PUBLIC_ENABLE_DEMO_CREDENTIALS: "false",
      NEXT_PUBLIC_BACKEND_ENABLED: "true",
      PORT: port,
    },
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "unauthenticated",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      testMatch: /authenticated\.spec\.ts|health\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: resolve(__dirname, "e2e/.auth/staff.json"),
      },
      dependencies: ["setup"],
    },
  ],
});
