import type { ComplaintContext } from "./complaint";
import { higherPriority, type Priority } from "./priority";

export function getMinimumPriority(context: ComplaintContext): Priority {
  if (
    context.immediateDanger ||
    (context.pesticideSymptoms && context.immediateDanger) ||
    (context.harassmentThreat && context.immediateDanger)
  ) {
    return "Emergency";
  }
  if (context.category === "CHL" || context.category === "FOL") {
    return "Critical";
  }
  return "Standard";
}

export function reconcilePriority(aiSuggested: Priority, minimum: Priority): Priority {
  return higherPriority(aiSuggested, minimum);
}
