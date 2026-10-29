import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

const dotenvCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];
const dotenvPath = dotenvCandidates.find((candidate) => existsSync(candidate));
if (dotenvPath) loadDotenv({ path: dotenvPath });

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
