import "dotenv/config";

import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env.PRISMA_DATABASE_URL ??
  process.env.MIGRATION_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://invalid:invalid@127.0.0.1:1/prisma_generate_only";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
