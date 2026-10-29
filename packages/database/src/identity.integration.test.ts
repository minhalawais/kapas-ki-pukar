import { createHmac, randomUUID } from "node:crypto";

import { deriveKey, encryptEnvelope, generateTotpSecret, hashPassword } from "@kapas/security";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createDatabaseClient,
  PostgresIdentityAccessRepository,
  type DatabaseClient,
} from "./index";

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;
let client: DatabaseClient;
let repository: PostgresIdentityAccessRepository;

integration("identity and session persistence", () => {
  beforeAll(() => {
    client = createDatabaseClient({
      connectionString: databaseUrl as string,
      transactionMaxWaitMs: 10_000,
      transactionTimeoutMs: 30_000,
    });
    repository = new PostgresIdentityAccessRepository(client, "integration-pepper");
  });
  afterAll(async () => client.$disconnect());

  it("authenticates staff, creates a revocable session and rejects bad credentials", async () => {
    const suffix = randomUUID();
    const role = await client.role.create({
      data: { code: `grievance_manager_${suffix}`, description: "test" },
    });
    const permission = await client.permission.create({
      data: { code: `case.read_${suffix}`, description: "test" },
    });
    await client.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
    const user = await client.user.create({
      data: {
        displayName: "Synthetic Manager",
        loginIdentifier: `manager-${suffix}@example.test`,
        passwordCredential: {
          create: { passwordHash: await hashPassword("correct horse battery staple") },
        },
        roles: { create: { roleId: role.id } },
      },
    });
    await expect(
      repository.authenticateStaff(user.loginIdentifier, "incorrect password"),
    ).resolves.toBeNull();
    const authenticated = await repository.authenticateStaff(
      user.loginIdentifier,
      "correct horse battery staple",
    );
    expect(authenticated?.userId).toBe(user.id);
    const session = await repository.createStaffSession(user.id, "password", `session-${suffix}`);
    await expect(repository.resolveStaffSession(`session-${suffix}`)).resolves.toMatchObject({
      userId: user.id,
    });
    await repository.revokeSession(`session-${suffix}`, "test");
    await expect(repository.resolveStaffSession(`session-${suffix}`)).resolves.toBeNull();
    expect(session.expiresAt).toBeTruthy();
  });

  it("enforces MFA replay protection and consumes recovery codes once", async () => {
    const suffix = randomUUID();
    const role = await client.role.create({
      data: { code: `mfa_role_${suffix}`, description: "test" },
    });
    const user = await client.user.create({
      data: {
        displayName: "Synthetic MFA User",
        loginIdentifier: `mfa-${suffix}@example.test`,
        passwordCredential: {
          create: { passwordHash: await hashPassword("correct horse battery staple") },
        },
        roles: { create: { roleId: role.id } },
      },
    });
    const secret = generateTotpSecret();
    await repository.enrollTotp(
      user.id,
      encryptEnvelope(
        new TextEncoder().encode(secret),
        deriveKey("integration-pepper", "mfa"),
        "integration-mfa-key",
        `mfa:${user.id}`,
      ),
    );
    const counter = Math.floor(Date.now() / 30_000);
    const code = totpCode(secret, counter);
    expect(await repository.verifyMfa(user.id, code)).toBe(true);
    expect(await repository.verifyMfa(user.id, code)).toBe(false);

    const recovery = await repository.rotateRecoveryCodes(user.id);
    expect(recovery).toHaveLength(10);
    expect(await repository.consumeRecoveryCode(user.id, recovery[0])).toBe(true);
    expect(await repository.consumeRecoveryCode(user.id, recovery[0])).toBe(false);
  });
});

function totpCode(secret: string, counter: number): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret) bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  const key = Buffer.alloc(Math.floor(bits.length / 8));
  for (let index = 0; index < key.length; index += 1)
    key[index] = Number.parseInt(bits.slice(index * 8, index * 8 + 8), 2);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}
