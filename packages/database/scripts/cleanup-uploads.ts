import "dotenv/config";

import { rm } from "node:fs/promises";

import { createDatabaseClient } from "../src/index";

const connectionString = process.env.DATABASE_URL;
const quarantineRoot = process.env.QUARANTINE_ROOT;
if (!connectionString || !quarantineRoot) {
  throw new Error("DATABASE_URL and QUARANTINE_ROOT are required");
}

const client = createDatabaseClient({ connectionString });
const now = new Date();
const expired = await client.uploadSession.findMany({
  where: { expiresAt: { lt: now }, status: { in: ["created", "uploading", "rejected"] } },
  select: { id: true, quarantinePath: true },
  take: 500,
});
for (const upload of expired) {
  await rm(upload.quarantinePath, { force: true });
  await client.uploadSession.update({ where: { id: upload.id }, data: { status: "expired" } });
}
await client.$disconnect();
console.log(JSON.stringify({ expired: expired.length }));
