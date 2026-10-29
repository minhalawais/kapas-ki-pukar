import type { Ionicons } from "@expo/vector-icons";
import type { WorkerCategoryCode } from "@kapas/domain";
import type { ComponentProps } from "react";

export const workerCategoryIcons: Record<
  WorkerCategoryCode,
  ComponentProps<typeof Ionicons>["name"]
> = {
  WAG: "cash-outline",
  PES: "flask-outline",
  HSE: "medkit-outline",
  HAR: "hand-left-outline",
  CHL: "school-outline",
  FOL: "lock-closed-outline",
  CON: "people-outline",
  HRS: "time-outline",
  SAN: "water-outline",
  DIS: "scale-outline",
  OTH: "ellipsis-horizontal",
};

export function categoryIconFor(code: string): ComponentProps<typeof Ionicons>["name"] {
  return workerCategoryIcons[code as WorkerCategoryCode] ?? "document-text-outline";
}
