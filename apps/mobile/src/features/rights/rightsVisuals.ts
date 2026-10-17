import { Ionicons } from "@expo/vector-icons";
import type { RightsTopicTone, RightsTopicVisual } from "@kapas/domain";
import type { ComponentProps } from "react";

import { semanticColors } from "../../theme/tokens";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const rightsIcon: Record<RightsTopicVisual, IconName> = {
  wages: "cash",
  pesticide: "flask",
  heat: "sunny",
  injury: "medkit",
  equality: "people",
  child: "school",
  freedom: "lock-open",
  facilities: "water",
  contract: "document-text",
  maternity: "woman",
  collective: "megaphone",
  compensation: "bandage",
  migrant: "navigate-circle",
};

export function rightsPalette(tone: RightsTopicTone) {
  if (tone === "red") {
    return { background: semanticColors.criticalSurface, foreground: semanticColors.critical, border: "#E5BDB7" };
  }
  if (tone === "gold") {
    return { background: semanticColors.progressSurface, foreground: semanticColors.warningText, border: "#E4D4A8" };
  }
  if (tone === "teal") {
    return { background: semanticColors.aiSurface, foreground: semanticColors.voiceActiveStrong, border: "#B9D9D5" };
  }
  return { background: semanticColors.surfaceMuted, foreground: semanticColors.actionPrimary, border: "#BDD2C4" };
}
