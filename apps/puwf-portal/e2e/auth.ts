import { expect, type Page } from "@playwright/test";

export function staffCredentials(): { login: string; password: string } | null {
  const login = process.env.E2E_STAFF_LOGIN ?? process.env.BOOTSTRAP_ADMIN_LOGIN;
  const password = process.env.E2E_STAFF_PASSWORD ?? process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!login || !password) return null;
  return { login, password };
}

export async function loginStaff(page: Page, returnTo = "/dashboard") {
  const creds = staffCredentials();
  if (!creds) throw new Error("Staff credentials missing (E2E_STAFF_* or BOOTSTRAP_ADMIN_*)");
  await page.goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  await page.getByLabel(/email|login/i).fill(creds.login);
  await page.locator('input[type="password"]').fill(creds.password);
  await page.getByRole("button", { name: /enter dashboard|sign in|login/i }).click();
  await expect(page).toHaveURL(new RegExp(returnTo.replace(/\//g, "\\/")), { timeout: 20_000 });
}
