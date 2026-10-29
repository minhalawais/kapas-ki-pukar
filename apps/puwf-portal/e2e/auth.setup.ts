import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { test as setup } from "@playwright/test";

import { loginStaff, staffCredentials } from "./auth";

const authFile = join(process.cwd(), "e2e", ".auth", "staff.json");

setup("staff session", async ({ page }) => {
  setup.skip(!staffCredentials(), "Set E2E_STAFF_* or BOOTSTRAP_ADMIN_* in repo .env");
  mkdirSync(dirname(authFile), { recursive: true });
  await loginStaff(page, "/dashboard");
  await page.context().storageState({ path: authFile });
});
