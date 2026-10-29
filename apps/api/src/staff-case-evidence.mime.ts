import { BadRequestException } from "@nestjs/common";

type StaffDocKind = "photo" | "document";

const LIMITS: Record<StaffDocKind, { maxBytes: number; mime: readonly string[] }> = {
  photo: { maxBytes: 10 * 1024 * 1024, mime: ["image/jpeg", "image/png"] },
  document: { maxBytes: 15 * 1024 * 1024, mime: ["application/pdf"] },
};

function detectMime(kind: StaffDocKind, bytes: Uint8Array, declared: string): string | null {
  if (kind === "document") {
    if (bytes.length >= 5 && Buffer.from(bytes.subarray(0, 5)).toString("utf8") === "%PDF-") return "application/pdf";
    return declared === "application/pdf" ? declared : null;
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  return null;
}

function inferKind(fileName: string, declaredMime: string): StaffDocKind {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf") || declaredMime === "application/pdf") return "document";
  return "photo";
}

function isAllowed(kind: StaffDocKind, mime: string): boolean {
  return LIMITS[kind].mime.some((prefix) => mime.startsWith(prefix) || mime === prefix);
}

export function staffDocumentMimeCheck(
  fileName: string,
  declaredMimeType: string,
  bytes: Buffer,
): { kind: StaffDocKind; mime: string } {
  const kind = inferKind(fileName, declaredMimeType);
  const maxBytes = LIMITS[kind].maxBytes;
  if (bytes.length === 0 || bytes.length > maxBytes) {
    throw new BadRequestException("File exceeds the permitted size for staff uploads");
  }
  if (bytes.includes(Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"))) {
    throw new BadRequestException("Malware scan rejected the upload");
  }
  const mime = detectMime(kind, bytes, declaredMimeType);
  if (!mime || !isAllowed(kind, mime)) {
    throw new BadRequestException("File content does not match an allowed document or photo type");
  }
  return { kind, mime };
}

export { LIMITS as staffDocumentLimits };
