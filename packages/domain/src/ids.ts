export const COMPLAINT_ID_PATTERN = /^KP-26-\d{6}$/;

export function trackingIdFromSequence(sequence: number): string {
  return `KP-26-${String(sequence).padStart(6, "0")}`;
}

export function nextComplaintTrackingId(existing: string[]): string {
  const used = new Set(existing);
  for (let sequence = 1; sequence <= 999999; sequence += 1) {
    const candidate = trackingIdFromSequence(sequence);
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  throw new Error("No unused KP-26 tracking id remains.");
}

export function demoPinFromTrackingId(trackingId: string): string {
  return trackingId.slice(-4);
}

export const locales = ["ur", "en"] as const;
export type Locale = (typeof locales)[number];

export type PermissionState = "granted" | "denied" | "undetermined";
