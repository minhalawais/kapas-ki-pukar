import { afterEach, describe, expect, it } from "vitest";

import { assertSyntheticSeedAllowed, createDatabaseClient, type DatabaseClient } from "./index";

describe("database client factory", () => {
  let client: DatabaseClient | undefined;

  afterEach(async () => {
    await client?.$disconnect();
  });

  it("creates one explicitly configured Prisma client without connecting eagerly", () => {
    client = createDatabaseClient({
      connectionString: "postgresql://unused:unused@127.0.0.1:1/unused_test",
      maxConnections: 2,
      transactionMaxWaitMs: 1_000,
      transactionTimeoutMs: 5_000,
    });

    expect(client).toBeDefined();
    expect(typeof client.$transaction).toBe("function");
  });

  it("hard-fails synthetic seed policy in staging and production", () => {
    expect(() => assertSyntheticSeedAllowed("staging")).toThrow("prohibited");
    expect(() => assertSyntheticSeedAllowed("production")).toThrow("prohibited");
    expect(() => assertSyntheticSeedAllowed("test")).not.toThrow();
  });
});
