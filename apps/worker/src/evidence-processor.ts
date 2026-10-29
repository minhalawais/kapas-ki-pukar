import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { constants, createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, open, rename, rm, writeFile } from "node:fs/promises";
import { connect } from "node:net";
import { dirname, join } from "node:path";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import { deriveKey } from "@kapas/security";

type UploadKind = "voice" | "photo" | "document";

export function detectMime(kind: UploadKind, header: Uint8Array, _declared: string): string | null {
  if (kind === "photo" && header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff)
    return "image/jpeg";
  const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (kind === "photo" && png.every((value, index) => header[index] === value)) return "image/png";
  if (kind === "document" && Buffer.from(header.subarray(0, 5)).toString() === "%PDF-")
    return "application/pdf";
  if (kind === "voice") {
    const ascii = Buffer.from(header).toString("latin1");
    if (ascii.slice(4, 8) === "ftyp") return "audio/mp4";
    if (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WAVE") return "audio/wav";
    if (ascii.startsWith("OggS")) return "audio/ogg";
    if (ascii.startsWith("ID3") || (header[0] === 0xff && ((header[1] ?? 0) & 0xe0) === 0xe0))
      return "audio/mpeg";
    if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3)
      return "audio/webm";
  }
  return null;
}

function clamdCommand(host: string, port: number, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port });
    const chunks: Buffer[] = [];
    socket.setTimeout(15_000);
    socket.once("connect", () => socket.end(`z${command}\0`));
    socket.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    socket.once("timeout", () => socket.destroy(new Error("ClamAV timed out")));
    socket.once("error", reject);
    socket.once("close", (hadError) => {
      if (!hadError) resolve(Buffer.concat(chunks).toString("utf8").replace(/\0+$/u, ""));
    });
  });
}

export async function scanFile(
  host: string,
  port: number,
  path: string,
): Promise<{ clean: boolean; result: string; version: string }> {
  const version = await clamdCommand(host, port, "VERSION");
  const result = await new Promise<string>((resolve, reject) => {
    const socket = connect({ host, port });
    const responses: Buffer[] = [];
    socket.setTimeout(120_000);
    socket.once("connect", () => {
      socket.write("zINSTREAM\0");
      const input = createReadStream(path, { highWaterMark: 64 * 1024 });
      input.on("data", (value) => {
        const chunk = Buffer.from(value as Buffer);
        const length = Buffer.allocUnsafe(4);
        length.writeUInt32BE(chunk.byteLength, 0);
        if (!socket.write(Buffer.concat([length, chunk]))) {
          input.pause();
          socket.once("drain", () => input.resume());
        }
      });
      input.once("end", () => socket.end(Buffer.alloc(4)));
      input.once("error", (error) => socket.destroy(error));
    });
    socket.on("data", (chunk) => responses.push(Buffer.from(chunk)));
    socket.once("timeout", () => socket.destroy(new Error("ClamAV scan timed out")));
    socket.once("error", reject);
    socket.once("close", (hadError) => {
      if (!hadError) resolve(Buffer.concat(responses).toString("utf8").replace(/\0+$/u, ""));
    });
  });
  if (/\bERROR\s*$/u.test(result)) throw new Error("clamav_scan_error");
  const clean = /:\s+OK$/u.test(result);
  const infected = /\bFOUND\s*$/u.test(result);
  if (!clean && !infected) throw new Error("clamav_invalid_response");
  return { clean, result, version: version.slice(0, 64) };
}

export class EvidenceProcessor {
  public constructor(
    private readonly database: DatabaseClient,
    private readonly config: RuntimeConfig,
  ) {}

  public async pingScanner(): Promise<boolean> {
    try {
      return (
        (await clamdCommand(this.config.clamavHost, this.config.clamavPort, "PING")) === "PONG"
      );
    } catch {
      return false;
    }
  }

  public async readiness(): Promise<boolean> {
    if (!(await this.pingScanner())) return false;
    try {
      await Promise.all([
        mkdir(this.config.quarantineRoot, { recursive: true, mode: 0o700 }),
        mkdir(this.config.evidenceRoot, { recursive: true, mode: 0o700 }),
      ]);
      await Promise.all([
        access(this.config.quarantineRoot, constants.R_OK | constants.W_OK),
        access(this.config.evidenceRoot, constants.R_OK | constants.W_OK),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  public async retryStuck(limit = 20): Promise<number> {
    const uploads = await this.database.uploadSession.findMany({
      where: {
        status: "processing",
        scanState: "failed",
        lastActivityAt: { lt: new Date(Date.now() - 60_000) },
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
      take: limit,
      orderBy: { lastActivityAt: "asc" },
    });
    for (const upload of uploads) await this.process(upload.id).catch(() => undefined);
    return uploads.length;
  }

  public async process(uploadId: string): Promise<void> {
    const upload = await this.database.uploadSession.findUnique({ where: { id: uploadId } });
    if (!upload || upload.status === "complete" || upload.status === "attached") return;
    if (
      upload.status !== "processing" ||
      !upload.expectedBytes ||
      upload.receivedBytes !== upload.expectedBytes
    )
      throw new Error("Upload is not ready for evidence processing");

    await this.database.uploadSession.update({
      where: { id: upload.id },
      data: { scanState: "scanning", scanEngine: "clamav", lastActivityAt: new Date() },
    });

    let scan: Awaited<ReturnType<typeof scanFile>>;
    try {
      scan = await scanFile(this.config.clamavHost, this.config.clamavPort, upload.quarantinePath);
    } catch (error) {
      await this.database.uploadSession.update({
        where: { id: upload.id },
        data: {
          scanState: "failed",
          scanResultCode: "scanner_unavailable",
          lastActivityAt: new Date(),
        },
      });
      throw error;
    }
    if (!scan.clean) {
      await this.database.uploadSession.update({
        where: { id: upload.id },
        data: {
          status: "rejected",
          scanState: "infected",
          scanEngine: "clamav",
          scanEngineVersion: scan.version,
          scanResultCode: "malware_detected",
          rejectionCode: "malware_detected",
          scannedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });
      return;
    }

    const sourceHandle = await open(upload.quarantinePath, "r");
    const header = Buffer.alloc(16);
    try {
      const { bytesRead } = await sourceHandle.read(header, 0, header.byteLength, 0);
      const kind = upload.kind as UploadKind;
      const detectedMimeType = detectMime(
        kind,
        header.subarray(0, bytesRead),
        upload.declaredMimeType,
      );
      if (!detectedMimeType) {
        await this.database.uploadSession.update({
          where: { id: upload.id },
          data: {
            status: "rejected",
            scanState: "clean",
            scanEngine: "clamav",
            scanEngineVersion: scan.version,
            scanResultCode: "clean",
            rejectionCode: "mime_mismatch",
            scannedAt: new Date(),
            lastActivityAt: new Date(),
          },
        });
        return;
      }

      const now = new Date();
      const storageDate = upload.createdAt;
      const finalPath = join(
        this.config.evidenceRoot,
        storageDate.getUTCFullYear().toString(),
        String(storageDate.getUTCMonth() + 1).padStart(2, "0"),
        upload.id,
        "ciphertext.bin",
      );
      const temporaryPath = `${finalPath}.tmp`;
      await mkdir(dirname(finalPath), { recursive: true, mode: 0o700 });
      await Promise.all([rm(temporaryPath, { force: true }), rm(finalPath, { force: true })]);

      const nonce = randomBytes(12);
      await writeFile(temporaryPath, Buffer.concat([nonce, Buffer.alloc(16)]), {
        mode: 0o600,
        flag: "wx",
      });
      const digest = createHash("sha256");
      const hashing = new Transform({
        transform(chunk: Buffer, _encoding, callback) {
          digest.update(chunk);
          callback(null, chunk);
        },
      });
      const cipher = createCipheriv(
        "aes-256-gcm",
        deriveKey(this.config.sessionSecret, `evidence:${upload.id}`),
        nonce,
      );
      cipher.setAAD(Buffer.from(`evidence:${upload.id}:${kind}`));
      await pipeline(
        createReadStream(upload.quarantinePath),
        hashing,
        cipher,
        createWriteStream(temporaryPath, { flags: "a", mode: 0o600 }),
      );
      const completed = await open(temporaryPath, "r+");
      try {
        await completed.write(cipher.getAuthTag(), 0, 16, 12);
        await completed.sync();
      } finally {
        await completed.close();
      }
      await rename(temporaryPath, finalPath);

      await this.database.uploadSession.update({
        where: { id: upload.id },
        data: {
          status: "complete",
          completedAt: now,
          finalObjectPath: finalPath,
          sha256Digest: digest.digest(),
          detectedMimeType,
          scanState: "clean",
          scanEngine: "clamav",
          scanEngineVersion: scan.version,
          scanResultCode: "clean",
          scannedAt: now,
          encryptionKeyId: this.config.encryptionKeyId,
          encryptionAlgorithm: "AES-256-GCM",
          lastActivityAt: now,
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      });
      await rm(upload.quarantinePath, { force: true });
    } catch (error) {
      await this.database.uploadSession.update({
        where: { id: upload.id },
        data: {
          scanState: "failed",
          scanResultCode: "processing_failed",
          lastActivityAt: new Date(),
        },
      });
      throw error;
    } finally {
      await sourceHandle.close();
    }
  }
}
