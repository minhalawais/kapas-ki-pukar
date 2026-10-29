import { randomUUID } from "node:crypto";

export type V3EvidenceUploadResult = {
  referenceNumber: string;
  clientSubmissionId: string;
  clientMediaId: string;
  uploadedBytes: number;
  totalBytes: number;
  rowStatus: string;
  evidenceStatus: string;
};

function tusMetadata(fields: Record<string, string>) {
  return Object.entries(fields)
    .map(([key, value]) => `${key} ${Buffer.from(value, "utf8").toString("base64")}`)
    .join(",");
}

function resolveUploadUrl(grantUrl: string, locationHeader: string) {
  if (locationHeader.startsWith("http://") || locationHeader.startsWith("https://")) {
    return locationHeader;
  }
  const base = grantUrl.endsWith("/") ? grantUrl : `${grantUrl}/`;
  return new URL(locationHeader.replace(/^\//u, ""), base).toString();
}

async function assertOk(response: Response, step: string) {
  if (response.ok) return response;
  const body = await response.text();
  throw new Error(`${step} failed: HTTP ${response.status} ${body.slice(0, 500)}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Same HTTP sequence as mobile `complaintPipelineV3Service` (submit → grant → TUS → delivery poll). */
export async function runV3EvidenceUploadFlow(apiBase: string): Promise<V3EvidenceUploadResult> {
  const base = apiBase.trim().replace(/\/$/u, "");
  const tusBase = `${base}/files/`;

  const clientSubmissionId = randomUUID();
  const idempotencyKey = randomUUID();
  const clientMediaId = randomUUID();
  const fileBytes = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\n%%EOF\n", "utf8");
  const totalBytes = fileBytes.length;

  const intakePayload = {
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
        displayName: "evidence-upload-test.pdf",
        declaredMimeType: "application/pdf",
        totalBytes,
      },
    ],
  };

  const intake = await fetch(`${base}/api/v3/intake-submissions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": idempotencyKey,
    },
    body: JSON.stringify(intakePayload),
  });
  await assertOk(intake, "intake");
  const receipt = (await intake.json()) as { referenceNumber: string; trackingSecret: string };

  const grantRes = await fetch(
    `${base}/api/v3/complaints/${encodeURIComponent(receipt.referenceNumber)}/evidence/${encodeURIComponent(clientMediaId)}/grant`,
    {
      method: "POST",
      headers: { "x-tracking-secret": receipt.trackingSecret },
    },
  );
  await assertOk(grantRes, "grant");
  const grant = (await grantRes.json()) as {
    evidenceId: string;
    uploadToken: string;
    uploadUrl: string;
    metadata: { grantId: string };
  };
  const grantId = grant.metadata.grantId;
  const uploadToken = grant.uploadToken;

  const create = await fetch(tusBase, {
    method: "POST",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Length": String(totalBytes),
      "Upload-Metadata": tusMetadata({
        grantId,
        evidenceId: grant.evidenceId,
        clientMediaId,
        kind: "document",
        filetype: "application/pdf",
      }),
      "Upload-Token": uploadToken,
    },
  });
  await assertOk(create, "tus-create");
  const location = create.headers.get("location");
  if (!location) throw new Error("tus-create missing Location header");
  let uploadUrl = resolveUploadUrl(grant.uploadUrl ?? tusBase, location);
  try {
    const resolved = new URL(uploadUrl);
    const expected = new URL(tusBase);
    if (resolved.host !== expected.host) {
      resolved.host = expected.host;
      resolved.protocol = expected.protocol;
      uploadUrl = resolved.toString();
    }
  } catch {
    /* keep tusd location as returned */
  }

  const patch = await fetch(uploadUrl, {
    method: "PATCH",
    headers: {
      "Tus-Resumable": "1.0.0",
      "Upload-Offset": "0",
      "Upload-Token": uploadToken,
      "Content-Type": "application/offset+octet-stream",
    },
    body: fileBytes,
  });
  if (patch.status !== 204) {
    const body = await patch.text();
    throw new Error(`tus-patch failed: HTTP ${patch.status} ${body.slice(0, 500)}`);
  }

  let lastRow: { status?: string; uploadedBytes?: number; totalBytes?: number } | null = null;
  let evidenceStatus = "";
  for (let attempt = 1; attempt <= 45; attempt += 1) {
    const deliveryRes = await fetch(
      `${base}/api/v3/complaints/${encodeURIComponent(receipt.referenceNumber)}/delivery`,
      { headers: { "x-tracking-secret": receipt.trackingSecret } },
    );
    await assertOk(deliveryRes, "delivery");
    const delivery = (await deliveryRes.json()) as {
      evidenceStatus: string;
      evidence: Array<{
        clientMediaId: string;
        status: string;
        uploadedBytes: number;
        totalBytes: number;
      }>;
    };
    evidenceStatus = delivery.evidenceStatus;
    lastRow =
      delivery.evidence.find((row) => row.clientMediaId === clientMediaId) ??
      delivery.evidence[0] ??
      null;
    const uploaded = Number(lastRow?.uploadedBytes ?? 0);
    const total = Number(lastRow?.totalBytes ?? totalBytes);
    const status = lastRow?.status ?? "unknown";
    if (uploaded >= total && status !== "declared") {
      return {
        referenceNumber: receipt.referenceNumber,
        clientSubmissionId,
        clientMediaId,
        uploadedBytes: uploaded,
        totalBytes: total,
        rowStatus: status,
        evidenceStatus,
      };
    }
    await sleep(2000);
  }

  throw new Error(
    `Evidence bytes did not persist after upload (last=${JSON.stringify(lastRow)}). Check tus hooks, worker, and object storage.`,
  );
}

export async function isTusdReachable(
  internalUrl = "http://127.0.0.1:1080/files/",
): Promise<boolean> {
  try {
    const response = await fetch(internalUrl, { method: "GET" });
    return response.status === 405 || response.status === 200 || response.status === 404;
  } catch {
    return false;
  }
}
