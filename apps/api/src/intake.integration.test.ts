import "reflect-metadata";

import { randomUUID } from "node:crypto";

import { loadRuntimeConfig } from "@kapas/config";
import { createDatabaseClient, type DatabaseClient } from "@kapas/database";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApplication } from "./application";

const enabled = process.env.TEST_DATABASE_URL && process.env.REDIS_URL;
const integration = enabled ? describe : describe.skip;
let app: Awaited<ReturnType<typeof createApplication>>;
let client: DatabaseClient;

integration("complaint intake and evidence pipeline", () => {
  beforeAll(async () => {
    client = createDatabaseClient({ connectionString: process.env.TEST_DATABASE_URL as string });
    const config = loadRuntimeConfig({
      ...process.env,
      NODE_ENV: "test",
      APP_VERSION: "0.1.0",
      API_HOST: "127.0.0.1",
      API_PORT: "4000",
      PUBLIC_API_URL: "http://127.0.0.1:4000",
      PORTAL_ORIGIN: "http://127.0.0.1:3000",
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      REDIS_URL: process.env.REDIS_URL,
      LOG_LEVEL: "silent",
      TRUST_PROXY_COUNT: "0",
      EVIDENCE_ROOT: "./storage/test-evidence",
      QUARANTINE_ROOT: "./storage/test-quarantine",
      ENCRYPTION_KEY_ID: "phase05-integration",
      SESSION_SECRET: "phase05-integration-session-secret-32-characters",
      IDENTITY_LOOKUP_PEPPER: "phase05-identity-lookup-pepper-32-characters",
      INTERNAL_METRICS_TOKEN: "phase05-integration-metrics-token",
      OPENAPI_ENABLED: "false",
      QUEUE_PREFIX: "kapas-phase05-integration",
    });
    app = await createApplication(config);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (client) await client.$disconnect();
  });

  it("accepts a V3 complaint before evidence delivery and replays the same receipt", async () => {
    const clientSubmissionId = randomUUID();
    const idempotencyKey = randomUUID();
    const clientMediaId = randomUUID();
    const payload = {
      clientSubmissionId,
      idempotencyKey,
      schemaVersion: 3,
      revision: 1,
      privacyMode: "ANON",
      complaint: {
        categoryCode: "WAG",
        subcategoryCode: "WAG-UNP",
        priority: "Standard",
        reporterType: "self",
        contactPreference: "do-not-initiate",
        incident: {
          whenLabel: "Today",
          currentDanger: false,
          immediateDanger: false,
          othersAffected: "individual",
          structuredAnswers: { wagePaid: false },
          schemaVersion: 3,
        },
        location: { province: "Punjab", district: "Lahore", source: "manual" },
      },
      attachments: [
        {
          clientMediaId,
          kind: "document",
          displayName: "proof.pdf",
          declaredMimeType: "application/pdf",
          totalBytes: 1024,
        },
      ],
    };

    const accepted = await app.inject({
      method: "POST",
      url: "/api/v3/intake-submissions",
      headers: { "idempotency-key": idempotencyKey },
      payload,
    });
    expect(accepted.statusCode).toBe(201);
    const receipt = accepted.json() as {
      referenceNumber: string;
      trackingSecret: string;
      evidenceStatus: string;
    };
    expect(receipt.referenceNumber).toMatch(/^KP-/u);
    expect(receipt.trackingSecret.length).toBeGreaterThan(20);
    expect(receipt.evidenceStatus).toBe("pending");

    const replay = await app.inject({
      method: "POST",
      url: "/api/v3/intake-submissions",
      headers: { "idempotency-key": idempotencyKey },
      payload,
    });
    expect(replay.statusCode).toBe(201);
    expect(replay.json()).toEqual(accepted.json());

    const recovered = await app.inject({
      method: "GET",
      url: `/api/v3/intake-submissions/${clientSubmissionId}`,
      headers: { "idempotency-key": idempotencyKey },
    });
    expect(recovered.statusCode).toBe(200);
    expect(recovered.json()).toEqual(accepted.json());

    const complaint = await client.complaint.findUniqueOrThrow({
      where: { clientSubmissionId },
      include: { evidenceDeclarations: true, intakeReceipt: true },
    });
    expect(complaint.evidenceDeclarations).toHaveLength(1);
    expect(complaint.intakeReceipt?.secretCiphertext).toBeInstanceOf(Uint8Array);
    expect(await client.complaint.count({ where: { clientSubmissionId } })).toBe(1);

    const delivery = await app.inject({
      method: "GET",
      url: `/api/v3/complaints/${receipt.referenceNumber}/delivery`,
      headers: { "x-tracking-secret": receipt.trackingSecret },
    });
    expect(delivery.statusCode).toBe(200);
    expect(delivery.json()).toMatchObject({
      acknowledged: true,
      evidenceStatus: "pending",
      evidence: [{ clientMediaId, status: "declared", uploadedBytes: 0, totalBytes: 1024 }],
    });

    const unauthorizedGrant = await app.inject({
      method: "POST",
      url: `/api/v3/complaints/${receipt.referenceNumber}/evidence/${clientMediaId}/grant`,
      headers: { "x-tracking-secret": "not-the-tracking-secret" },
    });
    expect(unauthorizedGrant.statusCode).toBe(401);

    const granted = await app.inject({
      method: "POST",
      url: `/api/v3/complaints/${receipt.referenceNumber}/evidence/${clientMediaId}/grant`,
      headers: { "x-tracking-secret": receipt.trackingSecret },
    });
    expect(granted.statusCode).toBe(201);
    expect(granted.json()).toMatchObject({
      clientMediaId,
      uploadUrl: expect.stringContaining("/files/"),
      metadata: { clientMediaId, kind: "document", filetype: "application/pdf" },
    });
    expect((granted.json() as { uploadToken: string }).uploadToken.length).toBeGreaterThan(20);

    const replayedGrant = await app.inject({
      method: "POST",
      url: `/api/v3/complaints/${receipt.referenceNumber}/evidence/${clientMediaId}/grant`,
      headers: { "x-tracking-secret": receipt.trackingSecret },
    });
    expect(replayedGrant.statusCode).toBe(201);
    expect(replayedGrant.json()).toEqual(granted.json());

    const omitted = await app.inject({
      method: "POST",
      url: `/api/v3/complaints/${receipt.referenceNumber}/evidence/${clientMediaId}/omit`,
      headers: { "x-tracking-secret": receipt.trackingSecret },
    });
    expect(omitted.statusCode).toBe(201);
    expect(omitted.json()).toMatchObject({ evidenceStatus: "none" });
  });

  it("rejects a V3 idempotency key reused with changed content", async () => {
    const clientSubmissionId = randomUUID();
    const idempotencyKey = randomUUID();
    const payload = {
      clientSubmissionId,
      idempotencyKey,
      schemaVersion: 3,
      revision: 1,
      privacyMode: "ANON",
      complaint: {
        categoryCode: "WAG",
        priority: "Standard",
        reporterType: "self",
        contactPreference: "do-not-initiate",
        incident: {
          whenLabel: "Today",
          currentDanger: false,
          immediateDanger: false,
          othersAffected: "individual",
          structuredAnswers: {},
          schemaVersion: 3,
        },
        location: { province: "Punjab", district: "Lahore", source: "manual" },
      },
      attachments: [],
    };
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/api/v3/intake-submissions",
          headers: { "idempotency-key": idempotencyKey },
          payload,
        })
      ).statusCode,
    ).toBe(201);
    const conflict = await app.inject({
      method: "POST",
      url: "/api/v3/intake-submissions",
      headers: { "idempotency-key": idempotencyKey },
      payload: { ...payload, revision: 2 },
    });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.json()).toMatchObject({
      code: "idempotency_payload_conflict",
      disposition: "user_action",
      messageKey: "errors.idempotency_payload_conflict",
    });
  });

  it("implements tus creation, authoritative offsets, binary patches, and termination", async () => {
    const clientSubmissionId = `tus-${randomUUID()}`;
    const metadata = [
      ["kind", "document"],
      ["clientSubmissionId", clientSubmissionId],
      ["mediaId", randomUUID()],
      ["fileName", "evidence.pdf"],
      ["mimeType", "application/pdf"],
    ]
      .map(([key, value]) => `${key} ${Buffer.from(value!).toString("base64")}`)
      .join(",");
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "tus-resumable": "1.0.0", "upload-length": "6", "upload-metadata": metadata },
    });
    expect(created.statusCode).toBe(201);
    expect(created.headers["tus-resumable"]).toBe("1.0.0");
    const location = String(created.headers.location);
    const firstToken = String(created.headers["upload-token"]);

    const recreated = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      headers: { "tus-resumable": "1.0.0", "upload-length": "6", "upload-metadata": metadata },
    });
    expect(recreated.statusCode).toBe(201);
    expect(recreated.headers.location).toBe(location);
    expect(recreated.headers["upload-offset"]).toBe("0");
    const token = String(recreated.headers["upload-token"]);
    expect(token).not.toBe(firstToken);

    const first = await app.inject({
      method: "PATCH",
      url: location,
      headers: {
        "tus-resumable": "1.0.0",
        "upload-token": token,
        "upload-offset": "0",
        "content-type": "application/offset+octet-stream",
      },
      payload: Buffer.from("%PD"),
    });
    expect(first.statusCode).toBe(204);
    expect(first.headers["upload-offset"]).toBe("3");

    const conflict = await app.inject({
      method: "PATCH",
      url: location,
      headers: {
        "tus-resumable": "1.0.0",
        "upload-token": token,
        "upload-offset": "0",
        "content-type": "application/offset+octet-stream",
      },
      payload: Buffer.from("F-x"),
    });
    expect(conflict.statusCode).toBe(409);
    expect(conflict.headers["upload-offset"]).toBe("3");

    const head = await app.inject({
      method: "HEAD",
      url: location,
      headers: { "tus-resumable": "1.0.0", "upload-token": token },
    });
    expect(head.statusCode).toBe(200);
    expect(head.headers["upload-offset"]).toBe("3");
    expect(head.headers["upload-length"]).toBe("6");

    const completed = await app.inject({
      method: "PATCH",
      url: location,
      headers: {
        "tus-resumable": "1.0.0",
        "upload-token": token,
        "upload-offset": "3",
        "content-type": "application/offset+octet-stream",
      },
      payload: Buffer.from("F-x"),
    });
    expect(completed.statusCode).toBe(204);
    expect(completed.headers["upload-status"]).toBe("processing");

    const removed = await app.inject({
      method: "DELETE",
      url: location,
      headers: { "upload-token": token },
    });
    expect(removed.statusCode).toBe(200);
    await expect(
      client.uploadSession.findUniqueOrThrow({ where: { id: location.split("/").at(-1)! } }),
    ).resolves.toMatchObject({ status: "expired", rejectionCode: "cancelled" });
  });

  it("resumes an upload and persists a protected complaint exactly once", async () => {
    const clientSubmissionId = `phase05-${randomUUID()}`;
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      payload: {
        kind: "photo",
        clientSubmissionId,
        fileName: "worker-photo.jpg",
        mimeType: "image/jpeg",
        size: 6,
      },
    });
    expect(created.statusCode).toBe(201);
    const grant = created.json() as { uploadId: string; uploadToken: string };
    const first = Buffer.from([0xff, 0xd8, 0xff]).toString("base64");
    const second = Buffer.from([0x00, 0x01, 0x02]).toString("base64");
    const partOne = await app.inject({
      method: "PATCH",
      url: `/api/v1/uploads/${grant.uploadId}`,
      headers: { "x-upload-token": grant.uploadToken },
      payload: { offset: 0, chunkBase64: first, complete: false },
    });
    expect(partOne.statusCode).toBe(200);
    const completed = await app.inject({
      method: "PATCH",
      url: `/api/v1/uploads/${grant.uploadId}`,
      headers: { "x-upload-token": grant.uploadToken },
      payload: { offset: 3, chunkBase64: second, complete: true },
    });
    expect(completed.statusCode).toBe(200);

    const submission = await app.inject({
      method: "POST",
      url: "/api/v1/complaints",
      payload: {
        clientSubmissionId,
        idempotencyKey: randomUUID(),
        schemaVersion: 1,
        privacyMode: "ANON",
        categoryCode: "WAG",
        subcategoryCode: "WAG-UNP",
        reporterType: "self",
        contactAllowed: false,
        incident: {
          whenLabel: "This week",
          currentDanger: false,
          immediateDanger: false,
          othersAffected: "individual",
          structuredAnswers: {},
        },
        location: { province: "Punjab", district: "Lahore", source: "manual" },
        uploads: [{ id: grant.uploadId, token: grant.uploadToken }],
      },
    });
    expect(submission.statusCode).toBe(201);
    const response = submission.json() as {
      complaintId: string;
      referenceNumber: string;
      trackingSecret: string;
    };
    expect(response.referenceNumber).toMatch(/^KP-/);
    expect(response.trackingSecret.length).toBeGreaterThan(20);
    expect(
      await client.evidenceAsset.count({
        where: { complaintId: response.complaintId, availabilityState: "available" },
      }),
    ).toBe(1);
    expect(
      await client.workerCredential.count({ where: { complaintId: response.complaintId } }),
    ).toBe(1);
    expect(
      await client.uploadSession.findUniqueOrThrow({ where: { id: grant.uploadId } }),
    ).toMatchObject({ status: "attached" });

    const workerSession = await app.inject({
      method: "POST",
      url: "/api/v1/worker-sessions",
      payload: {
        referenceNumber: response.referenceNumber,
        trackingSecret: response.trackingSecret,
      },
    });
    expect(workerSession.statusCode).toBe(201);
    const sessionToken = (workerSession.json() as { sessionToken: string }).sessionToken;
    const detail = await app.inject({
      method: "GET",
      url: `/api/v1/worker/complaints/${response.referenceNumber}`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(detail.statusCode).toBe(200);
    expect(detail.json()).toMatchObject({
      evidence: [{ id: grant.uploadId, kind: "photo", originalName: "worker-photo.jpg" }],
    });

    const unauthenticatedPhoto = await app.inject({
      method: "GET",
      url: `/api/v1/worker/complaints/${response.referenceNumber}/evidence/${grant.uploadId}/content`,
    });
    expect(unauthenticatedPhoto.statusCode).toBe(401);

    const photo = await app.inject({
      method: "GET",
      url: `/api/v1/worker/complaints/${response.referenceNumber}/evidence/${grant.uploadId}/content`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(photo.statusCode).toBe(200);
    expect(photo.headers["content-type"]).toContain("image/jpeg");
    expect(photo.headers["cache-control"]).toContain("no-store");
    expect(photo.rawPayload).toEqual(Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]));
  });

  it("rejects identity fields for anonymous submissions and malware signatures", async () => {
    const clientSubmissionId = `phase05-reject-${randomUUID()}`;
    const rejected = await app.inject({
      method: "POST",
      url: "/api/v1/complaints",
      payload: {
        clientSubmissionId,
        idempotencyKey: randomUUID(),
        privacyMode: "ANON",
        categoryCode: "WAG",
        reporterType: "self",
        contactAllowed: false,
        privateIdentity: { kind: "phone", value: "+923001234567" },
        incident: {
          whenLabel: "Today",
          currentDanger: false,
          immediateDanger: false,
          othersAffected: "individual",
          structuredAnswers: {},
        },
        location: { province: "Punjab", district: "Lahore" },
      },
    });
    expect(rejected.statusCode).toBe(400);

    const created = await app.inject({
      method: "POST",
      url: "/api/v1/uploads",
      payload: {
        kind: "document",
        clientSubmissionId,
        fileName: "bad.pdf",
        mimeType: "application/pdf",
        size: 45,
      },
    });
    const grant = created.json() as { uploadId: string; uploadToken: string };
    const malware = Buffer.from("%PDF-EICAR-STANDARD-ANTIVIRUS-TEST-FILE").toString("base64");
    const scan = await app.inject({
      method: "PATCH",
      url: `/api/v1/uploads/${grant.uploadId}`,
      headers: { "x-upload-token": grant.uploadToken },
      payload: { offset: 0, chunkBase64: malware, complete: true },
    });
    expect(scan.statusCode).toBe(400);
  });

  it("accepts identified mobile submissions and persists identity separately", async () => {
    const clientSubmissionId = `phase05-identified-${randomUUID()}`;
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/complaints",
      payload: {
        clientSubmissionId,
        idempotencyKey: clientSubmissionId,
        schemaVersion: 1,
        privacyMode: "IDEN",
        categoryCode: "WAG",
        subcategoryCode: "WAG-UNP",
        reporterType: "self",
        contactAllowed: false,
        privateIdentity: { kind: "phone", value: "03001234567" },
        incident: {
          whenLabel: "This week",
          currentDanger: false,
          immediateDanger: false,
          othersAffected: "individual",
          structuredAnswers: { subcategory: "WAG-UNP" },
        },
        location: { province: "Punjab", district: "Lahore", source: "manual" },
        uploads: [],
      },
    });

    expect(response.statusCode).toBe(201);
    const created = response.json() as { complaintId: string; referenceNumber: string };
    expect(created.referenceNumber).toMatch(/^KP-/);
    await expect(
      client.privateReporterIdentity.findUnique({ where: { complaintId: created.complaintId } }),
    ).resolves.toMatchObject({ kind: "phone", displaySuffix: "4567" });
  });

  it("scopes worker communication to the authenticated complaint and deduplicates writes", async () => {
    const clientSubmissionId = `phase06-worker-${randomUUID()}`;
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/complaints",
      payload: {
        clientSubmissionId,
        idempotencyKey: randomUUID(),
        schemaVersion: 1,
        privacyMode: "ANON",
        categoryCode: "WAG",
        reporterType: "self",
        contactAllowed: false,
        incident: {
          whenLabel: "Today",
          currentDanger: false,
          immediateDanger: false,
          othersAffected: "individual",
          structuredAnswers: {},
        },
        location: { province: "Punjab", district: "Lahore", source: "manual" },
      },
    });
    expect(created.statusCode).toBe(201);
    const complaint = created.json() as {
      referenceNumber: string;
      trackingSecret: string;
      version: number;
    };
    const session = await app.inject({
      method: "POST",
      url: "/api/v1/worker-sessions",
      payload: complaint,
    });
    expect(session.statusCode).toBe(201);
    const setCookie = session.headers["set-cookie"];
    const cookie = Array.isArray(setCookie)
      ? setCookie[0]?.split(";", 1)[0]
      : String(setCookie).split(";", 1)[0];
    expect(cookie).toMatch(/^kapas_worker_session=/);
    const sessionToken = (session.json() as { sessionToken: string }).sessionToken;
    expect(sessionToken).toBeTruthy();

    const list = await app.inject({
      method: "GET",
      url: "/api/v1/worker/complaints",
      headers: { cookie },
    });
    expect(list.statusCode).toBe(200);
    expect(list.json()).toHaveLength(1);
    expect(list.json()[0]).not.toHaveProperty("privateIdentity");
    expect(list.json()[0]).toMatchObject({
      referenceNumber: complaint.referenceNumber,
      privacyMode: "ANON",
      location: { province: "Punjab", district: "Lahore" },
      incident: { whenLabel: "Today", currentDanger: false },
      evidence: [],
    });
    const mobileDetail = await app.inject({
      method: "GET",
      url: `/api/v1/worker/complaints/${complaint.referenceNumber}`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(mobileDetail.statusCode).toBe(200);
    expect(mobileDetail.json()).toMatchObject({ referenceNumber: complaint.referenceNumber });

    const feedback = await app.inject({
      method: "POST",
      url: `/api/v1/worker/complaints/${complaint.referenceNumber}/feedback`,
      headers: { cookie },
      payload: {
        expectedVersion: complaint.version,
        outcome: "partial",
        requestId: `feedback-${clientSubmissionId}`,
      },
    });
    expect(feedback.statusCode, feedback.body).toBe(201);
    const feedbackAgain = await app.inject({
      method: "POST",
      url: `/api/v1/worker/complaints/${complaint.referenceNumber}/feedback`,
      headers: { cookie },
      payload: {
        expectedVersion: complaint.version,
        outcome: "partial",
        requestId: `feedback-${clientSubmissionId}`,
      },
    });
    expect(feedbackAgain.statusCode).toBe(201);
    expect(
      await client.workerFeedback.count({ where: { requestId: `feedback-${clientSubmissionId}` } }),
    ).toBe(1);

    const information = await app.inject({
      method: "POST",
      url: `/api/v1/worker/complaints/${complaint.referenceNumber}/information-responses`,
      headers: { cookie },
      payload: { requestId: `info-${clientSubmissionId}`, answers: { available: true } },
    });
    expect(information.statusCode).toBe(201);
    const informationAgain = await app.inject({
      method: "POST",
      url: `/api/v1/worker/complaints/${complaint.referenceNumber}/information-responses`,
      headers: { cookie },
      payload: { requestId: `info-${clientSubmissionId}`, answers: { available: true } },
    });
    expect(informationAgain.statusCode).toBe(201);
    expect(
      await client.workerInformationResponse.count({
        where: { requestId: `info-${clientSubmissionId}` },
      }),
    ).toBe(1);

    const wrongReference = await app.inject({
      method: "GET",
      url: "/api/v1/worker/complaints/KP-NOT-YOURS",
      headers: { cookie },
    });
    expect(wrongReference.statusCode).toBe(404);
  });

  it("links multiple v2 complaints to one identity history session", async () => {
    const phone = `030${String(Date.now()).slice(-8)}`;
    const create = async (suffix: string) =>
      app.inject({
        method: "POST",
        url: "/api/v1/complaints",
        payload: {
          clientSubmissionId: `history-${suffix}-${randomUUID()}`,
          idempotencyKey: randomUUID(),
          schemaVersion: 2,
          privacyMode: "CONF",
          categoryCode: "WAG",
          subcategoryCode: "WAG-UNP",
          reporterType: "self",
          contactPreference: "call",
          privateReporter: { phone },
          incident: {
            whenLabel: "Today",
            currentDanger: false,
            immediateDanger: false,
            othersAffected: "individual",
            structuredAnswers: { contactPreference: "call" },
          },
          location: { province: "Punjab", district: "Lahore", source: "manual" },
          uploads: [],
        },
      });
    const first = await create("one");
    expect(first.statusCode, first.body).toBe(201);
    const second = await create("two");
    expect(second.statusCode, second.body).toBe(201);
    const authenticated = await app.inject({
      method: "POST",
      url: "/api/v1/worker-history-sessions",
      payload: { phone },
    });
    expect(authenticated.statusCode).toBe(201);
    const token = (authenticated.json() as { sessionToken: string }).sessionToken;
    const list = await app.inject({
      method: "GET",
      url: "/api/v1/worker/complaints",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(list.statusCode).toBe(200);
    const body = list.json() as { items: Array<{ submittedAt: string }> };
    expect(body.items).toHaveLength(2);
    expect(body.items[0]!.submittedAt >= body.items[1]!.submittedAt).toBe(true);
  });
});
