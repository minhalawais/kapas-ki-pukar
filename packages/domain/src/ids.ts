/** Readable references issued from production (year + 6-digit serial). */
export const COMPLAINT_ID_PATTERN = /^KP-\d{2}-\d{6}$/;

/** Pre-20261028 random hex references; kept for lookup on older complaints. */
export const LEGACY_COMPLAINT_REFERENCE_PATTERN =
  /^KP-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/;

/** Accepts current and legacy complainant reference formats. */
export const COMPLAINT_REFERENCE_PATTERN =
  /^KP-(\d{2}-\d{6}|[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4})$/;

export function isComplaintReference(value: string): boolean {
  return COMPLAINT_REFERENCE_PATTERN.test(value);
}

export function complaintReferenceYear(date = new Date()): string {
  return String(date.getUTCFullYear()).slice(-2);
}

export function trackingIdFromSequence(sequence: number, yearSuffix = complaintReferenceYear()): string {
  return `KP-${yearSuffix}-${String(sequence).padStart(6, "0")}`;
}

export function nextComplaintTrackingId(
  existing: string[],
  yearSuffix = complaintReferenceYear(),
): string {
  const used = new Set(existing);
  for (let sequence = 1; sequence <= 999_999; sequence += 1) {
    const candidate = trackingIdFromSequence(sequence, yearSuffix);
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  throw new Error(`No unused KP-${yearSuffix} reference remains.`);
}

/** Last four digits for helpline / voice read-back (works for readable and legacy refs). */
export function demoPinFromTrackingId(trackingId: string): string {
  const readable = trackingId.match(/^KP-\d{2}-(\d{6})$/);
  if (readable) return readable[1]!.slice(-4);
  const compact = trackingId.replace(/\D/g, "");
  if (compact.length >= 4) return compact.slice(-4);
  return trackingId.slice(-4);
}

export function parseReadableComplaintReference(
  reference: string,
): { prefix: string; serial: string; supportPin: string } | null {
  const match = reference.match(/^KP-(\d{2})-(\d{6})$/);
  if (!match) return null;
  const serial = match[2]!;
  return { prefix: `KP-${match[1]}`, serial, supportPin: serial.slice(-4) };
}

export function formatComplaintReferenceDisplay(reference: string): string {
  const parsed = parseReadableComplaintReference(reference);
  if (!parsed) return reference;
  return `${parsed.prefix}-${parsed.serial.slice(0, 3)}-${parsed.serial.slice(3)}`;
}

export const locales = ["ur", "en"] as const;
export type Locale = (typeof locales)[number];

export type PermissionState = "granted" | "denied" | "undetermined";
