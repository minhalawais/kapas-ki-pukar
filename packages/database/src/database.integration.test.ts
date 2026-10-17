import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabaseClient, type DatabaseClient } from "./index";

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;
let client: DatabaseClient;

integration("PostgreSQL foundation", () => {
  beforeAll(() => {
    client = createDatabaseClient({ connectionString: databaseUrl as string, maxConnections: 2 });
  });

  afterAll(async () => {
    await client.$disconnect();
  });

  it("reads and updates deployment metadata", async () => {
    const key = `integration-${Date.now()}`;
    await client.systemMetadata.create({ data: { key, value: { healthy: true } } });

    await expect(client.systemMetadata.findUnique({ where: { key } })).resolves.toMatchObject({
      key,
      value: { healthy: true },
    });

    await client.systemMetadata.delete({ where: { key } });
  });
});
