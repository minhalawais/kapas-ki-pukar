import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";
export type { Prisma } from "./generated/prisma/client";

export type DatabaseClient = PrismaClient;

export interface DatabaseClientOptions {
  readonly connectionString: string;
  readonly maxConnections?: number;
  readonly connectionTimeoutMs?: number;
  readonly idleTimeoutMs?: number;
  readonly transactionMaxWaitMs?: number;
  readonly transactionTimeoutMs?: number;
}

export function createDatabaseClient(options: DatabaseClientOptions): DatabaseClient {
  const adapter = new PrismaPg({
    connectionString: options.connectionString,
    max: options.maxConnections ?? 10,
    connectionTimeoutMillis: options.connectionTimeoutMs ?? 5_000,
    idleTimeoutMillis: options.idleTimeoutMs ?? 30_000,
    application_name: "kapas-ki-pukaar",
  });

  return new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: options.transactionMaxWaitMs ?? 2_000,
      timeout: options.transactionTimeoutMs ?? 10_000,
    },
  });
}

export async function checkDatabase(client: DatabaseClient): Promise<void> {
  await client.$queryRaw`SELECT 1`;
}

export * from "./repositories";
export * from "./fixtures";
