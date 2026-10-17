import { brandColors, feedbackColors, textColors, borderColors } from "./colors";
import { surfaces } from "./surfaces";

/** Aliases consumed by components. */
export const semanticColors = {
  pageWorker: surfaces.pageWorker,
  pageAdmin: surfaces.pageAdmin,
  surface: surfaces.surface,
  surfaceMuted: surfaces.surfaceMuted,
  institutionalAnchor: brandColors.puwfPrimary,
  actionPrimary: brandColors.kapasPrimary,
  actionSecondary: brandColors.fosTeal,
  voiceActive: brandColors.fosTeal,
  voiceActiveStrong: brandColors.fosTealDark,
  aiAccent: brandColors.fosTeal,
  aiSurface: surfaces.aiSurface,
  progressAccent: brandColors.cottonGold,
  progressSurface: surfaces.progressSurface,
  info: feedbackColors.info,
  infoSurface: surfaces.infoSurface,
  success: feedbackColors.success,
  warning: feedbackColors.warning,
  warningText: "#996800",
  warningSurface: surfaces.warningSurface,
  critical: feedbackColors.critical,
  criticalSurface: surfaces.criticalSurface,
  textPrimary: textColors.primary,
  textSecondary: textColors.secondary,
  border: borderColors.default,
  borderEssential: borderColors.essential,
  onPrimary: "#FFFFFF",
  onInstitutional: "#FFFFFF",
} as const;
