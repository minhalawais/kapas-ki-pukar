import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { hashPassword, normalizeLoginIdentifier, rolePermissions } from "@kapas/security";
import { config as loadDotenv } from "dotenv";

import { createDatabaseClient } from "../src/index";

// pnpm runs this script with packages/database as cwd. Load the workspace
// root .env as well as an optional package-local .env so DATABASE_URL is
// available exactly as it is for Prisma and the API.
const dotenvCandidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")];
const dotenvPath = dotenvCandidates.find((candidate) => existsSync(candidate));
if (dotenvPath) loadDotenv({ path: dotenvPath });

const loginIdentifier = process.env.BOOTSTRAP_ADMIN_LOGIN;
const displayName = process.env.BOOTSTRAP_ADMIN_NAME;
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const confirmation = process.env.BOOTSTRAP_ADMIN_CONFIRM;
const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (process.env.NODE_ENV === "production" && confirmation !== "YES") {
  throw new Error("Set BOOTSTRAP_ADMIN_CONFIRM=YES for the one-time administrator bootstrap");
}
if (!loginIdentifier || !displayName || !password || !databaseUrl) {
  throw new Error(
    "BOOTSTRAP_ADMIN_LOGIN, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_PASSWORD and DATABASE_URL are required",
  );
}

const client = createDatabaseClient({ connectionString: databaseUrl });
const permissionCodes = [...new Set(Object.values(rolePermissions).flat())];
const roleCode = "administrator";

try {
  const result = await client.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { code: roleCode },
      update: {},
      create: {
        code: roleCode,
        description: "User and role administration without automatic evidence access",
      },
    });
    const permissions = [];
    for (const code of permissionCodes) {
      permissions.push(
        await tx.permission.upsert({
          where: { code },
          update: {},
          create: { code, description: code },
        }),
      );
    }
    for (const permission of permissions) {
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    const user = await tx.user.create({
      data: {
        displayName,
        loginIdentifier: normalizeLoginIdentifier(loginIdentifier),
        status: "active",
        passwordCredential: { create: { passwordHash: await hashPassword(password) } },
        roles: { create: { roleId: role.id } },
      },
      select: { id: true, loginIdentifier: true },
    });
    return user;
  });
  process.stdout.write(`Bootstrap administrator created: ${result.loginIdentifier}\n`);
} finally {
  await client.$disconnect();
}
