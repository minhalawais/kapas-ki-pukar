import { expect, test } from "@playwright/test";

import { staffCredentials } from "./auth";

const creds = staffCredentials();

test.describe("production portal authenticated workflow", () => {
  test.beforeEach(() => {
    test.skip(!creds, "Set E2E_STAFF_* or BOOTSTRAP_ADMIN_* in repo .env");
  });

  test("dashboard loads KPIs and analytics", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByText(/total|کل/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test("opens a case workspace with operational controls", async ({ page }) => {
    await page.goto("/data-management");
    const caseLink = page.locator('a[href^="/complaints/"]').first();
    await expect(caseLink).toBeVisible({ timeout: 30_000 });
    await Promise.all([page.waitForURL(/complaints\//, { timeout: 30_000 }), caseLink.click()]);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/worker report|voice|evidence|timeline|record action/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("case detail includes evidence metadata when backend has v3 media", async ({ page }) => {
    await page.goto("/dashboard");
    const list = await page.request.get("/api/v1/cases");
    expect(list.ok()).toBeTruthy();
    const cases = (await list.json()) as Array<{ id: string; referenceNumber: string; evidenceStatus?: string }>;
    const withMedia = cases.find((row) => row.evidenceStatus === "complete" || row.evidenceStatus === "processing");
    test.skip(!withMedia, "No complaint with evidence in local database");

    await page.goto(`/complaints/${encodeURIComponent(withMedia!.referenceNumber)}`);
    const detailByRef = await page.request.get(
      `/api/v1/cases/${encodeURIComponent(withMedia!.referenceNumber)}`,
    );
    expect(detailByRef.ok()).toBeTruthy();
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });

    const detail = await page.request.get(`/api/v1/cases/${encodeURIComponent(withMedia!.id)}`);
    expect(detail.ok()).toBeTruthy();
    const body = (await detail.json()) as {
      evidence?: unknown[];
      voice?: unknown;
    };
    if (body.voice || (body.evidence?.length ?? 0) > 0) {
      await expect(page.getByText(/evidence|voice|photo|document|\.m4a|\.png/i).first()).toBeVisible({
        timeout: 15_000,
      });
    }
  });

  test("case detail shows device map when API returns coordinates", async ({ page }) => {
    await page.goto("/dashboard");
    const list = await page.request.get("/api/v1/cases?limit=50");
    expect(list.ok()).toBeTruthy();
    const cases = (await list.json()) as Array<{ id: string; referenceNumber: string }>;
    let withCoords: { referenceNumber: string; latitude: number; longitude: number } | null = null;
    for (const row of cases.slice(0, 20)) {
      const detail = await page.request.get(`/api/v1/cases/${encodeURIComponent(row.referenceNumber)}`);
      if (!detail.ok()) continue;
      const body = (await detail.json()) as {
        exactCoordinates?: { latitude: number; longitude: number } | null;
      };
      if (body.exactCoordinates?.latitude != null && body.exactCoordinates?.longitude != null) {
        withCoords = {
          referenceNumber: row.referenceNumber,
          latitude: body.exactCoordinates.latitude,
          longitude: body.exactCoordinates.longitude,
        };
        break;
      }
    }
    test.skip(!withCoords, "No complaint with device GPS coordinates in local database");

    await page.goto(`/complaints/${encodeURIComponent(withCoords!.referenceNumber)}`);
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /open in google maps/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('iframe[title*="GPS"]')).toBeVisible({ timeout: 15_000 });
  });

  test("loads data management workspace and export control", async ({ page }) => {
    await page.goto("/data-management");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.getByRole("button", { name: /export|download/i }).first()).toBeVisible();
    await page.goto("/analytics");
    await expect(page).toHaveURL(/data-management/);
  });

  test("loads every production workspace route", async ({ page }) => {
    for (const route of ["/dashboard", "/data-management"]) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
    }
  });

  test("corrective action offers IO document upload", async ({ page }) => {
    await page.goto("/data-management");
    const caseLink = page.locator('a[href^="/complaints/"]').first();
    await expect(caseLink).toBeVisible({ timeout: 30_000 });
    await Promise.all([page.waitForURL(/complaints\//, { timeout: 30_000 }), caseLink.click()]);
    const actionType = page.getByLabel(/action type/i);
    await expect(actionType).toBeVisible({ timeout: 15_000 });
    await actionType.selectOption("corrective-action-taken");
    await expect(page.getByLabel(/io documents/i)).toBeVisible();
    await expect(page.getByText(/link documents from this complaint/i)).toHaveCount(0);
  });

  test("reference-data proxy reaches API", async ({ page }) => {
    await page.goto("/dashboard");
    const locations = await page.request.get("/api/v1/reference-data/locations");
    expect(locations.status()).toBe(200);
    const payload = (await locations.json()) as unknown[];
    expect(Array.isArray(payload)).toBe(true);
  });
});
