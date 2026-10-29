import { expect, test } from "@playwright/test";

import { staffCredentials } from "./auth";

const creds = staffCredentials();

test.describe("portal auth", () => {
  test.describe.configure({ mode: "serial" });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("rejects invalid credentials", async ({ page }) => {
    test.skip(!creds, "Set E2E_STAFF_* or BOOTSTRAP_ADMIN_* in repo .env");
    await page.goto("/login");
    await page.getByLabel(/email|login/i).fill(creds!.login);
    await page.locator('input[type="password"]').fill("wrong-password-not-valid");
    await page.getByRole("button", { name: /enter dashboard|sign in|login/i }).click();
    await expect(page.getByText(/unable to sign in/i)).toBeVisible();
  });

  test("accepts valid credentials and sets session", async ({ page }) => {
    test.skip(!creds, "Set E2E_STAFF_* or BOOTSTRAP_ADMIN_* in repo .env");
    await page.goto("/login");
    await page.getByLabel(/email|login/i).fill(creds!.login);
    await page.locator('input[type="password"]').fill(creds!.password);
    await page.getByRole("button", { name: /enter dashboard|sign in|login/i }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 20_000 });
  });
});
