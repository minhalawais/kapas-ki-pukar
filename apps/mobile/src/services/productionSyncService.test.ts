import { beforeEach, describe, expect, it, vi } from "vitest";

import { productionSyncService } from "./productionSyncService";

const storage = new Map<string, string>();
const secureStorage = new Map<string, string>();
const fileSizes = new Map<string, number>();
const uploadStarts: Array<{ options: Record<string, unknown> }> = [];

vi.mock("expo-constants", () => ({ default: { appOwnership: null } }));
vi.mock("@react-native-async-storage/async-storage", () => ({ default: {
  getItem: async (key: string) => storage.get(key) ?? null,
  setItem: async (key: string, value: string) => { storage.set(key, value); },
  removeItem: async (key: string) => { storage.delete(key); },
} }));
vi.mock("expo-secure-store", () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device",
  getItemAsync: vi.fn(async (key: string) => secureStorage.get(key) ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => { secureStorage.set(key, value); }),
  deleteItemAsync: vi.fn(async (key: string) => { secureStorage.delete(key); }),
}));
vi.mock("expo-crypto", () => ({ getRandomBytes: (size: number) => Uint8Array.from({ length: size }, (_, index) => index + 1) }));
vi.mock("expo-file-system", () => ({
  File: class MockFile {
    uri: string;
    constructor(uri: string) { this.uri = uri; }
    get exists() { return fileSizes.has(this.uri); }
    get size() { return fileSizes.get(this.uri) ?? 0; }
    open() {
      return { offset: 0, readBytes: (length: number) => new Uint8Array(length), close: () => undefined };
    }
  },
}));
vi.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file://documents/",
  makeDirectoryAsync: vi.fn(async () => undefined),
  copyAsync: vi.fn(async ({ from, to }: { from: string; to: string }) => {
    const size = fileSizes.get(from);
    if (size === undefined) throw new Error("missing");
    fileSizes.set(to, size);
  }),
  deleteAsync: vi.fn(async (uri: string) => { fileSizes.delete(uri); }),
}));
vi.mock("tus-js-client", () => ({
  Upload: class MockUpload {
    static terminate = vi.fn(async () => undefined);
    options: Record<string, unknown>;
    constructor(_file: unknown, options: Record<string, unknown>) { this.options = options; uploadStarts.push(this); }
    start() {
      const total = this.options.uploadSize as number;
      (this.options.onChunkComplete as (size: number, accepted: number, total: number) => void)?.(Math.min(total, 2), Math.min(total, 2), total);
      (this.options.onChunkComplete as (size: number, accepted: number, total: number) => void)?.(Math.max(0, total - 2), total, total);
      (this.options.onSuccess as () => void)?.();
    }
    async abort() { return undefined; }
  },
}));

const draft = (id: string, uri?: string) => ({
  id, stepId: "review", privacyMode: "ANON" as const,
  reporterIdentity: { mode: "anonymous" as const, cnicVerified: false as const },
  category: "WAG" as const,
  incident: { whenLabel: "today", currentDanger: false, immediateDanger: false,
    othersAffected: "individual" as const, structuredAnswers: { subcategory: "WAG-UNP" } },
  location: { province: "Punjab", district: "Lahore", source: "manual" as const },
  evidence: uri ? [{ id: "media-1", kind: "document" as const, localUri: uri,
    fileName: "report.pdf", mimeType: "application/pdf", capturedAt: new Date().toISOString() }] : [],
  voice: null, updatedAt: new Date().toISOString(),
});

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name.toLowerCase()] ?? null };
}

describe("durable production sync", () => {
  beforeEach(async () => {
    vi.useRealTimers();
    vi.stubEnv("EXPO_PUBLIC_API_URL", "http://api.test:4000");
    storage.clear(); secureStorage.clear(); fileSizes.clear(); uploadStarts.length = 0;
    await productionSyncService.clear();
  });

  it("rejects an empty attachment before adding a queue card", async () => {
    fileSizes.set("file://empty.pdf", 0);
    await expect(productionSyncService.stageDraft(draft("empty", "file://empty.pdf"))).rejects.toMatchObject({ code: "empty_file" });
    await expect(productionSyncService.get("empty")).resolves.toMatchObject({ media: [] });
  });

  it("enforces attachment count and aggregate quotas before submission", async () => {
    const base = draft("limits");
    for (let index = 0; index < 6; index += 1) fileSizes.set(`file://doc-${index}.pdf`, 1024);
    const tooMany = { ...base, evidence: Array.from({ length: 6 }, (_, index) => ({
      id: `doc-${index}`, kind: "document" as const, localUri: `file://doc-${index}.pdf`,
      fileName: `doc-${index}.pdf`, mimeType: "application/pdf", capturedAt: new Date().toISOString(),
    })) };
    await expect(productionSyncService.enqueue(tooMany)).rejects.toMatchObject({ code: "attachment_count_limit" });
    await productionSyncService.clear();

    fileSizes.set("file://large.pdf", 15 * 1024 * 1024);
    fileSizes.set("file://voice.m4a", 25 * 1024 * 1024);
    fileSizes.set("file://photo.jpg", 10 * 1024 * 1024);
    fileSizes.set("file://extra.jpg", 1);
    const aggregate = {
      ...base,
      voice: { id: "voice", localUri: "file://voice.m4a", durationMs: 1_000,
        recordedAt: new Date().toISOString(), locale: "en" as const },
      evidence: [
        { id: "large", kind: "document" as const, localUri: "file://large.pdf", fileName: "large.pdf", mimeType: "application/pdf", capturedAt: new Date().toISOString() },
        { id: "photo", kind: "photo" as const, localUri: "file://photo.jpg", fileName: "photo.jpg", mimeType: "image/jpeg", capturedAt: new Date().toISOString() },
        { id: "extra", kind: "photo" as const, localUri: "file://extra.jpg", fileName: "extra.jpg", mimeType: "image/jpeg", capturedAt: new Date().toISOString() },
      ],
    };
    await expect(productionSyncService.enqueue(aggregate)).rejects.toMatchObject({ code: "aggregate_limit" });
  });

  it("uses 1 MiB tus chunks, persists processing, and acknowledges only after scan completion", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
    fileSizes.set("file://report.pdf", 4);
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${input}`);
      if (input.endsWith("/uploads")) return { ok: true, status: 201,
        headers: headers({ location: "/api/v1/uploads/u1", "upload-token": "secret", "upload-expires": "Thu, 22 Oct 2026 12:00:00 GMT" }) };
      if (input.endsWith("/status")) return { ok: true, status: 200, json: async () => ({ status: "complete" }) };
      if (input.endsWith("/complaints")) return { ok: true, status: 201,
        json: async () => ({ referenceNumber: "KP-TEST", trackingSecret: "track" }) };
      return { ok: true, status: 200, headers: headers({ "upload-offset": "4", "upload-status": "processing" }) };
    }));

    await productionSyncService.enqueue(draft("submission-1", "file://report.pdf"));
    await expect(productionSyncService.process()).resolves.toEqual({ acknowledged: 0, retryableFailed: 0, blocked: 0 });
    await expect(productionSyncService.get("submission-1")).resolves.toMatchObject({ status: "uploading", media: [{ uploadedBytes: 4, state: "processing" }] });
    expect(uploadStarts[0]?.options.chunkSize).toBe(1024 * 1024);
    expect(uploadStarts[0]?.options.retryDelays).toBeNull();

    await vi.advanceTimersByTimeAsync(3_000);
    await expect(productionSyncService.process()).resolves.toEqual({ acknowledged: 1, retryableFailed: 0, blocked: 0 });
    await expect(productionSyncService.get("submission-1")).resolves.toMatchObject({ status: "acknowledged", referenceNumber: "KP-TEST" });
    expect(calls.some((call) => call === "POST http://api.test:4000/api/v1/complaints")).toBe(true);
    expect(secureStorage.get("kapas.tracking-secret.KP-TEST")).toBe("track");
  });

  it("does not submit a complaint while its scan remains in processing", async () => {
    vi.useFakeTimers();
    fileSizes.set("file://report.pdf", 4);
    const complaint = vi.fn();
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      if (input.endsWith("/uploads")) return { ok: true, status: 201,
        headers: headers({ location: "/api/v1/uploads/u2", "upload-token": "secret" }) };
      if (input.endsWith("/status")) return { ok: true, status: 200, json: async () => ({ status: "processing" }) };
      if (input.endsWith("/complaints")) complaint();
      return { ok: true, status: 200, headers: headers({ "upload-offset": "4", "upload-status": "processing" }) };
    }));
    await productionSyncService.enqueue(draft("processing", "file://report.pdf"));
    await productionSyncService.process();
    await vi.advanceTimersByTimeAsync(3_000);
    await productionSyncService.process();
    expect(complaint).not.toHaveBeenCalled();
  });

  it("joins simultaneous foreground retry invocations", async () => {
    await productionSyncService.enqueue(draft("join"));
    const fetchMock = vi.fn(async (input: string) => input.endsWith("/complaints")
      ? { ok: true, status: 201, json: async () => ({ referenceNumber: "KP-JOIN", trackingSecret: "track" }) }
      : { ok: false, status: 404 });
    vi.stubGlobal("fetch", fetchMock);
    const first = productionSyncService.process();
    const second = productionSyncService.process();
    await expect(Promise.all([first, second])).resolves.toEqual([
      { acknowledged: 1, retryableFailed: 0, blocked: 0 },
      { acknowledged: 1, retryableFailed: 0, blocked: 0 },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("runs another pass when a retry arrives during an active sync", async () => {
    await productionSyncService.enqueue(draft("active-first"));
    let releaseFirst!: () => void;
    let markStarted!: () => void;
    const firstStarted = new Promise<void>((resolve) => { markStarted = resolve; });
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    let complaintCalls = 0;
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      if (!input.endsWith("/complaints")) return { ok: false, status: 404 };
      complaintCalls += 1;
      if (complaintCalls === 1) {
        markStarted();
        await firstGate;
      }
      return { ok: true, status: 201,
        json: async () => ({ referenceNumber: `KP-RERUN-${complaintCalls}`, trackingSecret: "track" }) };
    }));

    const first = productionSyncService.process();
    await firstStarted;
    await productionSyncService.enqueue(draft("active-second"));
    const joined = productionSyncService.process();
    releaseFirst();

    await expect(Promise.all([first, joined])).resolves.toEqual([
      { acknowledged: 2, retryableFailed: 0, blocked: 0 },
      { acknowledged: 2, retryableFailed: 0, blocked: 0 },
    ]);
    expect(complaintCalls).toBe(2);
  });

  it("recovers a lost complaint response through the idempotent submission lookup", async () => {
    await productionSyncService.enqueue(draft("lost-response"));
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string, init?: RequestInit) => {
      calls.push(`${init?.method ?? "GET"} ${input}`);
      if (input.endsWith("/complaints")) return { ok: false, status: 503 };
      if (input.endsWith("/complaints/submissions/lost-response")) return {
        ok: true,
        status: 200,
        json: async () => ({ referenceNumber: "KP-RECOVERED", trackingSecret: "recovered-secret" }),
      };
      return { ok: false, status: 404 };
    }));

    await expect(productionSyncService.process()).resolves.toEqual({ acknowledged: 1, retryableFailed: 0, blocked: 0 });
    await expect(productionSyncService.get("lost-response")).resolves.toMatchObject({
      status: "acknowledged",
      referenceNumber: "KP-RECOVERED",
    });
    expect(calls).toEqual([
      "POST http://api.test:4000/api/v1/complaints",
      "GET http://api.test:4000/api/v1/complaints/submissions/lost-response",
    ]);
    expect(secureStorage.get("kapas.tracking-secret.KP-RECOVERED")).toBe("recovered-secret");
  });

  it("blocks submission when staged media disappears and keeps it for replacement", async () => {
    fileSizes.set("file://report.pdf", 4);
    await productionSyncService.enqueue(draft("missing", "file://report.pdf"));
    const staged = (await productionSyncService.get("missing"))!.media[0]!;
    fileSizes.delete(staged.uri);
    await expect(productionSyncService.process()).resolves.toEqual({ acknowledged: 0, retryableFailed: 0, blocked: 1 });
    await expect(productionSyncService.get("missing")).resolves.toMatchObject({
      status: "blocked", lastErrorCode: "media_unavailable", media: [{ state: "missing" }],
    });
  });

  it("does not automatically retry a permanent upload allocation rejection", async () => {
    fileSizes.set("file://report.pdf", 4);
    const fetchMock = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ code: "upload_count_limit", message: "Upload count exceeds the limit" }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    await productionSyncService.enqueue(draft("permanent-rejection", "file://report.pdf"));

    await expect(productionSyncService.process()).resolves.toEqual({ acknowledged: 0, retryableFailed: 0, blocked: 1 });
    await expect(productionSyncService.process()).resolves.toEqual({ acknowledged: 0, retryableFailed: 0, blocked: 0 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(productionSyncService.get("permanent-rejection")).resolves.toMatchObject({
      status: "blocked",
      lastErrorCode: "attachment_count_limit",
    });
  });
});
