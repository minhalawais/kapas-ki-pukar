import { expect, test } from "@playwright/test";

test("dashboard shell opens", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("dashboard has no runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("analytics and demo routes open", async ({ page }) => {
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/demo");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("keyboard can skip to main content", async ({ page }) => {
  await page.goto("/dashboard");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("dashboard table lists seeded complaints and opens a case", async ({ page }) => {
  await page.goto("/dashboard");
  const table = page.getByRole("table", { name: "Complaint list" });
  await expect(table).toBeVisible();
  const firstCase = page.getByRole("link", { name: /KP-26-/ }).first();
  await expect(firstCase).toBeVisible();
  await firstCase.click();
  await expect(page).toHaveURL(/\/complaints\/KP-26-/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("case workspace exposes worker facts and preview", async ({ page }) => {
  await page.goto("/complaints/KP-26-000101");
  await expect(page.getByRole("heading", { name: "Worker report" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AI analysis" })).toBeVisible();
  await page.getByRole("button", { name: "Preview worker view" }).click();
  await expect(page.getByRole("dialog", { name: "Worker-facing preview" })).toBeVisible();
  await expect(page.getByText("This preview excludes internal notes")).toBeVisible();
});

test("Urdu mode applies RTL and remains navigable", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Urdu" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("tablet navigation opens without covering the main content permanently", async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByRole("button", { name: "Close" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("search filter reduces the complaint table", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByLabel("Search", { exact: true }).fill("KP-26-000101");
  await expect(page.getByRole("link", { name: "KP-26-000101" }).first()).toBeVisible();
});

test("demo injects GS-01 and reset restores the seed count", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Inject into this app" }).click();
  await expect(page.getByText("KP-26-000101").first()).toBeVisible();
  await page.getByRole("link", { name: "Open case" }).click();
  await expect(page).toHaveURL(/\/complaints\/KP-26-000101/);
  await page.goto("/demo");
  await page.getByRole("button", { name: "Reset data" }).click();
  await page.getByRole("button", { name: "Confirm" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
