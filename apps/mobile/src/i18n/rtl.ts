import { COMPLAINT_ID_PATTERN, type Locale } from "@kapas/domain";

const LTR_ISOLATE_START = "\u2066";
const LTR_ISOLATE_END = "\u2069";

const MIRROR_ICON_IDS = new Set([
  "chevron-back",
  "chevron-forward",
  "arrow-left",
  "arrow-right",
  "back",
  "forward",
]);

const DO_NOT_MIRROR_ICON_IDS = new Set([
  "microphone",
  "camera",
  "lock",
  "location",
  "play",
  "warning",
  "kapas-mark",
]);

export function isRTL(locale: Locale): boolean {
  return locale === "ur";
}

export function directionalRow(_locale: Locale): "row" {
  return "row";
}

export function shouldMirrorIcon(iconId: string): boolean {
  return MIRROR_ICON_IDS.has(iconId) && !DO_NOT_MIRROR_ICON_IDS.has(iconId);
}

export function iconScaleX(iconId: string, locale: Locale): 1 | -1 {
  return isRTL(locale) && shouldMirrorIcon(iconId) ? -1 : 1;
}

export function isolateLtr(value: string): string {
  return `${LTR_ISOLATE_START}${value}${LTR_ISOLATE_END}`;
}

export function isolateComplaintId(value: string): string {
  if (!COMPLAINT_ID_PATTERN.test(value)) {
    return value;
  }
  return isolateLtr(value);
}
