import { brandColors, feedbackColors, textColors, borderColors } from "./colors";
import { surfaces } from "./surfaces";

/** Aliases consumed by components. */
export const semanticColors = {
  pageWorker: surfaces.pageWorker,
  pageAdmin: surfaces.pageAdmin,
  surface: surfaces.surface,
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
  critical: feedbackColors.critical,
  textPrimary: textColors.primary,
  textSecondary: textColors.secondary,
  border: borderColors.default,
  onPrimary: "#FFFFFF",
  onInstitutional: "#FFFFFF",
} as const;
