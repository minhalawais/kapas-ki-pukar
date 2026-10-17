export const motion = {
  instant: 80,
  fast: 120,
  standard: 180,
  panel: 240,
  data: 360,
  route: 200,
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  enter: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)",
} as const;

export const controlSize = {
  webButtonHeight: 36,
  webInputHeight: 40,
  mobileCtaHeight: 56,
  mobileCtaHeightMax: 64,
  microphoneMin: 72,
  microphoneMax: 88,
  answerCardMinHeight: 96,
  answerCardMaxHeight: 120,
  webTouchCompact: 36,
  mobileTouchMin: 56,
} as const;

export const elevation = {
  none: "none",
  sm: "0 1px 2px rgba(23, 35, 30, 0.06)",
  md: "0 4px 12px rgba(23, 35, 30, 0.08)",
} as const;
