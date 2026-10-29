import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config as loadDotenv } from "dotenv";

const root = resolve(import.meta.dirname, "../..");
const envPath = resolve(root, ".env");
if (existsSync(envPath)) loadDotenv({ path: envPath });

const required = process.argv.slice(2);
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Integration test setup is incomplete. Missing: ${missing.join(", ")}`);
  process.exit(2);
}
