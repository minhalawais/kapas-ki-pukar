import { randomUUID } from "node:crypto";

import {
  caseActionTypes,
  caseStatuses,
  subcategoryCodes,
  VersionConflictError,
  workerCategoryCodes,
} from "@kapas/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Prisma } from "./generated/prisma/client";

import {
  createDatabaseClient,
  IdempotencyConflictError,
  type DatabaseClient,
  PostgresComplaintRepository,
  PostgresEvidenceMetadataRepository,
  PostgresSensitiveReporterRepository,
  PrivacyInvariantError,
  syntheticComplaint,
} from "./index";

const databaseUrl = process.env.TEST_DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;
let client: DatabaseClient;
let repository: PostgresComplaintRepository;

function uniqueFixture(label: string) {
  const unique = `${label}-${randomUUID()}`;
  return syntheticComplaint({
    requestId: unique,
    idempotencyKeyHash: `idempotency-${unique}`,
    idempotencyScope: "integration",
  });
}

integration("production persistence", () => {
  beforeAll(() => {
    client = createDatabaseClient({
      connectionString: databaseUrl as string,
      maxConnections: 12,
      transactionMaxWaitMs: 10_000,
      transactionTimeoutMs: 30_000,
    });
    repository = new PostgresComplaintRepository(client);
  });

  afterAll(async () => {
    await client.$disconnect();
  });

  it("creates an anonymous complaint, history and outbox atomically and replays idempotently", async () => {
    const command = uniqueFixture("anon");
    const first = await repository.create(command);
    const replay = await repository.create(command);

    expect(replay).toEqual({ ...first, idempotentReplay: true });
    expect(first.referenceNumber).toMatch(/^KP-\d{2}-\d{6}$/);
    expect(await client.privateReporterIdentity.count({ where: { complaintId: first.id } })).toBe(
      0,
    );
    expect(await client.caseHistory.count({ where: { complaintId: first.id } })).toBe(1);
    expect(await client.outboxEvent.count({ where: { complaintId: first.id } })).toBe(1);
    expect(await client.auditEvent.count({ where: { complaintId: first.id } })).toBe(1);
  });

  it("rejects reuse of an idempotency key for a different semantic request", async () => {
    const command = uniqueFixture("idempotency-conflict");
    const created = await repository.create(command);

    await expect(
      repository.create({
        ...command,
        requestId: `changed-${randomUUID()}`,
        incident: { ...command.incident, description: "Different synthetic incident" },
      }),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
    expect(
      await client.complaint.count({ where: { referenceNumber: created.referenceNumber } }),
    ).toBe(1);
  });

  it("rejects identity for anonymous complaints in the repository and database", async () => {
    const encrypted = {
      kind: "phone" as const,
      ciphertext: Uint8Array.from([1, 2, 3]),
      nonce: Uint8Array.from({ length: 12 }, (_, index) => index),
      keyId: "test-key",
      algorithm: "AES-256-GCM" as const,
      displaySuffix: "1234",
    };
    await expect(
      repository.create({ ...uniqueFixture("anon-private"), privateIdentity: encrypted }),
    ).rejects.toBeInstanceOf(PrivacyInvariantError);

    const created = await repository.create(uniqueFixture("db-privacy"));
    await expect(
      client.privateReporterIdentity.create({
        data: {
          complaintId: created.id,
          ...encrypted,
        },
      }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  it("keeps private identity out of staff, worker and analytics projections", async () => {
    const command = uniqueFixture("confidential");
    const created = await repository.create({
      ...command,
      privacyMode: "CONF",
      contactAllowed: true,
      privateIdentity: {
        kind: "phone",
        ciphertext: Uint8Array.from([9, 8, 7, 6]),
        nonce: Uint8Array.from({ length: 12 }, (_, index) => index + 1),
        keyId: "integration-key",
        algorithm: "AES-256-GCM",
        displaySuffix: "7788",
      },
    });

    const staff = await repository.get(created.id);
    const worker = await repository.getByReference(created.referenceNumber);
    const analytics = await repository.listFacts(1_000);
    const sensitive = await new PostgresSensitiveReporterRepository(repository).get(created.id);

    expect(JSON.stringify(staff)).not.toContain("7788");
    expect(JSON.stringify(worker)).not.toContain("7788");
    expect(JSON.stringify(analytics)).not.toContain(created.id);
    expect(sensitive?.displaySuffix).toBe("7788");
  });

  it("writes lifecycle history and outbox in the same optimistic transaction", async () => {
    const created = await repository.create(uniqueFixture("lifecycle"));
    const reviewed = await repository.transition(
      {
        complaintId: created.id,
        expectedVersion: created.version,
        actorType: "staff",
        actorId: randomUUID(),
        requestId: `review-${randomUUID()}`,
      },
      "Triage",
    );

    expect(reviewed.version).toBe(2);
    expect(await client.caseHistory.count({ where: { complaintId: created.id } })).toBe(2);
    expect(await client.outboxEvent.count({ where: { complaintId: created.id } })).toBe(2);
    await expect(
      repository.changePriority(
        {
          complaintId: created.id,
          expectedVersion: created.version,
          actorType: "staff",
          requestId: `stale-${randomUUID()}`,
        },
        "High",
      ),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });

  it("leaves no partial history or outbox when a transition is invalid", async () => {
    const created = await repository.create(uniqueFixture("rollback"));
    const before = {
      history: await client.caseHistory.count({ where: { complaintId: created.id } }),
      outbox: await client.outboxEvent.count({ where: { complaintId: created.id } }),
    };
    await expect(
      repository.transition(
        {
          complaintId: created.id,
          expectedVersion: created.version,
          actorType: "staff",
          requestId: `invalid-${randomUUID()}`,
        },
        "Closed",
      ),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
    expect(await client.caseHistory.count({ where: { complaintId: created.id } })).toBe(
      before.history,
    );
    expect(await client.outboxEvent.count({ where: { complaintId: created.id } })).toBe(
      before.outbox,
    );
  });

  it("allocates unique references under concurrent creation", async () => {
    const created = await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        repository.create(uniqueFixture(`concurrent-${index}`)),
      ),
    );
    expect(new Set(created.map((row) => row.referenceNumber)).size).toBe(created.length);
  });

  it("retries a generated reference collision without duplicating the complaint", async () => {
    const referenceBits = randomUUID().replaceAll("-", "").toUpperCase();
    const collidedReference = `KP-${referenceBits.slice(0, 4)}-${referenceBits.slice(4, 8)}-${referenceBits.slice(8, 12)}`;
    const recoveredReference = `KP-${referenceBits.slice(12, 16)}-${referenceBits.slice(16, 20)}-${referenceBits.slice(20, 24)}`;
    const first = new PostgresComplaintRepository(client, () => collidedReference);
    await first.create(uniqueFixture("reference-owner"));

    const candidates = [collidedReference, recoveredReference];
    const retrying = new PostgresComplaintRepository(
      client,
      () => candidates.shift() ?? recoveredReference,
    );
    const created = await retrying.create(uniqueFixture("reference-collision"));
    expect(created.referenceNumber).toBe(recoveredReference);
    expect(await client.complaint.count({ where: { referenceNumber: collidedReference } })).toBe(1);
    expect(await client.complaint.count({ where: { referenceNumber: recoveredReference } })).toBe(
      1,
    );
  });

  it("collapses concurrent retries with one idempotency key to one complaint", async () => {
    const command = uniqueFixture("concurrent-idempotency");
    const results = await Promise.all(Array.from({ length: 4 }, () => repository.create(command)));
    expect(new Set(results.map((row) => row.id)).size).toBe(1);
    expect(
      await client.idempotencyRecord.count({
        where: { scope: command.idempotencyScope, keyHash: command.idempotencyKeyHash },
      }),
    ).toBe(1);
  });

  it("attaches approved evidence with history and outbox in one transaction", async () => {
    const created = await repository.create(uniqueFixture("evidence"));
    const evidenceRepository = new PostgresEvidenceMetadataRepository(client);
    const updated = await evidenceRepository.attachApproved(
      {
        complaintId: created.id,
        expectedVersion: created.version,
        actorType: "system",
        requestId: `evidence-${randomUUID()}`,
      },
      {
        storageId: randomUUID(),
        kind: "photo",
        originalName: "synthetic-photo.jpg",
        storageName: `${randomUUID()}.enc`,
        detectedMimeType: "image/jpeg",
        byteLength: 4n,
        sha256Digest: Uint8Array.from({ length: 32 }, (_, index) => index),
        encryptionKeyId: "integration-evidence-key",
        encryptionAlgorithm: "AES-256-GCM",
        uploaderActorType: "worker",
      },
    );
    expect(updated.version).toBe(created.version + 1);
    expect(await client.evidenceAsset.count({ where: { complaintId: created.id } })).toBe(1);
    expect(
      await client.caseHistory.count({
        where: { complaintId: created.id, actionType: "Evidence Added" },
      }),
    ).toBe(1);
    expect(
      await client.outboxEvent.count({
        where: { complaintId: created.id, eventType: "evidence.attached" },
      }),
    ).toBe(1);
  });

  it("enforces append-only history at the database boundary", async () => {
    const created = await repository.create(uniqueFixture("append-only"));
    const event = await client.caseHistory.findFirstOrThrow({ where: { complaintId: created.id } });
    await expect(
      client.caseHistory.update({ where: { id: event.id }, data: { visibility: "internal" } }),
    ).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
  });

  it("keeps database constraints aligned with domain codes", async () => {
    const constraints = await client.$queryRaw<Array<{ name: string; definition: string }>>`
      SELECT conname AS name, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conname IN (
        'complaints_category_code_check',
        'complaints_subcategory_code_check',
        'complaints_status_check',
        'case_history_action_type_check'
      )
    `;
    const joined = constraints.map((row) => row.definition).join("\n");
    for (const code of [
      ...workerCategoryCodes,
      ...subcategoryCodes,
      ...caseStatuses,
      ...caseActionTypes,
    ]) {
      expect(joined).toContain(code.replaceAll("'", "''"));
    }
  });

  it("uses the queue and outbox indexes for representative plans", async () => {
    const plans = await client.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL enable_seqscan = off");
      await tx.$executeRawUnsafe("SET LOCAL enable_bitmapscan = off");
      const queue = await tx.$queryRawUnsafe<Array<{ "QUERY PLAN": string }>>(
        "EXPLAIN SELECT id FROM complaints WHERE status = 'New' AND priority = 'Standard' ORDER BY submitted_at DESC LIMIT 50",
      );
      const outbox = await tx.$queryRawUnsafe<Array<{ "QUERY PLAN": string }>>(
        "EXPLAIN SELECT id FROM outbox_events WHERE status = 'pending' ORDER BY available_at LIMIT 100",
      );
      return [...queue, ...outbox].map((row) => row["QUERY PLAN"]).join("\n");
    });
    expect(plans).toContain("complaints_queue_idx");
    expect(plans).toContain("outbox_events_pending_idx");
  });
});
