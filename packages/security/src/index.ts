const sensitiveKeyPattern =
  /authorization|cookie|password|secret|token|session|cnic|phone|contact|coordinate|transcript|evidence|database.?url|redis.?url/i;

export const pinoRedactionPaths = Object.freeze([
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body",
  "res.headers.set-cookie",
  "config.databaseUrl",
  "config.redisUrl",
  "config.sessionSecret",
  "config.internalMetricsToken",
  "job.data",
]);

export function redactUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactUnknown);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[REDACTED]" : redactUnknown(nested),
      ]),
    );
  }
  return value;
}

export function assertSafeDestructiveEnvironment(nodeEnv: string, databaseUrl: string): void {
  if (nodeEnv === "production") {
    throw new Error("Destructive database utilities are disabled in production");
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!databaseName.endsWith("_test")) {
    throw new Error("Destructive database utilities require a database name ending in _test");
  }
}

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { hash, verify } from "@node-rs/argon2";

export const PASSWORD_POLICY = Object.freeze({
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
  minLength: 12,
});

export async function hashPassword(password: string): Promise<string> {
  if (password.length < PASSWORD_POLICY.minLength)
    throw new Error("Password does not meet minimum length");
  return hash(password, {
    algorithm: 2,
    memoryCost: PASSWORD_POLICY.memoryCost,
    timeCost: PASSWORD_POLICY.timeCost,
    parallelism: PASSWORD_POLICY.parallelism,
    outputLen: PASSWORD_POLICY.outputLen,
  });
}

export function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  return verify(encodedHash, password);
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashOpaqueToken(token: string, pepper: string): string {
  return createHmac("sha256", pepper).update(token).digest("hex");
}

export function createCsrfToken(sessionToken: string, pepper: string): string {
  return hashOpaqueToken(`csrf:${sessionToken}`, pepper);
}

export function deriveKey(secret: string, purpose: string): Uint8Array {
  return createHash("sha256").update(`${purpose}:${secret}`).digest();
}

export function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type EncryptedEnvelope = Readonly<{
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  tag: Uint8Array;
  keyId: string;
  algorithm: "AES-256-GCM";
}>;

export function encryptEnvelope(
  plaintext: Uint8Array,
  key: Uint8Array,
  keyId: string,
  associatedData: string,
): EncryptedEnvelope {
  if (key.byteLength !== 32) throw new Error("AES-256-GCM requires a 32-byte key");
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(associatedData, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { ciphertext, nonce, tag: cipher.getAuthTag(), keyId, algorithm: "AES-256-GCM" };
}

export function decryptEnvelope(
  envelope: EncryptedEnvelope,
  key: Uint8Array,
  associatedData: string,
): Uint8Array {
  if (key.byteLength !== 32) throw new Error("AES-256-GCM requires a 32-byte key");
  const decipher = createDecipheriv("aes-256-gcm", key, envelope.nonce);
  decipher.setAAD(Buffer.from(associatedData, "utf8"));
  decipher.setAuthTag(envelope.tag);
  return Uint8Array.from(Buffer.concat([decipher.update(envelope.ciphertext), decipher.final()]));
}

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let encoded = "";
  for (let offset = 0; offset < bits.length; offset += 5)
    encoded += alphabet[Number.parseInt(bits.slice(offset, offset + 5).padEnd(5, "0"), 2)];
  return encoded;
}

function base32Decode(value: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = value.replace(/=+$/g, "").toUpperCase();
  let bits = "";
  for (const character of normalized) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error("Invalid TOTP secret");
    bits += index.toString(2).padStart(5, "0");
  }
  const output: number[] = [];
  for (let offset = 0; offset + 8 <= bits.length; offset += 8)
    output.push(Number.parseInt(bits.slice(offset, offset + 8), 2));
  return Buffer.from(output);
}

export function verifyTotp(secret: string, code: string, now = Date.now(), window = 1): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const key = base32Decode(secret);
  const counter = Math.floor(now / 30_000);
  for (let delta = -window; delta <= window; delta += 1) {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter + delta));
    const digest = createHmac("sha1", key).update(buffer).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
    if (constantTimeEqual(String(value).padStart(6, "0"), code)) return true;
  }
  return false;
}

export function generateTotpCode(secret: string, now = Date.now()): string {
  const key = base32Decode(secret);
  const counter = Math.floor(now / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(value).padStart(6, "0");
}

export function normalizeLoginIdentifier(identifier: string): string {
  return identifier.trim().normalize("NFKC").toLowerCase();
}

export function fingerprint(value: string, pepper: string): string {
  return createHmac("sha256", pepper).update(value).digest("hex");
}

export type StaffPermission =
  | "case.read"
  | "case.mutate"
  | "identity.reveal"
  | "evidence.download"
  | "export.create"
  | "user.manage"
  | "audit.read";

export const rolePermissions: Readonly<Record<string, readonly StaffPermission[]>> = Object.freeze({
  grievance_manager: ["case.read", "case.mutate", "audit.read"],
  supervisor: [
    "case.read",
    "case.mutate",
    "identity.reveal",
    "evidence.download",
    "export.create",
    "audit.read",
  ],
  administrator: ["user.manage", "audit.read"],
  auditor_read_only: ["case.read", "audit.read"],
});

export function hasPermission(
  permissions: readonly StaffPermission[],
  required: StaffPermission,
): boolean {
  return permissions.includes(required);
}

export function assertPermission(
  permissions: readonly StaffPermission[],
  required: StaffPermission,
): void {
  if (!hasPermission(permissions, required)) {
    const error = new Error("Permission denied");
    error.name = "PermissionDeniedError";
    throw error;
  }
}
