import { expect, test } from "@playwright/test";

const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/u, "");

test.describe("backend health (precondition)", () => {
  test("API is reachable for portal proxy", async ({ request }) => {
    const live = await request.get(`${apiBase}/api/v1/health/live`);
    expect(live.ok()).toBeTruthy();
    const ready = await request.get(`${apiBase}/api/v1/health/ready`);
    expect(ready.ok()).toBeTruthy();
  });
});
