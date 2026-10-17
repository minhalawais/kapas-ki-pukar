export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999,
} as const;

export const radiusUsage = {
  webControl: radius.md,
  webCard: radius.lg,
  webChip: radius.full,
  mobileButton: 14,
  mobileCard: radius.xl,
  mobileAnswerCard: radius.xl,
  microphone: radius.full,
} as const;
