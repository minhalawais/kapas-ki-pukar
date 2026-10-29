import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { hashOpaqueToken, hashPassword, normalizeLoginIdentifier } from "@kapas/security";
import { config as loadDotenv } from "dotenv";

import { createDatabaseClient } from "../src/index";

const root = resolve(import.meta.dirname, "../../..");
if (existsSync(resolve(root, ".env"))) loadDotenv({ path: resolve(root, ".env") });

const login =
  process.env.E2E_STAFF_LOGIN ?? process.env.BOOTSTRAP_ADMIN_LOGIN ?? "admin@example.local";
const password =
  process.env.E2E_STAFF_PASSWORD ??
  process.env.BOOTSTRAP_ADMIN_PASSWORD ??
  "local-e2e-staff-password-change-me";

const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!sessionSecret) throw new Error("SESSION_SECRET is required");

const client = createDatabaseClient({ connectionString: databaseUrl });
const normalized = normalizeLoginIdentifier(login);
const passwordHash = await hashPassword(password);

try {
  const existing = await client.user.findUnique({
    where: { loginIdentifier: normalized },
    include: { passwordCredential: true },
  });
  if (!existing) {
    console.error(`No user ${normalized}. Run db:bootstrap-admin first.`);
    process.exit(1);
  }
  const loginHash = hashOpaqueToken(normalized, sessionSecret);
  await client.loginAttempt.deleteMany({ where: { loginHash } });

  if (existing.passwordCredential) {
    await client.passwordCredential.update({
      where: { userId: existing.id },
      data: { passwordHash },
    });
  } else {
    await client.passwordCredential.create({
      data: { userId: existing.id, passwordHash },
    });
  }

  console.log(`E2E staff ready: ${normalized} (password synced)`);
} finally {
  await client.$disconnect();
}
