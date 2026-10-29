import {
  assertSyntheticSeedAllowed,
  createDatabaseClient,
  PostgresComplaintRepository,
  syntheticComplaint,
} from "../src/index";

const environment = (process.env.APP_ENV ?? process.env.NODE_ENV ?? "development").toLowerCase();
assertSyntheticSeedAllowed(environment);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const client = createDatabaseClient({ connectionString, maxConnections: 2 });
try {
  const repository = new PostgresComplaintRepository(client);
  const created = await repository.create(syntheticComplaint());
  process.stdout.write(`Synthetic fixture ready: ${created.referenceNumber}\n`);
} finally {
  await client.$disconnect();
}
