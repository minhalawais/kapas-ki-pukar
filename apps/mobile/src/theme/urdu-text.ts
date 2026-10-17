import type { TextStyle } from "react-native";

/**
 * Naskh/Nastaliq glyphs hang below the Latin baseline.
 * Tight lineHeight or zero padding clips descenders on Android/iOS.
 */
export function urduLineHeight(fontSize: number, role: "ui" | "heading" = "ui"): number {
  return Math.round(fontSize * (role === "heading" ? 2.1 : 1.6));
}

export function urduSafeText(fontSize: number, role: "ui" | "heading" = "ui"): TextStyle {
  const isHeading = role === "heading";
  return {
    fontSize,
    lineHeight: urduLineHeight(fontSize, role),
    paddingTop: Math.round(fontSize * (isHeading ? 0.32 : 0.12)),
    paddingBottom: Math.round(fontSize * (isHeading ? 0.28 : 0.15)),
    includeFontPadding: true,
    writingDirection: "rtl",
  };
}

export function urduBrandText(fontSize: number): TextStyle {
  return {
    fontSize,
    lineHeight: Math.round(fontSize * 2.2),
    paddingTop: Math.round(fontSize * 0.35),
    paddingBottom: Math.round(fontSize * 0.2),
    // Nastaliq/Gulzar's initial Urdu glyph can overhang its measured RTL box.
    // Horizontal bearing space prevents the opening ک in the brand name clipping.
    paddingRight: Math.round(fontSize * 0.55),
    paddingLeft: Math.round(fontSize * 0.2),
    includeFontPadding: true,
    direction: "rtl",
    writingDirection: "rtl",
  };
}

export function localizedTextMetrics(
  locale: "en" | "ur",
  fontSize: number,
  lineHeight: number,
  role: "ui" | "heading" = "ui",
): TextStyle {
  return locale === "ur" ? urduSafeText(fontSize, role) : { fontSize, lineHeight, writingDirection: "ltr" };
}
