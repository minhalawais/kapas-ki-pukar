import type { Ionicons } from "@expo/vector-icons";
import type { SimplifiedRecordKind } from "@kapas/domain";
import type { MessageKey } from "@kapas/localization";
import type { ComponentProps } from "react";

export const caseStagePresentation: Record<
  SimplifiedRecordKind,
  {
    labelKey: MessageKey;
    shortLabelKey: MessageKey;
    icon: ComponentProps<typeof Ionicons>["name"];
  }
> = {
  "investigation-started": {
    labelKey: "complaints.progress.investigationStarted",
    shortLabelKey: "complaints.progress.short.investigationStarted",
    icon: "search-outline",
  },
  "record-contact": {
    labelKey: "complaints.progress.recordContact",
    shortLabelKey: "complaints.progress.short.recordContact",
    icon: "call-outline",
  },
  "record-worker-contact": {
    labelKey: "complaints.progress.recordWorkerContact",
    shortLabelKey: "complaints.progress.short.recordWorkerContact",
    icon: "person-outline",
  },
  "root-cause-analysis": {
    labelKey: "complaints.progress.rootCause",
    shortLabelKey: "complaints.progress.short.rootCause",
    icon: "analytics-outline",
  },
  "corrective-action-taken": {
    labelKey: "complaints.progress.correctiveAction",
    shortLabelKey: "complaints.progress.short.correctiveAction",
    icon: "construct-outline",
  },
  "close-complaint": {
    labelKey: "complaints.progress.closed",
    shortLabelKey: "complaints.progress.short.closed",
    icon: "checkmark-circle-outline",
  },
};
